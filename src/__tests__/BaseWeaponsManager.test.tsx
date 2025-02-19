import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseWeaponsManager } from '@/components/BaseWeaponsManager';
import { useData } from '@/context/DataContext';
import { createBaseWeapon, updateBaseWeapon, deleteBaseWeapon } from '@/services/api';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock headlessui/react Dialog
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogPortal: ({ children }: any) => <div>{children}</div>,
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ type, value, onChange, className, required, disabled, placeholder }: any) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
    />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, type }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  ),
}));

// Mock API functions
jest.mock('@/services/api', () => ({
  createBaseWeapon: jest.fn(),
  updateBaseWeapon: jest.fn(),
  deleteBaseWeapon: jest.fn(),
}));

// Mock DataContext
jest.mock('@/context/DataContext', () => ({
  useData: jest.fn(),
}));

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
window.confirm = mockConfirm;

describe('BaseWeaponsManager Component', () => {
  const mockBaseWeapons = [
    {
      id: 1,
      nom: 'Épée Légendaire',
      prix_defaut: 10000, // $100.00
      cout_production_defaut: 5000, // $50.00
    },
    {
      id: 2,
      nom: 'Arc Elfique',
      prix_defaut: 15000, // $150.00
      cout_production_defaut: 7500, // $75.00
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  const mockContextValue = {
    baseWeapons: mockBaseWeapons,
    refreshBaseWeapons: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useData as jest.Mock).mockReturnValue(mockContextValue);
  });

  it('renders correctly when open', () => {
    render(<BaseWeaponsManager {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gestionnaire d\'armes de base')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/rechercher une arme/i)).toBeInTheDocument();
    expect(screen.getByText('Épée Légendaire')).toBeInTheDocument();
    expect(screen.getByText('Arc Elfique')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BaseWeaponsManager {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Weapon Addition', () => {
    it('handles adding a new weapon successfully', async () => {
      const user = userEvent.setup();
      (createBaseWeapon as jest.Mock).mockResolvedValueOnce(undefined);
      
      render(<BaseWeaponsManager {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/nom de l'arme/i), 'Nouvelle Arme');
      await user.type(screen.getByLabelText(/prix par défaut/i), '100');
      await user.type(screen.getByLabelText(/coût de production/i), '50');

      // Submit the form
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(addButton);

      // Verify API call
      await waitFor(() => {
        expect(createBaseWeapon).toHaveBeenCalledWith({
          nom: 'Nouvelle Arme',
          prix_defaut: 10000, // $100.00
          cout_production_defaut: 5000, // $50.00
        });
      });

      // Verify success message and refresh
      expect(await screen.findByText(/arme de base ajoutée avec succès/i)).toBeInTheDocument();
      expect(mockContextValue.refreshBaseWeapons).toHaveBeenCalled();
    });

    it('handles errors when adding a weapon', async () => {
      const user = userEvent.setup();
      (createBaseWeapon as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(<BaseWeaponsManager {...defaultProps} />);

      // Fill out and submit the form
      await user.type(screen.getByLabelText(/nom de l'arme/i), 'Nouvelle Arme');
      await user.type(screen.getByLabelText(/prix par défaut/i), '100');
      await user.type(screen.getByLabelText(/coût de production/i), '50');
      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      // Verify error message
      expect(await screen.findByText(/erreur lors de l'ajout de l'arme de base/i)).toBeInTheDocument();
    });
  });

  describe('Weapon Edition', () => {
    it('handles editing a weapon successfully', async () => {
      const user = userEvent.setup();
      (updateBaseWeapon as jest.Mock).mockResolvedValueOnce(undefined);
      
      render(<BaseWeaponsManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Modify weapon data
      await user.clear(screen.getByLabelText(/nom de l'arme/i));
      await user.type(screen.getByLabelText(/nom de l'arme/i), 'Épée Modifiée');
      await user.clear(screen.getByLabelText(/prix par défaut/i));
      await user.type(screen.getByLabelText(/prix par défaut/i), '120');

      // Submit changes
      const updateButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(updateButton);

      // Verify API call
      await waitFor(() => {
        expect(updateBaseWeapon).toHaveBeenCalledWith(1, {
          nom: 'Épée Modifiée',
          prix_defaut: 12000,
          cout_production_defaut: 5000,
        });
      });

      // Verify success message
      expect(await screen.findByText(/arme de base mise à jour avec succès/i)).toBeInTheDocument();
    });

    it('handles canceling weapon edit', async () => {
      const user = userEvent.setup();
      render(<BaseWeaponsManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Cancel edit
      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await user.click(cancelButton);

      // Verify form is reset
      expect(screen.queryByDisplayValue('Épée Légendaire')).not.toBeInTheDocument();
    });
  });

  describe('Weapon Deletion', () => {
    it('handles deleting a weapon successfully', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValueOnce(true);
      (deleteBaseWeapon as jest.Mock).mockResolvedValueOnce(undefined);
      
      render(<BaseWeaponsManager {...defaultProps} />);

      // Click delete button
      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await user.click(deleteButton);

      // Verify confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer cette arme de base ?');

      // Verify API call
      await waitFor(() => {
        expect(deleteBaseWeapon).toHaveBeenCalledWith(1);
      });

      // Verify success message
      expect(await screen.findByText(/arme de base supprimée avec succès/i)).toBeInTheDocument();
    });

    it('cancels weapon deletion when user declines', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValueOnce(false);
      
      render(<BaseWeaponsManager {...defaultProps} />);

      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await user.click(deleteButton);

      expect(deleteBaseWeapon).not.toHaveBeenCalled();
      expect(mockContextValue.refreshBaseWeapons).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('filters weapons based on search query', async () => {
      const user = userEvent.setup();
      render(<BaseWeaponsManager {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/rechercher une arme/i);
      await user.type(searchInput, 'Épée');

      expect(screen.getByText('Épée Légendaire')).toBeInTheDocument();
      expect(screen.queryByText('Arc Elfique')).not.toBeInTheDocument();
    });

    it('shows "no weapons found" message when search has no results', async () => {
      const user = userEvent.setup();
      render(<BaseWeaponsManager {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/rechercher une arme/i);
      await user.type(searchInput, 'xxxxx');

      expect(screen.getByText('Aucune arme trouvée')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires all fields when adding a new weapon', async () => {
      const user = userEvent.setup();
      render(<BaseWeaponsManager {...defaultProps} />);

      // Try to submit without filling required fields
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(addButton);

      // Verify form validation
      expect(createBaseWeapon).not.toHaveBeenCalled();
    });

    it('validates price and cost inputs', async () => {
      const user = userEvent.setup();
      render(<BaseWeaponsManager {...defaultProps} />);

      // Try negative values
      await user.type(screen.getByLabelText(/prix par défaut/i), '-100');
      await user.type(screen.getByLabelText(/coût de production/i), '-50');

      // Submit form
      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      // Verify form validation
      expect(createBaseWeapon).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: unknown) => void = () => {};
      (createBaseWeapon as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
        resolveCreate = resolve;
      }));

      render(<BaseWeaponsManager {...defaultProps} />);

      // Fill out form
      await user.type(screen.getByLabelText(/nom de l'arme/i), 'Nouvelle Arme');
      await user.type(screen.getByLabelText(/prix par défaut/i), '100');
      await user.type(screen.getByLabelText(/coût de production/i), '50');

      // Submit form
      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      // Verify form is disabled during submission
      expect(screen.getByLabelText(/nom de l'arme/i)).toBeDisabled();
      expect(screen.getByLabelText(/prix par défaut/i)).toBeDisabled();
      expect(screen.getByLabelText(/coût de production/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /ajout/i })).toBeDisabled();

      // Resolve the creation
      resolveCreate(undefined);

      // Verify form is enabled after submission
      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'arme/i)).not.toBeDisabled();
      });
    });
  });

  describe('Profit Calculation', () => {
    it('displays correct profit margins', () => {
      render(<BaseWeaponsManager {...defaultProps} />);

      // Épée Légendaire: (100 - 50) / 100 * 100 = 50%
      expect(screen.getByText('Marge: 50.0%')).toBeInTheDocument();

      // Arc Elfique: (150 - 75) / 150 * 100 = 50%
      expect(screen.getByText('Marge: 50.0%')).toBeInTheDocument();
    });

    it('applies correct CSS classes based on profit margin', () => {
      render(<BaseWeaponsManager {...defaultProps} />);

      const profitElements = screen.getAllByText(/Marge:/);
      
      // Both weapons have 50% margin, should have amber color class
      profitElements.forEach(element => {
        expect(element.className).toContain('bg-amber-100');
      });
    });
  });
}); 