import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, call, getToken, setToken, setUnauthorizedHandler } from './lib/api';
import { mmss, prettyPhone } from './lib/format';
import { I18nProvider, translate } from './lib/i18n';
import { parse } from './lib/router';
import Login from './screens/Login';
import { Sheet, ToastProvider } from './ui';

const wrap = (ui: React.ReactNode) => render(<I18nProvider><ToastProvider>{ui}</ToastProvider></I18nProvider>);
afterEach(() => { vi.restoreAllMocks(); setToken(null); localStorage.clear(); });

describe('i18n', () => {
  it('fills placeholders in English and Urdu', () => {
    expect(translate('en', 'Question {i} of {n}', { i: 2, n: 5 })).toBe('Question 2 of 5');
    expect(translate('ur', 'Question {i} of {n}', { i: 2, n: 5 })).toBe('سوال 2 از 5');
  });
  it('falls back to English for keys without Urdu', () => {
    expect(translate('ur', 'My classes')).toBe('My classes');
  });
});

describe('router and format', () => {
  it('parses hash routes with arguments', () => {
    expect(parse('#/child/abc/phy11')).toEqual({ name: 'child', args: ['abc', 'phy11'] });
    expect(parse('')).toEqual({ name: '', args: [] });
  });
  it('formats time and phone numbers', () => {
    expect(mmss(133)).toBe('2:13');
    expect(prettyPhone('+923992220001')).toBe('+92 399 2220001');
  });
});

describe('api client', () => {
  it('sends the bearer token and returns JSON', async () => {
    setToken('tok');
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    await expect(call('GET', 'me')).resolves.toEqual({ ok: 1 });
    expect((f.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
  });
  it('turns server errors into ApiError with the error code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'quiz_locked', message: 'Listen first' }), { status: 403 }));
    await expect(call('POST', 'lessons/x/quiz')).rejects.toMatchObject({ status: 403, code: 'quiz_locked', message: 'Listen first' });
  });
  it('signs out on 401', async () => {
    setToken('old');
    const out = vi.fn(); setUnauthorizedHandler(out);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(call('GET', 'me')).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(out).toHaveBeenCalled();
  });
  it('reports network failures as status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('down'));
    await expect(call('GET', 'me')).rejects.toMatchObject({ status: 0, code: 'network' });
  });
});

describe('Sheet dialog', () => {
  it('shows the confirm error and stays open', async () => {
    const close = vi.fn();
    wrap(<Sheet title="Test" confirm="Save" onClose={close} onConfirm={() => { throw new Error('Enter a reason.'); }}>Body</Sheet>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByText('Save')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a reason.');
    expect(close).not.toHaveBeenCalled();
  });
  it('closes on Escape', () => {
    const close = vi.fn();
    wrap(<Sheet title="Test" confirm="Save" onClose={close} onConfirm={() => {}}>Body</Sheet>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).toHaveBeenCalled();
  });
});

describe('Login', () => {
  it('rejects a malformed number without calling the server', () => {
    const f = vi.spyOn(globalThis, 'fetch');
    wrap(<Login onSignedIn={() => {}} />);
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '12' } });
    fireEvent.click(screen.getByText('Send code'));
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Enter a 10-digit mobile number starting with 3.');
    expect(f).not.toHaveBeenCalled();
  });
  it('shows the server refusal for an unregistered number', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'not_registered', message: 'This number is not registered with any college.' }), { status: 404 }));
    wrap(<Login onSignedIn={() => {}} />);
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '3001234567' } });
    fireEvent.click(screen.getByText('Send code'));
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('not registered'));
  });
});
