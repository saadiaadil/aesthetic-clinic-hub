import { useMemo } from 'react';
import { useToastStore } from '@/store/uiStore';

/**
 * const toast = useToast();
 * toast.success('Appointment confirmed');
 * toast.error('Payment failed', 'Please try again or use a different method.');
 */
export function useToast() {
  const push = useToastStore((state) => state.push);
  return useMemo(
    () => ({
      success: (title, description) => push({ title, description, tone: 'success' }),
      error: (title, description) => push({ title, description, tone: 'error', duration: 6000 }),
      info: (title, description) => push({ title, description, tone: 'info' }),
    }),
    [push],
  );
}
