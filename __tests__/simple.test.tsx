import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

function SimpleComponent() {
  return <div>Hello World</div>;
}

describe('Simple Component', () => {
  it('renders correctly', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
