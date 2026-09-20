import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import { LanguageProvider } from './contexts/LanguageContext';

vi.mock('./api/client', () => ({ authAPI: { logout: vi.fn() }, languageAPI: {} }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('opens all language options in mobile navigation and updates menu labels', async () => {
  render(
    <LanguageProvider>
      <MemoryRouter>
        <Navbar user={null} setUser={vi.fn()} />
      </MemoryRouter>
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: '開啟選單' }));
  const toggles = screen.getAllByRole('button', { name: /zh-TW/ });
  fireEvent.click(toggles[toggles.length - 1]);

  const english = screen.getByRole('button', { name: '🇺🇸 English English' });
  const menu = english.parentElement!;
  expect(menu).toHaveClass('relative', 'w-full');
  expect(menu).not.toHaveClass('absolute');
  expect(screen.getByRole('button', { name: '🇰🇷 한국어 한국어' })).toBeInTheDocument();

  fireEvent.click(english);
  await waitFor(() => expect(screen.queryByRole('button', { name: '🇺🇸 English English' })).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
});
