import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackManager from '../components/FeedbackManager';

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
jest.mock('@headlessui/react', () => {
  const Dialog = ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null;
  Dialog.Panel = ({ children }: any) => <div>{children}</div>;
  Dialog.Title = ({ children }: any) => <h2>{children}</h2>;
  return { Dialog };
});

// Mock DeveloperLogin component
jest.mock('../components/DeveloperLogin', () => ({
  __esModule: true,
  default: ({ onSuccess, onClose }: any) => (
    <div data-testid="developer-login">
      <button onClick={() => onSuccess()}>Login</button>
      <button onClick={() => onClose()}>Cancel</button>
    </div>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.confirm
const mockConfirm = jest.fn(() => true);
window.confirm = mockConfirm;

describe('FeedbackManager Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  const mockFeedbacks = [
    {
      id: 1,
      type: 'BUG',
      title: 'Test Bug',
      description: 'Bug Description',
      status: 'OPEN',
      createdAt: '2024-02-15T10:00:00',
      employee: {
        name: 'John Doe',
        color: '#FF0000',
      },
    },
    {
      id: 2,
      type: 'FEATURE_REQUEST',
      title: 'Test Feature',
      description: 'Feature Description',
      status: 'IN_PROGRESS',
      createdAt: '2024-02-15T11:00:00',
      employee: {
        name: 'Jane Smith',
        color: '#00FF00',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockConfirm.mockReset();
  });

  describe('Developer Authentication', () => {
    it('checks developer status on mount', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true }));
      
      render(<FeedbackManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/developer');
      });
    });

    it('shows developer login when not authenticated', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: false }));
      
      render(<FeedbackManager {...defaultProps} />);
      
      const loginButton = screen.getByText(/connexion développeur/i);
      await userEvent.click(loginButton);
      
      expect(screen.getByTestId('developer-login')).toBeInTheDocument();
    });

    it('handles successful developer login', async () => {
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ ok: false })) // Initial check
        .mockImplementationOnce(() => Promise.resolve({ ok: true })) // Fetch feedbacks
        .mockImplementationOnce(() => Promise.resolve({ // Feedbacks data
          ok: true,
          json: () => Promise.resolve(mockFeedbacks),
        }));
      
      render(<FeedbackManager {...defaultProps} />);
      
      // Click login button and simulate successful login
      const loginButton = screen.getByText(/connexion développeur/i);
      await userEvent.click(loginButton);
      await userEvent.click(screen.getByText('Login'));
      
      // Should fetch feedbacks after successful login
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feedback');
      });
    });
  });

  describe('Feedback List', () => {
    beforeEach(() => {
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({ ok: true })) // Developer check
        .mockImplementationOnce(() => Promise.resolve({ // Feedbacks data
          ok: true,
          json: () => Promise.resolve(mockFeedbacks),
        }));
    });

    it('displays feedback list for developers', async () => {
      render(<FeedbackManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Bug')).toBeInTheDocument();
        expect(screen.getByText('Test Feature')).toBeInTheDocument();
      });
    });

    it('allows filtering feedbacks', async () => {
      render(<FeedbackManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      await userEvent.type(searchInput, 'bug');
      
      await waitFor(() => {
        expect(screen.getByText('Test Bug')).toBeInTheDocument();
        expect(screen.queryByText('Test Feature')).not.toBeInTheDocument();
      });
    });

    it('handles feedback status updates', async () => {
      render(<FeedbackManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Bug')).toBeInTheDocument();
      });

      // Find and change status
      const statusSelect = screen.getAllByLabelText(/statut/i)[0];
      await userEvent.selectOptions(statusSelect, 'IN_PROGRESS');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 1,
            status: 'IN_PROGRESS',
          }),
        });
      });
    });

    it('handles feedback deletion', async () => {
      mockConfirm.mockReturnValue(true);
      
      render(<FeedbackManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Bug')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await userEvent.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feedback?id=1', {
          method: 'DELETE',
        });
      });
    });

    it('cancels feedback deletion when user declines', async () => {
      mockConfirm.mockReturnValue(false);
      
      render(<FeedbackManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Bug')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByRole('button', { name: /supprimer/i })[0];
      await userEvent.click(deleteButton);
      
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/feedback'), {
        method: 'DELETE',
      });
    });
  });

  describe('Feedback Submission', () => {
    beforeEach(() => {
      mockFetch.mockImplementation((url) => {
        if (url === '/api/auth/developer') {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFeedbacks),
        });
      });
    });

    it('submits new feedback successfully', async () => {
      render(<FeedbackManager {...defaultProps} employeeId={1} />);
      
      // Fill out the form
      await userEvent.type(screen.getByLabelText(/titre/i), 'New Bug');
      await userEvent.type(screen.getByLabelText(/description/i), 'New Description');
      await userEvent.selectOptions(screen.getByLabelText(/type/i), 'BUG');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Bug',
            description: 'New Description',
            type: 'BUG',
            status: 'OPEN',
            employeeId: 1,
          }),
        });
      });
      
      // Check for success message
      expect(screen.getByText(/soumis avec succès/i)).toBeInTheDocument();
    });

    it('handles submission errors', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true })) // Developer check
        .mockImplementationOnce(() => Promise.resolve({ ok: true })) // Initial feedbacks
        .mockImplementationOnce(() => Promise.reject(new Error('API Error'))); // Submission error
      
      render(<FeedbackManager {...defaultProps} />);
      
      // Fill out and submit the form
      await userEvent.type(screen.getByLabelText(/titre/i), 'New Bug');
      await userEvent.type(screen.getByLabelText(/description/i), 'New Description');
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/erreur lors de la soumission/i)).toBeInTheDocument();
      });
    });
  });
}); 