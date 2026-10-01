import { useEffect } from 'react';
import { BRAND } from '@/constants/brand';

/** Sets the browser tab title: "Clinics · Aesthetic Clinic Hub". */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : `${BRAND.name} · ${BRAND.city}`;
  }, [title]);
}
