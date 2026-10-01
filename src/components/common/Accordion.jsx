import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Expand/collapse sections (treatment FAQs, aftercare notes). */
export function Accordion({ items, defaultOpen = 0, className }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);
  const baseId = useId();
  return (
    <div className={cn('divide-y divide-surface-container-high rounded-xl bg-surface-container-low', className)}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div key={item.title}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-space-md py-4 text-left font-title-md text-title-md text-on-surface"
              >
                {item.title}
                <ChevronDown className={cn('size-5 text-on-surface-variant transition-transform', open && 'rotate-180')} aria-hidden="true" />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-space-md pb-space-md font-body-md text-body-md text-on-surface-variant">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
