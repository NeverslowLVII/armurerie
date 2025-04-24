import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function SimpleComponent() {
  return <div>Hello World</div>;
}

describe('Simple Component', () => {
  it('renders correctly', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });
}); 