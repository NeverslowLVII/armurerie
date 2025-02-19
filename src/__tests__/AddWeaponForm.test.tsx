import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddWeaponForm from '@/components/AddWeaponForm';
import { useData } from '@/context/DataContext';
import { createWeapon, Employee, Role } from '@/services/api';

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div role="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, className, required, disabled }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={disabled}
    />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, type, onClick, className, disabled }: any) => (
    <button type={type} onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select-native', () => ({
  SelectNative: ({ id, value, onChange, children, className, required, disabled }: any) => (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={disabled}
    >
      {children}
    </select>
  ),
}));

// Mock API service
jest.mock('@/services/api', () => ({
  createWeapon: jest.fn(),
  Role: {
    EMPLOYEE: 'EMPLOYEE',
    CO_PATRON: 'CO_PATRON',
    PATRON: 'PATRON'
  }
}));

// Mock data
const mockEmployee: Employee = {
  id: 1,
  name: "Jean Dupont",
  color: "#FF0000",
  role: Role.EMPLOYEE
};

const mockBaseWeapons = [
  {
    id: 1,
    nom: "Épée Légendaire",
    prix_defaut: 10000,
    cout_production_defaut: 5000
  },
  {
    id: 2,
    nom: "Arc Elfique",
    prix_defaut: 15000,
    cout_production_defaut: 7500
  }
];

const mockContextValue = {
  employees: [mockEmployee],
  baseWeapons: mockBaseWeapons,
  loading: false,
  error: null,
  refreshWeapons: jest.fn(),
  refreshEmployees: jest.fn(),
  refreshBaseWeapons: jest.fn(),
  refreshAll: jest.fn()
};

// Mock DataContext
jest.mock('@/context/DataContext', () => ({
  useData: jest.fn()
}));

describe('AddWeaponForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onWeaponAdded: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useData as jest.Mock).mockReturnValue(mockContextValue);
  });

  it('affiche le formulaire d\'ajout d\'arme', () => {
    render(<AddWeaponForm {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/employé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arme de base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/détenteur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sérigraphie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prix/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('gère l\'ajout réussi d\'une arme', async () => {
    const user = userEvent.setup();
    (createWeapon as jest.Mock).mockResolvedValueOnce(undefined);
    
    render(<AddWeaponForm {...defaultProps} />);

    // Remplir le formulaire
    await user.selectOptions(screen.getByLabelText(/employé/i), '1');
    await user.selectOptions(screen.getByLabelText(/arme de base/i), '1');
    await user.type(screen.getByLabelText(/détenteur/i), 'Client Test');
    await user.type(screen.getByLabelText(/sérigraphie/i), 'Test Sérigraphie');

    // Soumettre le formulaire
    await user.click(screen.getByRole('button', { name: /ajouter/i }));

    // Vérifier que l'arme a été créée avec les bonnes données
    await waitFor(() => {
      expect(createWeapon).toHaveBeenCalledWith({
        employe_id: 1,
        detenteur: 'Client Test',
        nom_arme: 'Épée Légendaire',
        serigraphie: 'Test Sérigraphie',
        prix: 10000,
        cout_production: 5000,
        horodateur: expect.any(String)
      });
      expect(defaultProps.onWeaponAdded).toHaveBeenCalled();
    });

    // Vérifier que le formulaire se ferme après le succès
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('gère les erreurs lors de l\'ajout d\'une arme', async () => {
    const user = userEvent.setup();
    const error = new Error('Erreur de création');
    (createWeapon as jest.Mock).mockRejectedValueOnce(error);
    
    render(<AddWeaponForm {...defaultProps} />);

    // Remplir le formulaire
    await user.selectOptions(screen.getByLabelText(/employé/i), '1');
    await user.selectOptions(screen.getByLabelText(/arme de base/i), '1');
    await user.type(screen.getByLabelText(/détenteur/i), 'Client Test');
    await user.type(screen.getByLabelText(/sérigraphie/i), 'Test Sérigraphie');

    // Soumettre le formulaire
    await user.click(screen.getByRole('button', { name: /ajouter/i }));

    // Vérifier que l'erreur est affichée
    await waitFor(() => {
      expect(screen.getByText(/erreur lors de l'ajout de l'arme/i)).toBeInTheDocument();
    });

    // Vérifier que le formulaire ne se ferme pas
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('réinitialise le formulaire lors de l\'annulation', async () => {
    const user = userEvent.setup();
    render(<AddWeaponForm {...defaultProps} />);

    // Remplir le formulaire
    await user.selectOptions(screen.getByLabelText(/employé/i), '1');
    await user.selectOptions(screen.getByLabelText(/arme de base/i), '1');
    await user.type(screen.getByLabelText(/détenteur/i), 'Client Test');
    await user.type(screen.getByLabelText(/sérigraphie/i), 'Test Sérigraphie');

    // Cliquer sur Annuler
    await user.click(screen.getByRole('button', { name: /annuler/i }));

    // Vérifier que le formulaire est fermé
    expect(defaultProps.onClose).toHaveBeenCalled();

    // Rouvrir le formulaire
    render(<AddWeaponForm {...defaultProps} />);

    // Vérifier que les champs sont vides
    expect(screen.getByLabelText(/détenteur/i)).toHaveValue('');
    expect(screen.getByLabelText(/sérigraphie/i)).toHaveValue('');
  });

  it('met à jour le prix automatiquement lors de la sélection d\'une arme de base', async () => {
    const user = userEvent.setup();
    render(<AddWeaponForm {...defaultProps} />);

    // Sélectionner une arme de base
    await user.selectOptions(screen.getByLabelText(/arme de base/i), '1');

    // Vérifier que le prix est mis à jour
    expect(screen.getByLabelText(/prix/i)).toHaveValue(100);

    // Sélectionner une autre arme de base
    await user.selectOptions(screen.getByLabelText(/arme de base/i), '2');

    // Vérifier que le prix est mis à jour
    expect(screen.getByLabelText(/prix/i)).toHaveValue(150);
  });
}); 