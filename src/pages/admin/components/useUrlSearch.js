import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

/**
 * Search box for URL-synced admin filters: the input updates on every
 * keystroke, the `?q=` param (and therefore the service call) only once
 * typing pauses.
 *
 *   const [keyword, setKeyword] = useUrlSearch(filters.q, (q) => setFilters({ q }));
 */
export function useUrlSearch(value, commit, delay = 300) {
  const [keyword, setKeyword] = useState(value);
  const debounced = useDebouncedValue(keyword, delay);

  useEffect(() => {
    if (debounced !== value) commit(debounced);
    // Only the debounced keyword should trigger a commit; `value` and `commit` change with the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return [keyword, setKeyword];
}
