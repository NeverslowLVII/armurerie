import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackForm from '../components/FeedbackForm';
import { employeeStore } from '../stores/employeeStore';

// Mock the employee store
jest.mock('../stores/employeeStore', () => ({
  employeeStore: {
    getEmployee: jest.fn(),
  },
}));

// Mock headlessui/react Dialog
jest.mock('@headlessui/react', () => {
  const Dialog = ({ children, open }: any) => open ? <div role="dialog">{children}</div> : null;
  Dialog.Panel = ({ children }: any) => <div>{children}</div>;
  Dialog.Title = ({ children }: any) => <h2>{children}</h2>;
  return { Dialog };
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('FeedbackForm Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  const mockEmployee = {
    id: 1,
    name: 'John Doe',
    role: 'EMPLOYEE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    localStorageMock.getItem.mockReset();
    (employeeStore.getEmployee as jest.Mock).mockReset();
  });

  it('renders correctly when open', () => {
    render(<FeedbackForm {...defaultProps} />);
    
    // Check for form elements
    expect(screen.getByText('Soumettre un feedback')).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/titre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /soumettre/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<FeedbackForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking cancel button', async () => {
    const onClose = jest.fn();
    render(<FeedbackForm {...defaultProps} onClose={onClose} />);
    
    await userEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onClose).toHaveBeenCalled();
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('employee1');
      (employeeStore.getEmployee as jest.Mock).mockResolvedValue(mockEmployee);
      mockFetch.mockResolvedValue({ ok: true });
    });

    it('submits feedback successfully with employee info', async () => {
      render(<FeedbackForm {...defaultProps} />);
      
      // Fill out the form
      await userEvent.selectOptions(screen.getByLabelText(/type/i), 'BUG');
      await userEvent.type(screen.getByLabelText(/titre/i), 'Test Bug');
      await userEvent.type(screen.getByLabelText(/description/i), 'Test Description');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'BUG',
          title: 'Test Bug',
          description: 'Test Description',
          employeeId: mockEmployee.id,
        }),
      });
      
      // Verify form reset and close
      await waitFor(() => {
        expect(screen.getByLabelText(/titre/i)).toHaveValue('');
        expect(screen.getByLabelText(/description/i)).toHaveValue('');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('submits feedback without employee info when not logged in', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(<FeedbackForm {...defaultProps} />);
      
      // Fill out the form
      await userEvent.selectOptions(screen.getByLabelText(/type/i), 'FEATURE');
      await userEvent.type(screen.getByLabelText(/titre/i), 'Feature Request');
      await userEvent.type(screen.getByLabelText(/description/i), 'New Feature');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      // Verify API call without employeeId
      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'FEATURE',
          title: 'Feature Request',
          description: 'New Feature',
          employeeId: undefined,
        }),
      });
    });

    it('handles submission errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      render(<FeedbackForm {...defaultProps} />);
      
      // Fill out and submit the form
      await userEvent.selectOptions(screen.getByLabelText(/type/i), 'OTHER');
      await userEvent.type(screen.getByLabelText(/titre/i), 'Test');
      await userEvent.type(screen.getByLabelText(/description/i), 'Test');
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      // Verify error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error submitting feedback:',
          expect.any(Error)
        );
      });
      
      // Form should not be reset or closed
      expect(screen.getByLabelText(/titre/i)).toHaveValue('Test');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('validates required fields', async () => {
      render(<FeedbackForm {...defaultProps} />);
      
      // Try to submit without filling required fields
      await userEvent.click(screen.getByRole('button', { name: /soumettre/i }));
      
      // Verify that fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Form Types', () => {
    it('allows switching between different feedback types', async () => {
      render(<FeedbackForm {...defaultProps} />);
      
      const typeSelect = screen.getByLabelText(/type/i);
      
      // Test each type option
      await userEvent.selectOptions(typeSelect, 'BUG');
      expect(typeSelect).toHaveValue('BUG');
      
      await userEvent.selectOptions(typeSelect, 'FEATURE');
      expect(typeSelect).toHaveValue('FEATURE');
      
      await userEvent.selectOptions(typeSelect, 'OTHER');
      expect(typeSelect).toHaveValue('OTHER');
    });
  });
}); 