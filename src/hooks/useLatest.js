import { useLayoutEffect, useRef } from 'react';

/** Ref that always holds the latest value (for callbacks used inside effects). */
export function useLatest(value) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
