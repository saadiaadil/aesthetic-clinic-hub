import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils/cn';

/**
 * Anchored dropdown panel (header location picker, notifications, account
 * menu). The trigger is rendered by the caller through `trigger({ isOpen, toggle })`.
 * Closes on outside click and Escape.
 */
export function Popover({ isOpen, onClose, trigger, children, align = 'right', className, panelClassName }) {
  const rootRef = useRef(null);
  useClickOutside([rootRef], onClose, isOpen);

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full z-50 mt-2 rounded-xl bg-surface-container-lowest p-space-sm shadow-2xl ring-1 ring-outline-variant/30',
              align === 'right' ? 'right-0' : 'left-0',
              panelClassName,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
