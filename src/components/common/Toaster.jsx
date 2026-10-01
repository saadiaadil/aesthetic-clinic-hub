import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const TONES = {
  success: { icon: CircleCheck, className: 'text-emerald-700' },
  error: { icon: CircleAlert, className: 'text-error' },
  info: { icon: Info, className: 'text-secondary' },
};

/** Global toast outlet (mounted once in the root layout). */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] ?? TONES.info;
          const Icon = tone.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-modal ring-1 ring-outline-variant/30"
            >
              <Icon className={cn('mt-0.5 size-5', tone.className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-title-md text-title-md text-on-surface">{toast.title}</p>
                {toast.description && <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
