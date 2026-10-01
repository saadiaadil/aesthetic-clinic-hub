import { useState } from 'react';
import { ChevronDown, FlaskConical, Shield } from 'lucide-react';
import { SHOW_DEMO_ACCOUNTS } from '@/constants/config';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/users';
import { cn } from '@/utils/cn';
import { getPasswordStrength } from '@/utils/validation';

const TONE_BAR = { neutral: 'bg-outline-variant', error: 'bg-error', secondary: 'bg-secondary', primary: 'bg-primary' };
const TONE_TEXT = { neutral: 'text-on-surface-variant', error: 'text-error', secondary: 'text-secondary', primary: 'text-primary' };

/** Stitch registration "Data Privacy & Security Grade" meter. */
export function PasswordStrength({ value }) {
  const strength = getPasswordStrength(value);
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-space-sm" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">Data Privacy & Security Grade</span>
        <span className={cn('font-label-sm text-label-sm font-semibold', TONE_TEXT[strength.tone])}>{strength.label}</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div className={cn('h-full transition-all duration-300', TONE_BAR[strength.tone])} style={{ width: `${(strength.score / 4) * 100}%` }} />
      </div>
      <div className="flex items-center gap-space-xs text-[11px] text-on-surface-variant">
        <Shield className="size-3.5 text-secondary" aria-hidden="true" />
        <span>Use 8+ characters with letters and numbers. Complies with Saudi NCA encryption standards.</span>
      </div>
    </div>
  );
}

/**
 * Demo account picker — only rendered while the app runs on mock data.
 * Fills the sign-in form; it is a development convenience, not a feature.
 */
export function DemoAccounts({ onPick, roles }) {
  const [open, setOpen] = useState(false);
  if (!SHOW_DEMO_ACCOUNTS) return null;
  const accounts = roles ? DEMO_ACCOUNTS.filter((account) => roles.includes(account.role)) : DEMO_ACCOUNTS;
  return (
    <div className="mt-space-md rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
          <FlaskConical className="size-4 text-secondary" aria-hidden="true" />
          Demo accounts (mock data)
        </span>
        <ChevronDown className={cn('size-4 text-on-surface-variant transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Password for every demo account: <code className="rounded bg-surface px-1.5 py-0.5 font-semibold text-on-surface">{DEMO_PASSWORD}</code>. Mock sign-in only — not real authentication.
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {accounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => onPick(account.email, DEMO_PASSWORD)}
                  className="w-full rounded-lg bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-container"
                >
                  <span className="block font-label-sm text-label-sm uppercase tracking-wider text-secondary">{account.label}</span>
                  <span className="block truncate font-body-sm text-body-sm text-on-surface">{account.name}</span>
                  <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">{account.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
