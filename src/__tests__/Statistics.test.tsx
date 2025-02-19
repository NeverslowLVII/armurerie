import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Statistics from '@/components/Statistics';
import { getWeapons, getEmployees } from '@/services/api';
import { formatCurrency, formatDate, formatPercentage } from '../utils/format';

// Mock the API functions
jest.mock('@/services/api', () => ({
  getWeapons: jest.fn(),
  getEmployees: jest.fn(),
  Role: {
    EMPLOYEE: 'EMPLOYEE',
    CO_PATRON: 'CO_PATRON',
    PATRON: 'PATRON'
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock data
const mockWeapons = [
  {
    id: 1,
    nom_arme: 'Épée',
    prix: 100000, // $1000.00
    horodateur: '2025-01-20T10:00:00Z',
    base_weapon: {
      cout_production_defaut: 40000 // $400.00
    },
    employee: {
      name: 'John'
    }
  },
  {
    id: 2,
    nom_arme: 'Hache',
    prix: 200000, // $2000.00
    horodateur: '2025-01-21T10:00:00Z',
    base_weapon: {
      cout_production_defaut: 80000 // $800.00
    },
    employee: {
      name: 'Jane'
    }
  }
];

const mockEmployees = [
  {
    id: 1,
    name: 'John',
    role: 'EMPLOYEE'
  },
  {
    id: 2,
    name: 'Jane',
    role: 'CO_PATRON'
  }
];

describe('Statistics Component', () => {
  beforeEach(() => {
    (getWeapons as jest.Mock).mockResolvedValue(mockWeapons);
    (getEmployees as jest.Mock).mockResolvedValue(mockEmployees);
    localStorageMock.getItem.mockReturnValue('true');
  });

  const findByTextContent = (text: string) => {
    return screen.getByText((content, element) => {
      if (!element || !content) return false;
      const elementText = element.textContent || '';
      return elementText.includes(text);
    });
  };

  it('displays statistics when authenticated', async () => {
    render(<Statistics />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Verify total sales
    await waitFor(() => {
      const expectedValue = formatCurrency(300000); // $3000.00
      expect(findByTextContent(expectedValue.replace('USD', ''))).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<Statistics />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Find and click tabs
    const overviewTab = await screen.findByRole('tab', { name: /vue d'ensemble/i });
    const weaponsTab = await screen.findByRole('tab', { name: /armes/i });
    const employeesTab = await screen.findByRole('tab', { name: /employés/i });

    expect(overviewTab).toBeInTheDocument();
    expect(weaponsTab).toBeInTheDocument();
    expect(employeesTab).toBeInTheDocument();

    // Click Weapons tab
    await userEvent.click(weaponsTab);
    expect(await screen.findByRole('tabpanel', { name: /armes/i })).toBeInTheDocument();

    // Click Employees tab
    await userEvent.click(employeesTab);
    expect(await screen.findByRole('tabpanel', { name: /employés/i })).toBeInTheDocument();

    // Click Overview tab
    await userEvent.click(overviewTab);
    expect(await screen.findByRole('tabpanel', { name: /vue d'ensemble/i })).toBeInTheDocument();
  });

  describe('Financial Calculations', () => {
    it('calculates total sales correctly', async () => {
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const expectedValue = formatCurrency(300000); // $3000.00
        expect(findByTextContent(expectedValue.replace('USD', ''))).toBeInTheDocument();
      });
    });

    it('calculates profit margins correctly', async () => {
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const expectedProfit = formatCurrency(180000); // $1800.00
        expect(findByTextContent(expectedProfit.replace('USD', ''))).toBeInTheDocument();
        expect(findByTextContent('60,0')).toBeInTheDocument();
      });
    });

    it('displays employee performance metrics correctly', async () => {
      const user = userEvent.setup();
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Switch to employees tab
      const employeesTab = await screen.findByRole('tab', { name: /employés/i });
      await user.click(employeesTab);

      // Verify employee metrics
      await waitFor(() => {
        const profit1000 = formatCurrency(100000); // $1000.00
        const profit2000 = formatCurrency(200000); // $2000.00
        expect(findByTextContent(profit1000.replace('USD', ''))).toBeInTheDocument();
        expect(findByTextContent(profit2000.replace('USD', ''))).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Filtering', () => {
    it('filters data correctly for custom date range', async () => {
      const user = userEvent.setup();
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Set custom date range
      const startDateInput = screen.getByLabelText('Date de début', { selector: 'input' });
      const endDateInput = screen.getByLabelText('Date de fin', { selector: 'input' });

      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-20');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-21');

      // Wait for filtered data
      await waitFor(() => {
        const expectedValue = formatCurrency(300000); // $3000.00
        expect(findByTextContent(expectedValue.replace('USD', ''))).toBeInTheDocument();
      });
    });

    it('updates charts when changing time period', async () => {
      const user = userEvent.setup();
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Click "7 derniers jours" button
      const sevenDaysButton = await screen.findByText('7 derniers jours');
      await user.click(sevenDaysButton);

      // Wait for filtered data
      await waitFor(() => {
        const expectedValue = formatCurrency(300000); // $3000.00
        expect(findByTextContent(expectedValue.replace('USD', ''))).toBeInTheDocument();
      });
    });
  });

  describe('Weapon Type Analysis', () => {
    it('groups weapons by type correctly', async () => {
      const user = userEvent.setup();
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Switch to weapons tab
      const weaponsTab = await screen.findByRole('tab', { name: /armes/i });
      await user.click(weaponsTab);

      await waitFor(() => {
        expect(findByTextContent('Épée')).toBeInTheDocument();
        expect(findByTextContent('Hache')).toBeInTheDocument();
      });
    });

    it('calculates average prices by weapon type', async () => {
      const user = userEvent.setup();
      render(<Statistics />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Switch to weapons tab
      const weaponsTab = await screen.findByRole('tab', { name: /armes/i });
      await user.click(weaponsTab);

      await waitFor(() => {
        const price1000 = formatCurrency(100000); // $1000.00
        const price2000 = formatCurrency(200000); // $2000.00
        expect(findByTextContent(price1000.replace('USD', ''))).toBeInTheDocument();
        expect(findByTextContent(price2000.replace('USD', ''))).toBeInTheDocument();
      });
    });
  });
}); 