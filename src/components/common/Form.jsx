import { cloneElement, forwardRef, isValidElement, useId, useRef, useState } from 'react';
import { ChevronDown, CircleAlert, CloudUpload, Eye, EyeOff, FileCheck2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Form controls in the Stitch style: warm filled inputs (surface-container-low),
 * no borders, soft plum focus ring, labels outside the input, mauve asterisk
 * for required fields. All inputs forward refs so they work with
 * React Hook Form's `register()`.
 */

export const inputBase =
  'w-full rounded-lg font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline disabled:cursor-not-allowed disabled:opacity-60';

const SURFACES = {
  filled: 'bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25',
  surface: 'bg-surface focus:ring-2 focus:ring-primary/20',
  white: 'bg-surface-container-lowest ring-1 ring-outline-variant/40 focus:ring-2 focus:ring-primary/25',
};

const errorRing = 'ring-2 ring-error/40 focus:ring-error/50';

/** Label + hint + error wrapper. Passes id / aria attributes to its single child control. */
export function Field({ label, labelAside, required, hint, hintPosition = 'below', error, labelStyle = 'caps', className, children, id: providedId }) {
  const autoId = useId();
  const id = providedId ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, invalid: Boolean(error) })
    : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={id}
            className={cn(
              'flex flex-1 items-center justify-between gap-2 text-on-surface',
              labelStyle === 'caps' ? 'font-label-md text-label-md uppercase tracking-wider' : 'font-title-md text-title-md',
            )}
          >
            <span>
              {label}
              {required && <span className="text-tertiary"> *</span>}
            </span>
            {hint && hintPosition === 'label' && (
              <span id={hintId} className="font-label-sm text-label-sm font-normal normal-case tracking-normal text-on-surface-variant">
                {hint}
              </span>
            )}
          </label>
          {labelAside}
        </div>
      )}
      {control}
      {hint && hintPosition === 'below' && !error && (
        <p id={hintId} className="font-body-sm text-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1 font-body-sm text-body-sm text-error">
          <CircleAlert className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Group of related controls (radio tiles, checkbox cards) with an accessible legend. */
export function FieldGroup({ legend, required, hint, error, labelStyle = 'caps', className, children }) {
  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      {legend && (
        <legend
          className={cn(
            'mb-2 text-on-surface',
            labelStyle === 'caps' ? 'font-label-md text-label-md uppercase tracking-wider' : 'font-title-md text-title-md',
          )}
        >
          {legend}
          {required && <span className="text-tertiary"> *</span>}
        </legend>
      )}
      {children}
      {hint && !error && <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-center gap-1 font-body-sm text-body-sm text-error">
          <CircleAlert className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

export const TextInput = forwardRef(function TextInput(
  { leftIcon: LeftIcon, prefix, rightSlot, surface = 'filled', invalid, className, inputClassName, size = 'md', ...props },
  ref,
) {
  const padY = size === 'lg' ? 'py-3.5' : 'py-3';
  return (
    <div className={cn('relative flex items-center', className)}>
      {LeftIcon && <LeftIcon className="pointer-events-none absolute left-3.5 size-5 text-on-surface-variant" aria-hidden="true" />}
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 flex items-center gap-1.5 font-label-md text-label-md font-semibold text-secondary">
          {prefix}
          <span className="text-outline-variant">|</span>
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          inputBase,
          SURFACES[surface],
          padY,
          LeftIcon ? 'pl-11' : prefix ? 'pl-[5.5rem]' : 'pl-4',
          rightSlot ? 'pr-12' : 'pr-4',
          invalid && errorRing,
          inputClassName,
        )}
        {...props}
      />
      {rightSlot && <div className="absolute right-2 flex items-center">{rightSlot}</div>}
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete="current-password"
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="flex size-9 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:text-on-surface"
        >
          {visible ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
        </button>
      }
      {...props}
    />
  );
});

export const SelectInput = forwardRef(function SelectInput(
  { leftIcon: LeftIcon, surface = 'filled', invalid, className, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {LeftIcon && <LeftIcon className="pointer-events-none absolute left-3.5 size-5 text-on-surface-variant" aria-hidden="true" />}
      <select
        ref={ref}
        className={cn(inputBase, SURFACES[surface], 'cursor-pointer appearance-none py-3 pr-10', LeftIcon ? 'pl-11' : 'pl-4', invalid && errorRing)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-[18px] text-on-surface-variant" aria-hidden="true" />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ surface = 'filled', invalid, className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBase, SURFACES[surface], 'resize-none px-4 py-3', invalid && errorRing, className)}
      {...props}
    />
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, description, className, invalid, ...props }, ref) {
  return (
    <label className={cn('flex cursor-pointer select-none items-start gap-2.5', className)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn('mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-primary', invalid && 'outline outline-2 outline-error/50')}
        {...props}
      />
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        {label}
        {description && <span className="block">{description}</span>}
      </span>
    </label>
  );
});

/** Selectable preference row (Stitch registration "Care & Communication Preferences"). */
export const CheckboxCard = forwardRef(function CheckboxCard({ title, description, icon: Icon, iconNode, className, compact = false, invalid: _invalid, ...props }, ref) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-space-sm rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container has-[:checked]:bg-surface-container',
        compact ? 'items-center p-3' : 'p-space-sm',
        className,
      )}
    >
      <input ref={ref} type="checkbox" className={cn('size-4 shrink-0 cursor-pointer rounded accent-primary', !compact && 'mt-1')} {...props} />
      {iconNode}
      {Icon && <Icon className="size-[18px] text-secondary" aria-hidden="true" />}
      <span className="flex flex-col">
        <span className={cn('text-on-surface', compact ? 'font-body-sm text-body-sm font-medium' : 'font-title-md text-title-md')}>{title}</span>
        {description && <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>}
      </span>
    </label>
  );
});

