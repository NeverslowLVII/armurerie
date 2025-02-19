import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployeeManager from '@/components/EmployeeManager';
import { useAppDispatch } from '@/redux/hooks';
import { updateEmployee, deleteEmployee } from '@/redux/slices/employeeSlice';

// Mock @prisma/client
const Role = {
  EMPLOYEE: 'EMPLOYEE',
  CO_PATRON: 'CO_PATRON',
  PATRON: 'PATRON'
} as const;

jest.mock('@prisma/client', () => ({
  Role
}));

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
jest.mock('@headlessui/react', () => ({
  Dialog: ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null,
  'Dialog.Title': ({ children }: any) => <h2>{children}</h2>,
}));

// Mock redux hooks and actions
jest.mock('@/redux/hooks', () => ({
  useAppDispatch: jest.fn(),
}));

jest.mock('@/redux/slices/employeeSlice', () => ({
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: ({ type, value, onChange, className, required, disabled }: any) => (
    <input
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
  SelectNative: ({ value, onChange, children, className, required, disabled }: any) => (
    <select
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

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
window.confirm = mockConfirm;

describe('EmployeeManager Component', () => {
  const mockEmployees = {
    '1': {
      id: 1,
      name: 'John Doe',
      role: Role.EMPLOYEE,
      color: '#FF0000',
    },
    '2': {
      id: 2,
      name: 'Jane Smith',
      role: Role.CO_PATRON,
      color: '#00FF00',
    },
  };

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    employees: mockEmployees,
    onUpdate: jest.fn().mockResolvedValue(undefined),
  };

  const mockDispatch = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('renders correctly when open', () => {
    render(<EmployeeManager {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gérer les employés')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/rechercher un employé/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EmployeeManager {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Employee Addition', () => {
    it('handles adding a new employee successfully', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/nom de l'employé/i), 'New Employee');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/rôle/i), Role.EMPLOYEE);
      
      const colorInput = screen.getByLabelText(/couleur/i);
      await user.clear(colorInput);
      await user.type(colorInput, '#0000FF');

      // Submit the form
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(addButton);

      // Verify API call
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(updateEmployee({
          data: {
            name: 'New Employee',
            email: 'new@example.com',
            password: 'password123',
            color: '#0000FF',
            role: Role.EMPLOYEE,
          }
        }));
      });

      // Verify success message
      expect(await screen.findByText(/employé ajouté avec succès/i)).toBeInTheDocument();
    });

    it('handles errors when adding an employee', async () => {
      const user = userEvent.setup();
      mockDispatch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<EmployeeManager {...defaultProps} />);

      // Fill out and submit the form
      await user.type(screen.getByLabelText(/nom de l'employé/i), 'New Employee');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      // Verify error message
      expect(await screen.findByText(/erreur lors de l'ajout de l'employé/i)).toBeInTheDocument();
    });
  });

  describe('Employee Edition', () => {
    it('handles editing an employee successfully', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Modify employee data
      await user.clear(screen.getByLabelText(/nom de l'employé/i));
      await user.type(screen.getByLabelText(/nom de l'employé/i), 'Updated Name');
      await user.selectOptions(screen.getByLabelText(/rôle/i), Role.CO_PATRON);

      // Submit changes
      const updateButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(updateButton);

      // Verify API call
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(updateEmployee({
          id: 1,
          data: {
            name: 'Updated Name',
            color: expect.any(String),
            role: Role.CO_PATRON,
            id: mockEmployees['1'].id
          }
        }));
      });

      // Verify success message
      expect(await screen.findByText(/informations mises à jour avec succès/i)).toBeInTheDocument();
    });

    it('handles canceling employee edit', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Cancel edit
      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await user.click(cancelButton);

      // Verify form is reset
      expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Employee Deletion', () => {
    it('handles deleting an employee successfully', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValueOnce(true);
      
      render(<EmployeeManager {...defaultProps} />);

      // Click delete button
      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await user.click(deleteButton);

      // Verify confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer l\'employé John Doe ?');

      // Verify API call
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(deleteEmployee(1));
      });

      // Verify success message
      expect(await screen.findByText(/employé supprimé avec succès/i)).toBeInTheDocument();
    });

    it('cancels employee deletion when user declines', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValueOnce(false);
      
      render(<EmployeeManager {...defaultProps} />);

      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await user.click(deleteButton);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(defaultProps.onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('requires all fields when adding a new employee', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Try to submit without filling required fields
      const addButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(addButton);

      // Verify form validation
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    it('allows changing employee roles', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Change role
      const roleSelect = screen.getByLabelText(/rôle/i);
      await user.selectOptions(roleSelect, Role.PATRON);

      // Submit changes
      const updateButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(updateButton);

      // Verify API call includes role change
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
          payload: expect.objectContaining({
            data: expect.objectContaining({
              role: Role.PATRON
            })
          })
        }));
      });
    });
  });

  describe('Color Management', () => {
    it('allows changing employee color', async () => {
      const user = userEvent.setup();
      render(<EmployeeManager {...defaultProps} />);

      // Start editing
      const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
      await user.click(editButton);

      // Change color
      const colorInput = screen.getByLabelText(/couleur/i);
      await user.clear(colorInput);
      await user.type(colorInput, '#00FF00');

      // Submit changes
      const updateButton = screen.getByRole('button', { name: /mettre à jour/i });
      await user.click(updateButton);

      // Verify API call includes color change
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
          payload: expect.objectContaining({
            data: expect.objectContaining({
              color: '#00FF00'
            })
          })
        }));
      });
    });
  });

  describe('Loading States', () => {
    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: unknown) => void = () => {};
      mockDispatch.mockImplementationOnce(() => new Promise(resolve => {
        resolveUpdate = resolve;
      }));

      render(<EmployeeManager {...defaultProps} />);

      // Start form submission
      await user.type(screen.getByLabelText(/nom de l'employé/i), 'New Employee');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      // Verify form is disabled during submission
      expect(screen.getByLabelText(/nom de l'employé/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/mot de passe/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /ajout/i })).toBeDisabled();

      // Resolve the update
      resolveUpdate(undefined);

      // Verify form is enabled after submission
      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'employé/i)).not.toBeDisabled();
      });
    });
  });
}); 