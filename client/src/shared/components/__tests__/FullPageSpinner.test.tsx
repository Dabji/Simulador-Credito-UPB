import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FullPageSpinner } from '../FullPageSpinner';

describe('FullPageSpinner', () => {
  it('renders the spinner with correct accessibility attributes', () => {
    render(<FullPageSpinner />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('includes a screen-reader label', () => {
    render(<FullPageSpinner />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('has the sr-only class on the text', () => {
    render(<FullPageSpinner />);
    const label = screen.getByText('Cargando...');
    expect(label).toHaveClass('sr-only');
  });
});