/** Radio option tile (onboarding specialty classification, payment settlement). */
export const RadioCard = forwardRef(function RadioCard({ title, description, className, invalid: _invalid, ...props }, ref) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container-high has-[:checked]:bg-surface-container-high has-[:checked]:ring-1 has-[:checked]:ring-primary/30',
        className,
      )}
    >
      <input ref={ref} type="radio" className="size-4 shrink-0 cursor-pointer accent-primary" {...props} />
      <span className="min-w-0">
        <span className="block font-title-md text-[14px] leading-5 text-on-surface">{title}</span>
        {description && <span className="block truncate font-label-sm text-[11px] font-normal tracking-normal text-on-surface-variant">{description}</span>}
      </span>
    </label>
  );
});

/** On/off switch (Stitch "Instant Confirmation Only", discretion toggles). */
export const Switch = forwardRef(function Switch({ label, className, srLabel, invalid: _invalid, ...props }, ref) {
  return (
    <label className={cn('relative inline-flex shrink-0 cursor-pointer items-center gap-space-xs', className)}>
      {label && <span className="font-label-md text-label-md text-on-surface">{label}</span>}
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" aria-label={srLabel} {...props} />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-surface-container-highest transition-colors after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-container"
      />
    </label>
  );
});

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Document upload zone (Stitch onboarding "Drop MOH License Document").
 * Controlled: `value` is { name, size } | null. Validates type and size.
 */
export function FileDropzone({
  value,
  onChange,
  title,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 15,
  icon: Icon = CloudUpload,
  highlight = false,
  invalid = false,
  id,
  ...aria
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const pick = (file) => {
    if (!file) return;
    const allowed = accept.split(',').map((ext) => ext.trim().toLowerCase());
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!allowed.includes(extension)) {
      setLocalError('Only PDF, PNG or JPG files are accepted.');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File is larger than ${maxSizeMb}MB.`);
      return;
    }
    setLocalError('');
    onChange({ name: file.name, size: formatBytes(file.size) });
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-low p-space-md text-center transition-colors hover:bg-surface-container-high',
          dragging && 'bg-surface-container-high ring-2 ring-primary/30',
          (invalid || localError) && 'ring-2 ring-error/40',
        )}
        {...aria}
      >
        <span
          className={cn(
            'mb-2 flex size-12 items-center justify-center rounded-full',
            highlight || value ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant',
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="font-title-md text-[14px] text-on-surface">{title}</span>
        <span className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          or <span className="font-medium text-primary underline">browse files</span> (Max {maxSizeMb}MB)
        </span>
        {value ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded bg-secondary-fixed/30 px-2 py-0.5 font-label-sm text-label-sm text-secondary">
            <FileCheck2 className="size-3.5" aria-hidden="true" />
            {value.name} ({value.size})
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              aria-label={`Remove ${value.name}`}
              className="ml-1 rounded text-on-surface-variant hover:text-error"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ) : (
          <span className="mt-2 font-label-sm text-label-sm text-on-surface-variant">PDF, PNG, JPG accepted</span>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => pick(event.target.files?.[0])}
      />
      {localError && (
        <p className="mt-1.5 flex items-center gap-1 font-body-sm text-body-sm text-error">
          <CircleAlert className="size-3.5" aria-hidden="true" />
          {localError}
        </p>
      )}
    </div>
  );
}
