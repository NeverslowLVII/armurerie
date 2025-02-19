import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditWeaponForm from '@/components/EditWeaponForm';
import { useData } from '@/context/DataContext';
import { updateWeapon, Role } from '@/services/api';

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
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogPortal: ({ children }: any) => <div>{children}</div>,
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, className, required, disabled, readOnly }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
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

jest.mock('@/components/ui/select-native', () => ({
  SelectNative: ({ id, value, onChange, children, className, disabled }: any) => (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
    >
      {children}
    </select>
  ),
}));

// Mock API functions
jest.mock('@/services/api', () => ({
  updateWeapon: jest.fn(),
  Role: {
    EMPLOYEE: "EMPLOYEE",
    CO_PATRON: "CO_PATRON",
    PATRON: "PATRON"
  }
}));

// Mock DataContext
jest.mock('@/context/DataContext', () => ({
  useData: jest.fn(),
}));

describe('EditWeaponForm Component', () => {
  const mockWeapon = {
    id: 1,
    horodateur: '2024-02-15T10:00:00',
    employe_id: 1,
    detenteur: 'John Doe',
    nom_arme: 'Épée Légendaire',
    serigraphie: 'Dragon d\'Or',
    prix: 10000, // $100.00
    cout_production: 5000, // $50.00
    employee: {
      id: 1,
      name: 'Employee One',
      role: Role.EMPLOYEE,
      color: '#FF0000',
    }
  };

  const mockBaseWeapons = [
    {
      id: 1,
      nom: 'Épée Légendaire',
      prix_defaut: 10000,
      cout_production_defaut: 5000,
    },
    {
      id: 2,
      nom: 'Arc Elfique',
      prix_defaut: 15000,
      cout_production_defaut: 7500,
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    weapon: mockWeapon,
    onWeaponUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useData as jest.Mock).mockReturnValue({ baseWeapons: mockBaseWeapons });
  });

  it('renders correctly with weapon data', () => {
    render(<EditWeaponForm {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modifier une arme')).toBeInTheDocument();
    
    // Check form fields are initialized with weapon data
    expect(screen.getByLabelText(/date et heure/i)).toHaveValue('2024-02-15T10:00');
    expect(screen.getByLabelText(/employé/i)).toHaveValue('Employee One');
    expect(screen.getByLabelText(/détenteur/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/nom de l'arme/i)).toHaveValue('Épée Légendaire');
    expect(screen.getByLabelText(/sérigraphie/i)).toHaveValue('Dragon d\'Or');
    expect(screen.getByLabelText(/prix/i)).toHaveValue('100');
  });

  it('does not render when closed', () => {
    render(<EditWeaponForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Form Updates', () => {
    it('handles form field updates', async () => {
      const user = userEvent.setup();
      render(<EditWeaponForm {...defaultProps} />);

      // Update form fields
      await user.clear(screen.getByLabelText(/détenteur/i));
      await user.type(screen.getByLabelText(/détenteur/i), 'New Holder');
      await user.clear(screen.getByLabelText(/sérigraphie/i));
      await user.type(screen.getByLabelText(/sérigraphie/i), 'New Design');
      await user.clear(screen.getByLabelText(/prix/i));
      await user.type(screen.getByLabelText(/prix/i), '150');

      // Verify field values
      expect(screen.getByLabelText(/détenteur/i)).toHaveValue('New Holder');
      expect(screen.getByLabelText(/sérigraphie/i)).toHaveValue('New Design');
      expect(screen.getByLabelText(/prix/i)).toHaveValue('150');
    });

    it('handles base weapon selection', async () => {
      const user = userEvent.setup();
      render(<EditWeaponForm {...defaultProps} />);

      // Select a different base weapon
      const baseWeaponSelect = screen.getByLabelText(/arme de base/i);
      await user.selectOptions(baseWeaponSelect, '2'); // Select Arc Elfique

      // Verify weapon name and price are updated
      expect(screen.getByLabelText(/nom de l'arme/i)).toHaveValue('Arc Elfique');
      expect(screen.getByLabelText(/prix/i)).toHaveValue('150');
    });
  });

  describe('Form Submission', () => {
    it('handles successful weapon update', async () => {
      const user = userEvent.setup();
      (updateWeapon as jest.Mock).mockResolvedValueOnce(undefined);
      
      render(<EditWeaponForm {...defaultProps} />);

      // Update some fields
      await user.clear(screen.getByLabelText(/détenteur/i));
      await user.type(screen.getByLabelText(/détenteur/i), 'New Holder');
      await user.clear(screen.getByLabelText(/sérigraphie/i));
      await user.type(screen.getByLabelText(/sérigraphie/i), 'New Design');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(updateWeapon).toHaveBeenCalledWith(1, {
          horodateur: expect.any(String),
          employe_id: 1,
          detenteur: 'New Holder',
          nom_arme: 'Épée Légendaire',
          serigraphie: 'New Design',
          prix: 10000,
          cout_production: 0,
        });
      });

      // Verify success message and form closure
      expect(screen.getByText('Mise à jour réussie !')).toBeInTheDocument();
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('handles update errors', async () => {
      const user = userEvent.setup();
      (updateWeapon as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(<EditWeaponForm {...defaultProps} />);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(submitButton);

      // Verify error message
      expect(await screen.findByText(/erreur lors de la mise à jour de l'arme/i)).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('requires all mandatory fields', async () => {
      const user = userEvent.setup();
      render(<EditWeaponForm {...defaultProps} />);

      // Clear required fields
      await user.clear(screen.getByLabelText(/détenteur/i));
      await user.clear(screen.getByLabelText(/sérigraphie/i));
      await user.clear(screen.getByLabelText(/prix/i));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(submitButton);

      // Verify API wasn't called
      expect(updateWeapon).not.toHaveBeenCalled();
    });

    it('validates price input', async () => {
      const user = userEvent.setup();
      render(<EditWeaponForm {...defaultProps} />);

      // Try negative price
      await user.clear(screen.getByLabelText(/prix/i));
      await user.type(screen.getByLabelText(/prix/i), '-100');

      // Submit form
      await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

      // Verify API wasn't called
      expect(updateWeapon).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: unknown) => void = () => {};
      (updateWeapon as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
        resolveUpdate = resolve;
      }));

      render(<EditWeaponForm {...defaultProps} />);

      // Submit form
      await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

      // Verify form is disabled
      expect(screen.getByLabelText(/détenteur/i)).toBeDisabled();
      expect(screen.getByLabelText(/sérigraphie/i)).toBeDisabled();
      expect(screen.getByLabelText(/prix/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /mise à jour/i })).toBeDisabled();

      // Resolve the update
      resolveUpdate(undefined);

      // Verify form is enabled after submission
      await waitFor(() => {
        expect(screen.getByLabelText(/détenteur/i)).not.toBeDisabled();
      });
    });

    it('shows loading spinner during submission', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: unknown) => void = () => {};
      (updateWeapon as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
        resolveUpdate = resolve;
      }));

      render(<EditWeaponForm {...defaultProps} />);

      // Submit form
      await user.click(screen.getByRole('button', { name: /mettre à jour/i }));

      // Verify loading state
      expect(screen.getByText('Mise à jour...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mise à jour/i })).toBeDisabled();

      // Resolve the update
      resolveUpdate(undefined);

      // Verify loading state is removed
      await waitFor(() => {
        expect(screen.queryByText('Mise à jour...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    it('resets form on cancel', async () => {
      const user = userEvent.setup();
      render(<EditWeaponForm {...defaultProps} />);

      // Modify form fields
      await user.clear(screen.getByLabelText(/détenteur/i));
      await user.type(screen.getByLabelText(/détenteur/i), 'New Holder');

      // Click cancel
      await user.click(screen.getByRole('button', { name: /annuler/i }));

      // Verify form is closed
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('resets form state when weapon prop changes', async () => {
      const { rerender } = render(<EditWeaponForm {...defaultProps} />);

      const newWeapon = {
        ...mockWeapon,
        id: 2,
        detenteur: 'Different Holder',
        nom_arme: 'Different Weapon',
      };

      // Rerender with new weapon
      rerender(<EditWeaponForm {...defaultProps} weapon={newWeapon} />);

      // Verify form fields are updated
      expect(screen.getByLabelText(/détenteur/i)).toHaveValue('Different Holder');
      expect(screen.getByLabelText(/nom de l'arme/i)).toHaveValue('Different Weapon');
    });
  });
}); 