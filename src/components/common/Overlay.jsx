import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import { cn } from '@/utils/cn';
import { Button } from './Button';

/**
 * Modal and Drawer — DESIGN.md "Level 3" elevation: diffused deep shadow on
 * an ivory surface over a softly blurred backdrop. Both are accessible
 * dialogs (role="dialog", aria-modal, focus trap, Escape to close).
 */

const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer, className }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlay({ isOpen, onClose, panelRef });

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-on-background/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest shadow-modal outline-none sm:rounded-2xl',
              MODAL_SIZES[size],
              className,
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-space-md pb-2 pt-space-md sm:px-space-lg sm:pt-space-lg">
                <div>
                  {title && (
                    <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-space-md pb-space-md sm:px-space-lg sm:pb-space-lg">{children}</div>
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-surface-container-high bg-surface-container-low px-space-md py-space-sm sm:flex-row sm:justify-end sm:px-space-lg">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const DRAWER_SIDES = {
  right: { panel: 'right-0 top-0 h-full w-[88vw] max-w-sm', initial: { x: '100%' } },
  left: { panel: 'left-0 top-0 h-full w-[85vw] max-w-xs', initial: { x: '-100%' } },
  bottom: { panel: 'bottom-0 left-0 max-h-[88vh] w-full rounded-t-2xl', initial: { y: '100%' } },
};

/** Side / bottom sheet: mobile navigation, mobile filters, dashboard sidebar on small screens. */
export function Drawer({ isOpen, onClose, title, side = 'right', children, footer, className, labelledBy }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useOverlay({ isOpen, onClose, panelRef });
  const config = DRAWER_SIDES[side];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[65]">
          <motion.div
            className="absolute inset-0 bg-on-background/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
            tabIndex={-1}
            initial={config.initial}
            animate={{ x: 0, y: 0 }}
            exit={config.initial}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={cn('absolute flex flex-col bg-surface shadow-modal outline-none', config.panel, className)}
          >
            {title && (
              <div className="flex items-center justify-between gap-3 border-b border-surface-container-high px-space-md py-space-sm">
                <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="border-t border-surface-container-high bg-surface-container-low p-space-md">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Confirmation dialog for destructive or important actions (cancel booking, reject clinic …). */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep as is',
  tone = 'primary',
  loading = false,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
