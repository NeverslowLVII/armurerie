import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginDialog } from '@/components/LoginDialog';
import { ReactNode } from 'react';

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) => (
    open ? <div role="dialog">{children}</div> : null
  ),
  DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}));

describe('LoginDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onLogin: jest.fn(),
    error: null
  };

  it('affiche le formulaire de connexion correctement', () => {
    render(<LoginDialog {...mockProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('gère la connexion réussie', async () => {
    const user = userEvent.setup();
    render(<LoginDialog {...mockProps} />);

    await user.type(screen.getByLabelText(/mot de passe/i), 'patron123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockProps.onLogin).toHaveBeenCalledWith('patron123');
    });
  });

  it('affiche un message d\'erreur', async () => {
    const errorProps = {
      ...mockProps,
      error: 'Mot de passe incorrect'
    };
    
    render(<LoginDialog {...errorProps} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Mot de passe incorrect');
  });

  it('appelle onClose lors du clic sur Annuler', async () => {
    const user = userEvent.setup();
    render(<LoginDialog {...mockProps} />);

    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockProps.onClose).toHaveBeenCalled();
  });
}); 