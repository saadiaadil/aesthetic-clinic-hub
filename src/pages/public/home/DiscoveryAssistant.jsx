import { useState } from 'react';
import { BadgeCheck, BriefcaseMedical } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { Container, Overline } from '@/components/common/Layout';
import { Skeleton } from '@/components/common/Skeleton';
import { ROUTES } from '@/constants/routes';
import { ASSISTANT_AREAS, ASSISTANT_GOALS } from '@/data/recommendations';
import { useAsync } from '@/hooks/useAsync';
import { getRecommendation } from '@/services/recommendationService';
import { cn } from '@/utils/cn';

/**
 * "Not sure where to start?" — Stitch Intelligent Navigator. Focus area ×
 * priority objective drives a live recommendation (Phase 2: AI engine).
 */
export function DiscoveryAssistant() {
  const [area, setArea] = useState('skin');
  const [goal, setGoal] = useState('prevent');
  const { data: match, isLoading } = useAsync(() => getRecommendation({ area, goal }), [area, goal], { keepPreviousData: true });

  return (
    <section className="relative w-full overflow-hidden bg-surface py-space-xl" aria-labelledby="assistant-title">
      <Container>
        <div className="relative rounded-3xl bg-gradient-to-br from-surface-container-lowest to-surface-container p-space-md shadow-xl sm:p-space-lg lg:p-space-xl">
          <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
            <div className="space-y-space-md lg:col-span-5">
              <Overline>Intelligent Navigator</Overline>
              <h2 id="assistant-title" className="font-headline-lg text-headline-md text-on-surface md:text-headline-lg">
                Not sure where to start?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Select your focus area and clinical objective. Our algorithmic directory will pair you with the gold-standard treatment and licensed specialists in Riyadh.
              </p>
              <div className="rounded-2xl bg-surface p-space-md shadow-sm" aria-live="polite">
                <span className="mb-1 block font-label-sm text-label-sm uppercase text-primary">Live Recommendation</span>
                {match ? (
                  <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
                    <p className="font-title-lg text-title-lg text-on-surface">{match.title}</p>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{match.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-label-md text-label-md text-secondary">Match Score: {match.score}%</span>
                      <Button to={ROUTES.treatment(match.treatmentId)} size="sm" className="shadow-none">
                        Explore Match
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-space-md lg:col-span-7">
              <fieldset>
                <legend className="mb-3 block font-label-md text-label-md uppercase tracking-wide text-on-surface">Step 1: Choose Primary Area of Focus</legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ASSISTANT_AREAS.map((item) => {
                    const active = item.id === area;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setArea(item.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl px-3 py-3 font-label-md text-label-md transition-all',
                          active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container-high',
                        )}
                      >
                        <DynamicIcon name={item.icon} className="size-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 block font-label-md text-label-md uppercase tracking-wide text-on-surface">Step 2: Choose Your Priority Objective</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ASSISTANT_GOALS.map((item) => {
                    const active = item.id === goal;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setGoal(item.id)}
                        className={cn(
                          'rounded-xl px-4 py-3 text-left transition-all',
                          active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container-high',
                        )}
                      >
                        <strong className="block font-title-md text-title-md">{item.label}</strong>
                        <span className={cn('text-xs', active ? 'opacity-90' : 'text-on-surface-variant')}>{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface/80 p-space-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                    <BriefcaseMedical className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="block font-label-md text-label-md text-on-surface">Available Specialists in Riyadh</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {match ? `${match.specialistCount} Verified Doctors across ${match.clinicCount} clinics can perform this matching treatment this week.` : 'Checking availability…'}
                    </span>
                  </div>
                </div>
                <BadgeCheck className="size-6 shrink-0 text-secondary" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
