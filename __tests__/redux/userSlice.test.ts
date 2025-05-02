import userReducer, {
  fetchUsers,
  updateUser,
  deleteUser,
  mergeUsers,
  setInitialized,
  type User,
} from '@/redux/slices/userSlice';
import { Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const initialState: {
  users: Record<string, User>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
} = {
  users: {},
  loading: false,
  error: null,
  initialized: false,
};

const mockUser1: User = {
  id: 1,
  name: 'Alice',
  username: 'alice_user',
  color: 'blue',
  role: Role.EMPLOYEE,
  email: 'alice@example.com',
};

const mockUser2: User = {
  id: 2,
  name: 'Bob',
  username: 'bob_user',
  color: 'green',
  role: Role.PATRON,
  email: 'bob@example.com',
};

describe('userSlice Reducers', () => {
  // Test pour le reducer setInitialized
  it('should handle setInitialized', () => {
    const state = userReducer(initialState, setInitialized(true));
    expect(state.initialized).toBe(true);

    const state2 = userReducer(state, setInitialized(false));
    expect(state2.initialized).toBe(false);
  });

  // Tests pour les extraReducers de fetchUsers
  describe('fetchUsers extraReducers', () => {
    it('should handle fetchUsers.pending', () => {
      const state = userReducer(initialState, fetchUsers.pending(''));
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fetchUsers.fulfilled', () => {
      const usersPayload = [mockUser1, mockUser2];
      const action = { type: fetchUsers.fulfilled.type, payload: usersPayload };
      const state = userReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(true);
      expect(state.users).toEqual({
        [mockUser1.name]: mockUser1,
        [mockUser2.name]: mockUser2,
      });
      expect(state.error).toBeNull();
    });

    it('should handle fetchUsers.rejected', () => {
      const error = new Error('Fetch failed');
      const action = { type: fetchUsers.rejected.type, error };
      const state = userReducer({ ...initialState, loading: true }, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Fetch failed');
      // L'état initialisé ne devrait pas changer en cas d'erreur
      expect(state.initialized).toBe(false);
    });

    it('should use default error message if none provided on rejected', () => {
      const action = { type: fetchUsers.rejected.type, error: {} }; // Pas de message
      const state = userReducer({ ...initialState, loading: true }, action);
      expect(state.error).toBe('Failed to fetch users');
    });
  });

  // Tests pour updateUser
  describe('updateUser extraReducers', () => {
    it('should handle updateUser.pending', () => {
      const state = userReducer(
        initialState,
        updateUser.pending('', { data: {} })
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle updateUser.fulfilled (update existing)', () => {
      const initialStateWithUser: {
        users: Record<string, User>;
        loading: boolean;
        error: string | null;
        initialized: boolean;
      } = {
        ...initialState,
        users: { [mockUser1.name]: mockUser1 },
      };
      const updatedUser = { ...mockUser1, color: 'red' };
      const action = { type: updateUser.fulfilled.type, payload: updatedUser };
      const state = userReducer(initialStateWithUser, action);

      expect(state.loading).toBe(false);
      expect(state.users[mockUser1.name]).toEqual(updatedUser);
      expect(state.error).toBeNull();
    });

    it('should handle updateUser.fulfilled (add new)', () => {
      const action = { type: updateUser.fulfilled.type, payload: mockUser1 };
      const state = userReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.users[mockUser1.name]).toEqual(mockUser1);
    });

    it('should handle updateUser.rejected', () => {
      const error = new Error('Update failed');
      const action = { type: updateUser.rejected.type, error };
      const state = userReducer({ ...initialState, loading: true }, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Update failed');
    });
  });

  // Tests pour deleteUser
  describe('deleteUser extraReducers', () => {
    const initialStateWithUsers: {
      users: Record<string, User>;
      loading: boolean;
      error: string | null;
      initialized: boolean;
    } = {
      ...initialState,
      users: { [mockUser1.name]: mockUser1, [mockUser2.name]: mockUser2 },
    };

    it('should handle deleteUser.pending', () => {
      const state = userReducer(
        initialStateWithUsers,
        deleteUser.pending('', mockUser1.id)
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle deleteUser.fulfilled', () => {
      // Correction: la payload pour deleteUser est l'ID de l'utilisateur supprimé
      // Mais le reducer semble utiliser le nom comme clé. Il faut identifier l'utilisateur par ID puis supprimer par nom.
      // On simule donc que l'action renvoie le nom de l'utilisateur à supprimer basé sur l'ID passé au thunk.
      // Ceci expose une faiblesse potentielle dans le reducer actuel si les noms ne sont pas uniques
      // ou si on supprime par ID et non par nom.
      // Pour le test, on suppose que la logique trouve le bon nom.
      const userToDeleteName = mockUser1.name;
      const action = {
        type: deleteUser.fulfilled.type,
        payload: userToDeleteName,
      };
      const state = userReducer(initialStateWithUsers, action);

      expect(state.loading).toBe(false);
      expect(state.users[mockUser1.name]).toBeUndefined();
      expect(state.users[mockUser2.name]).toEqual(mockUser2); // L'autre utilisateur reste
      expect(state.error).toBeNull();
    });

    it('should handle deleteUser.rejected', () => {
      const error = new Error('Delete failed');
      const action = { type: deleteUser.rejected.type, error };
      const state = userReducer(
        { ...initialStateWithUsers, loading: true },
        action
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Delete failed');
      expect(state.users[mockUser1.name]).toEqual(mockUser1); // L'utilisateur n'est pas supprimé
    });
  });

  // Tests pour mergeUsers
  describe('mergeUsers extraReducers', () => {
    const initialStateWithUsers: {
      users: Record<string, User>;
      loading: boolean;
      error: string | null;
      initialized: boolean;
    } = {
      ...initialState,
      users: {
        Alice: mockUser1, // ID 1
        Bob: mockUser2, // ID 2
        Charlie: {
          ...mockUser1,
          id: 3,
          name: 'Charlie',
          email: 'charlie@example.com',
        }, // ID 3
      },
    };
    const mergedUserName = 'Charlie';
    const targetUser: User = {
      ...mockUser1,
      id: 3,
      name: mergedUserName,
      color: 'yellow',
    };
    const usersToMergeNames = ['Alice', 'Bob'];

    it('should handle mergeUsers.fulfilled', () => {
      const payload = { names: usersToMergeNames, targetUser: targetUser };
      const action = { type: mergeUsers.fulfilled.type, payload };
      const state = userReducer(initialStateWithUsers, action);

      expect(state.users.Alice).toBeUndefined();
      expect(state.users.Bob).toBeUndefined();
      expect(state.users.Charlie).toEqual(targetUser);
      expect(Object.keys(state.users).length).toBe(1);
    });

    it('should handle mergeUsers.fulfilled when targetUser is null or undefined (should not happen ideally)', () => {
      const payload = { names: usersToMergeNames, targetUser: null }; // Simuler un retour API inattendu
      // Define a type for the expected payload structure
      type MergeFulfilledPayload = { names: string[]; targetUser: User | null };
      const action = {
        type: mergeUsers.fulfilled.type,
        payload: payload as MergeFulfilledPayload, // Use the defined type
      };
      const state = userReducer(initialStateWithUsers, action);

      expect(state.users.Alice).toBeUndefined();
      expect(state.users.Bob).toBeUndefined();
      expect(state.users.Charlie).toBeDefined();
      expect(Object.keys(state.users).length).toBe(1);
    });

    // Note: Les cas pending/rejected pour mergeUsers ne sont pas définis dans le slice,
    // donc pas besoin de les tester explicitement ici (ils ne feraient rien).
  });
});
