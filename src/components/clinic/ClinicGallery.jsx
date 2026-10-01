import { useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Sparkles } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import { Modal } from '@/components/common/Overlay';
import { cn } from '@/utils/cn';

/**
 * Stitch "Architectural Gallery Bento": large suite image with caption and
 * badge, two stacked side images, plus a full-screen viewer.
 */
export function ClinicGallery({ clinicName, gallery }) {
  const [viewerIndex, setViewerIndex] = useState(null);
  const [main, ...rest] = gallery;
  const side = rest.slice(0, 2);
  if (!main) return null;

  const open = (index) => setViewerIndex(index);
  const step = (direction) => setViewerIndex((index) => (index + direction + gallery.length) % gallery.length);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 overflow-hidden rounded-xl md:grid-cols-12">
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative h-[300px] overflow-hidden rounded-xl bg-surface-container text-left sm:h-[360px] md:col-span-8 md:h-[460px]"
          aria-label={`View photos of ${clinicName}`}
        >
          <img src={main.src} alt={`${main.caption} at ${clinicName}`} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white">
            <span className="flex items-center gap-2 rounded-lg bg-black/40 px-3.5 py-1.5 font-title-md text-title-md backdrop-blur-md">
              <Sparkles className="size-[18px] text-secondary-fixed" aria-hidden="true" />
              {main.caption}
            </span>
            {main.badge && (
              <span className="rounded-full bg-black/40 px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-wider backdrop-blur-md">{main.badge}</span>
            )}
          </div>
        </button>
        <div className="grid grid-cols-2 gap-4 md:col-span-4 md:grid-cols-1">
          {side.map((image, index) => (
            <button
              key={image.caption}
              type="button"
              onClick={() => open(index + 1)}
              className="group relative h-[172px] overflow-hidden rounded-xl bg-surface-container md:h-[222px]"
              aria-label={`View ${image.caption}`}
            >
              <img src={image.src} alt={`${image.caption} at ${clinicName}`} loading="lazy" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded bg-black/30 px-2.5 py-1 font-label-md text-label-md text-white backdrop-blur-md">{image.caption}</span>
              {index === side.length - 1 && gallery.length > 3 && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 font-label-sm text-label-sm text-on-surface">
                  <Images className="size-3.5" aria-hidden="true" /> +{gallery.length - 3}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Modal isOpen={viewerIndex !== null} onClose={() => setViewerIndex(null)} size="xl" title={clinicName} description={viewerIndex !== null ? gallery[viewerIndex].caption : ''}>
        {viewerIndex !== null && (
          <div className="space-y-space-sm">
            <div className="relative overflow-hidden rounded-xl bg-surface-container">
              <img src={gallery[viewerIndex].src} alt={gallery[viewerIndex].caption} className="max-h-[65vh] w-full object-cover" />
              {gallery.length > 1 && (
                <>
                  <IconButton icon={ChevronLeft} label="Previous photo" variant="glass" onClick={() => step(-1)} className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <IconButton icon={ChevronRight} label="Next photo" variant="glass" onClick={() => step(1)} className="absolute right-3 top-1/2 -translate-y-1/2" />
                </>
              )}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {gallery.map((image, index) => (
                <button
                  key={image.caption}
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  aria-label={`Show ${image.caption}`}
                  aria-current={index === viewerIndex}
                  className={cn('h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition', index === viewerIndex ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100')}
                >
                  <img src={image.src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
