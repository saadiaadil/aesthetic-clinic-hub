import { useEffect } from 'react';
import { useLatest } from './useLatest';

/** Calls `handler` on pointer-down outside every ref in `refs` (dropdowns, popovers). */
export function useClickOutside(refs, handler, enabled = true) {
  const handlerRef = useLatest(handler);
  const refsRef = useLatest(refs);

  useEffect(() => {
    if (!enabled) return undefined;
    const onPointerDown = (event) => {
      const inside = refsRef.current.some((ref) => ref.current?.contains(event.target));
      if (!inside) handlerRef.current(event);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [enabled, handlerRef, refsRef]);
}
