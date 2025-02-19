import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    header: ({ children, className, ...props }: any) => (
      <header className={className} {...props}>{children}</header>
    ),
    nav: ({ children, className, ...props }: any) => (
      <nav className={className} {...props}>{children}</nav>
    ),
    button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>{children}</button>
    ),
    svg: ({ children, className, ...props }: any) => (
      <svg className={className} {...props}>{children}</svg>
    ),
    path: ({ children, className, ...props }: any) => (
      <path className={className} {...props}>{children}</path>
    ),
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 1 }),
  useSpring: () => ({ get: () => 1 }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock react-parallax-tilt
jest.mock('react-parallax-tilt', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

// Mock react-ripples
jest.mock('react-ripples', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('Navbar Component', () => {
  const defaultProps = {
    currentPage: 'weapons' as const,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window scroll position
    global.window.scrollY = 0;
    // Reset scroll event listeners
    global.window.removeEventListener = jest.fn();
    global.window.addEventListener = jest.fn();
  });

  it('renders correctly with default props', () => {
    render(<Navbar {...defaultProps} />);
    
    // Check for brand name
    expect(screen.getByText('Armurerie')).toBeInTheDocument();
    
    // Check for navigation links
    expect(screen.getByText('Armes')).toBeInTheDocument();
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    
    // Check for theme toggle button
    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument();
  });

  it('highlights current page correctly', () => {
    render(<Navbar {...defaultProps} />);
    
    const weaponsLink = screen.getByText('Armes');
    const statsLink = screen.getByText('Statistiques');
    
    expect(weaponsLink.className).toContain('text-red-600');
    expect(statsLink.className).not.toContain('text-red-600');
  });

  it('calls onPageChange when clicking navigation links', async () => {
    const onPageChange = jest.fn();
    render(<Navbar {...defaultProps} onPageChange={onPageChange} />);
    
    const statsLink = screen.getByText('Statistiques');
    await userEvent.click(statsLink);
    
    expect(onPageChange).toHaveBeenCalledWith('statistics');
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      // Mock window width for mobile view
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });

    it('shows mobile menu button on small screens', () => {
      render(<Navbar {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('toggles mobile menu when clicking menu button', async () => {
      render(<Navbar {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await userEvent.click(menuButton);
      
      // Menu items should be visible
      expect(screen.getByText('Armes')).toBeVisible();
      expect(screen.getByText('Statistiques')).toBeVisible();
      
      // Click again to close
      await userEvent.click(menuButton);
      
      // Menu items should be hidden
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes mobile menu after navigation', async () => {
      render(<Navbar {...defaultProps} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await userEvent.click(menuButton);
      
      // Click navigation link
      const statsLink = screen.getByText('Statistiques');
      await userEvent.click(statsLink);
      
      // Menu should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('toggles theme when clicking theme button', async () => {
      const { useTheme } = require('next-themes');
      const setTheme = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({
        resolvedTheme: 'light',
        setTheme,
      });

      render(<Navbar {...defaultProps} />);
      
      const themeButton = screen.getByRole('button', { name: /dark mode/i });
      await userEvent.click(themeButton);
      
      expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('shows correct theme icon based on current theme', () => {
      const { useTheme } = require('next-themes');
      
      // Test light theme
      (useTheme as jest.Mock).mockReturnValue({
        resolvedTheme: 'light',
        setTheme: jest.fn(),
      });
      
      const { rerender } = render(<Navbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument();
      
      // Test dark theme
      (useTheme as jest.Mock).mockReturnValue({
        resolvedTheme: 'dark',
        setTheme: jest.fn(),
      });
      
      rerender(<Navbar {...defaultProps} />);
      expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior', () => {
    it('adds scroll event listener on mount', () => {
      render(<Navbar {...defaultProps} />);
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('removes scroll event listener on unmount', () => {
      const { unmount } = render(<Navbar {...defaultProps} />);
      unmount();
      expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('updates navbar style on scroll', async () => {
      render(<Navbar {...defaultProps} />);
      
      // Get scroll handler
      const [[, scrollHandler]] = (window.addEventListener as jest.Mock).mock.calls;
      
      // Simulate scroll down
      global.window.scrollY = 50;
      scrollHandler();
      
      await waitFor(() => {
        const navbar = screen.getByRole('banner');
        expect(navbar.className).toContain('py-4');
      });
      
      // Simulate scroll to top
      global.window.scrollY = 0;
      scrollHandler();
      
      await waitFor(() => {
        const navbar = screen.getByRole('banner');
        expect(navbar.className).toContain('py-6');
      });
    });
  });
}); 