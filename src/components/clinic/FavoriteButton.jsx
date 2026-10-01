import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useFavoritesStore } from '@/store/favoritesStore';
import { cn } from '@/utils/cn';

/**
 * Save-clinic heart. `variant="glass"` sits on clinic imagery (Stitch cards);
 * `variant="pill"` is the profile sub-header "Save Clinic" button.
 */
export function FavoriteButton({ clinicId, clinicName, variant = 'glass', className }) {
  const saved = useFavoritesStore((state) => state.clinicIds.includes(clinicId));
  const toggle = useFavoritesStore((state) => state.toggle);
  const toast = useToast();

  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nowSaved = toggle(clinicId);
    toast.success(nowSaved ? 'Saved to your clinics' : 'Removed from saved clinics', clinicName);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3.5 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high',
          className,
        )}
      >
        <Heart className={cn('size-[18px] text-tertiary', saved && 'fill-current')} aria-hidden="true" />
        {saved ? 'Saved' : 'Save Clinic'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${clinicName} from saved clinics` : `Save ${clinicName} to favorites`}
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-surface/80 backdrop-blur-md transition-colors',
        saved ? 'text-primary' : 'text-on-surface-variant hover:text-primary',
        className,
      )}
    >
      <Heart className={cn('size-[18px]', saved && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
