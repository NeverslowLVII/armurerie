import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeaponsTable from '@/components/WeaponsTable';
import { useData } from '@/context/DataContext';
import { Weapon, BaseWeapon, Employee, Role, deleteWeapon } from '@/services/api';
import { waitFor } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, className, placeholder }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// Mock EmployeeManager component
jest.mock('@/components/EmployeeManager', () => ({
  __esModule: true,
  default: () => <div data-testid="employee-manager">Employee Manager Mock</div>,
}));

// Mock data
const mockEmployee: Employee = {
  id: 1,
  name: "Jean Dupont",
  color: "#FF0000",
  role: Role.EMPLOYEE
};

const mockWeapons: Weapon[] = [
  {
    id: 1,
    horodateur: new Date().toISOString(),
    employe_id: 1,
    detenteur: "Client A",
    nom_arme: "Épée Légendaire",
    serigraphie: "Dragon d'Or",
    prix: 100,
    cout_production: 50,
    employee: mockEmployee
  },
  {
    id: 2,
    horodateur: new Date().toISOString(),
    employe_id: 1,
    detenteur: "Client B",
    nom_arme: "Arc Elfique",
    serigraphie: "Feuilles d'Argent",
    prix: 150,
    cout_production: 75,
    employee: mockEmployee
  },
  {
    id: 3,
    horodateur: new Date().toISOString(),
    employe_id: 1,
    detenteur: "Client C",
    nom_arme: "Hache de Guerre",
    serigraphie: "Runes Anciennes",
    prix: 120,
    cout_production: 60,
    employee: mockEmployee
  }
];

const mockContextValue = {
  weapons: mockWeapons,
  employees: [mockEmployee],
  baseWeapons: [],
  loading: false,
  error: null,
  refreshWeapons: jest.fn().mockResolvedValue(undefined),
  refreshEmployees: jest.fn().mockResolvedValue(undefined),
  refreshBaseWeapons: jest.fn().mockResolvedValue(undefined),
  refreshAll: jest.fn().mockResolvedValue(undefined),
};

// Mock DataContext
jest.mock('@/context/DataContext', () => ({
  useData: jest.fn()
}));

// Mock API service
jest.mock('@/services/api', () => ({
  deleteWeapon: jest.fn(),
  Role: {
    EMPLOYEE: 'EMPLOYEE',
    CO_PATRON: 'CO_PATRON',
    PATRON: 'PATRON'
  }
}));

