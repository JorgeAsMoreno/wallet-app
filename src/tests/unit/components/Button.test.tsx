import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button/Button';

describe('Button', () => {
  it('renderiza el texto correctamente', () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('muestra "Cargando..." cuando isLoading es true', () => {
    render(<Button isLoading>Confirmar</Button>);
    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeInTheDocument();
  });

  it('está deshabilitado cuando isLoading es true', () => {
    render(<Button isLoading>Confirmar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('está deshabilitado cuando disabled es true', () => {
    render(<Button disabled>Confirmar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('llama onClick cuando no está deshabilitado', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Confirmar</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('no llama onClick cuando está deshabilitado', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Confirmar</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
