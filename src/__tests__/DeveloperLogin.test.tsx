import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeveloperLogin from '@/components/DeveloperLogin';
import { ReactNode } from 'react';

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => (
    open ? <div role="dialog">{children}</div> : null
  ),
  DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children, className }: { children: ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
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
  Button: ({ children, type, onClick, className }: any) => (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DeveloperLogin Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    mockFetch.mockClear();
    defaultProps.onClose.mockClear();
    defaultProps.onSuccess.mockClear();
  });

  it('affiche le formulaire de connexion', () => {
    render(<DeveloperLogin {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('gère la soumission réussie du formulaire', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    const user = userEvent.setup();
    render(<DeveloperLogin {...defaultProps} />);

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'dev@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/developer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'dev@example.com',
          password: 'password123'
        }),
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('gère les erreurs d\'authentification', async () => {
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Identifiants invalides' })
      })
    );

    const user = userEvent.setup();
    render(<DeveloperLogin {...defaultProps} />);

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpass');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('appelle onClose lors du clic sur Annuler', async () => {
    const user = userEvent.setup();
    render(<DeveloperLogin {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
}); 