describe('WeaponsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useData as jest.Mock).mockReturnValue(mockContextValue);
    // Reset localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('affiche le tableau des armes avec les données', () => {
    render(<WeaponsTable />);
    
    // Vérifie les en-têtes du tableau
    expect(screen.getByText(/nom de l'arme/i)).toBeInTheDocument();
    expect(screen.getByText(/détenteur/i)).toBeInTheDocument();
    expect(screen.getByText(/prix/i)).toBeInTheDocument();
    
    // Vérifie si les armes sont affichées
    mockWeapons.forEach(weapon => {
      expect(screen.getByText(weapon.nom_arme)).toBeInTheDocument();
      expect(screen.getByText(weapon.detenteur)).toBeInTheDocument();
      expect(screen.getByText((weapon.prix / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))).toBeInTheDocument();
    });
  });

  it('permet de filtrer les armes par recherche', async () => {
    const user = userEvent.setup();
    render(<WeaponsTable />);

    // Wait for initial render
    await screen.findByText('Épée Légendaire');

    const searchInput = screen.getByPlaceholderText(/rechercher/i);
    await user.type(searchInput, 'Épée');

    // Wait for the filtering to complete
    await screen.findByText('Épée Légendaire');

    // Verify that only the matching weapon is shown
    expect(screen.getByText('Épée Légendaire')).toBeInTheDocument();
    expect(screen.queryByText('Arc Elfique')).not.toBeInTheDocument();
    expect(screen.queryByText('Hache de Guerre')).not.toBeInTheDocument();
  });

  it('affiche l\'état de chargement', () => {
    (useData as jest.Mock).mockReturnValue({
      ...mockContextValue,
      loading: true
    });
    
    render(<WeaponsTable />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('affiche les messages d\'erreur', () => {
    const errorMessage = 'Erreur de chargement des armes';
    (useData as jest.Mock).mockReturnValue({
      ...mockContextValue,
      error: errorMessage
    });
    
    render(<WeaponsTable />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calcule correctement les statistiques', () => {
    render(<WeaponsTable />);

    // Vérifie le nombre d'entrées affichées
    const totalEntries = mockWeapons.length;
    expect(screen.getByText(`Affichage de 1 à ${totalEntries} sur ${totalEntries} entrées`)).toBeInTheDocument();
  });

  it('gère la connexion et déconnexion du patron', async () => {
    const user = userEvent.setup();
    render(<WeaponsTable />);

    // Test connexion
    const loginButton = screen.getByText(/connexion patron/i);
    await user.click(loginButton);
    
    // Simulate successful login
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    await user.type(passwordInput, 'patron123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    // Verify logged in state
    expect(screen.getByText(/déconnexion/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('patronAuth')).toBe('true');

    // Test déconnexion
    await user.click(screen.getByText(/déconnexion/i));
    expect(screen.getByText(/connexion patron/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('patronAuth')).toBe(null);
  });

  it('gère la suppression d\'une arme', async () => {
    const user = userEvent.setup();
    (deleteWeapon as jest.Mock).mockResolvedValueOnce(undefined);

    const confirmSpy = jest.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    // Set patron as logged in
    window.localStorage.setItem('patronAuth', 'true');
    render(<WeaponsTable />);

    // Find and click delete button for first weapon
    const rows = screen.getAllByRole('row');
    const firstRow = rows[1]; // First data row (after header)
    const deleteButton = within(firstRow).getByRole('button', { name: "Supprimer l'arme" }); // Delete button
    await user.click(deleteButton);

    // Wait for the delete operation to complete
    await waitFor(() => {
      expect(deleteWeapon).toHaveBeenCalledWith(mockWeapons[0].id);
      expect(mockContextValue.refreshWeapons).toHaveBeenCalled();
    });

    // Clean up
    confirmSpy.mockRestore();
  });

  it('gère l\'édition d\'une arme', async () => {
    const user = userEvent.setup();
    
    // Set patron as logged in
    window.localStorage.setItem('patronAuth', 'true');
    render(<WeaponsTable />);

    // Find and click edit button for first weapon
    const editButtons = screen.getAllByRole('button', { name: "Modifier l'arme" }); // PencilIcon buttons
    await user.click(editButtons[0]); // First button in each row is edit

    // Verify edit form is opened
    expect(screen.getByTestId('edit-weapon-form')).toBeInTheDocument();
  });

  it('gère la pagination', async () => {
    const user = userEvent.setup();
    const manyWeapons = Array.from({ length: 15 }, (_, index) => ({
      ...mockWeapons[0],
      id: index + 1,
      nom_arme: `Weapon ${index + 1}`
    }));

    (useData as jest.Mock).mockReturnValue({
      ...mockContextValue,
      weapons: manyWeapons
    });

    render(<WeaponsTable />);

    // Verify first page
    expect(screen.getByText('Weapon 1')).toBeInTheDocument();
    expect(screen.queryByText('Weapon 11')).not.toBeInTheDocument();

    // Go to next page
    await user.click(screen.getByRole('button', { name: /suivant/i }));

    // Verify second page
    expect(screen.queryByText('Weapon 1')).not.toBeInTheDocument();
    expect(screen.getByText('Weapon 11')).toBeInTheDocument();
  });

  it('gère les erreurs de suppression', async () => {
    const user = userEvent.setup();
    const error = new Error('Erreur de suppression');
    (deleteWeapon as jest.Mock).mockRejectedValueOnce(error);

    // Mock window.confirm and alert
    const confirmSpy = jest.spyOn(window, 'confirm');
    const alertSpy = jest.spyOn(window, 'alert');
    confirmSpy.mockImplementation(() => true);
    alertSpy.mockImplementation(() => {});

    // Set patron as logged in
    window.localStorage.setItem('patronAuth', 'true');
    render(<WeaponsTable />);

    // Find and click delete button for first weapon
    const rows = screen.getAllByRole('row');
    const firstRow = rows[1]; // First data row (after header)
    const deleteButton = within(firstRow).getByRole('button', { name: "Supprimer l'arme" }); // Delete button
    await user.click(deleteButton);

    // Wait for the error alert to be shown
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(`Erreur lors de la suppression : ${error.message}`);
    });

    // Clean up
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
}); 