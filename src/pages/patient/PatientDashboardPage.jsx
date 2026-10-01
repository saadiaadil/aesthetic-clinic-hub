import { ArrowRight, CalendarCheck, CalendarDays, CalendarPlus, Heart, MapPin, MessageSquareHeart, Navigation, PenLine, Stethoscope } from 'lucide-react';
import { Link } from 'react-router';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RatingValue } from '@/components/common/Rating';
import { RowSkeleton, Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AppointmentCard } from '@/components/appointment/AppointmentCards';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardUI';
import { getDistrictName } from '@/constants/districts';
import { ROUTES } from '@/constants/routes';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getPatientAppointments } from '@/services/appointmentService';
import { searchClinics } from '@/services/clinicService';
import { getPatientReviews, getReviewableAppointments } from '@/services/reviewService';
import { useFavoritesStore } from '@/store/favoritesStore';
import { downloadIcs } from '@/utils/calendar';
import { mapsUrl } from '@/utils/clinic';
import { fromDateKey, todayKey } from '@/utils/date';
import { formatDate, formatLongDate, formatPrice, formatSlot, getFirstName } from '@/utils/format';

function NextAppointment({ appointment }) {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-surface-container-low md:grid-cols-5">
      <div className="relative h-48 md:col-span-2 md:h-full">
        <img src={appointment.clinic.coverImage} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 font-label-sm text-label-sm text-primary backdrop-blur-md">
          MOH #{appointment.clinic.licenseNumber.replace(/^MOH-/, '')}
        </span>
      </div>
      <div className="flex flex-col justify-between gap-space-md p-space-md md:col-span-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Next Appointment</span>
            <StatusBadge status={appointment.status} />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{appointment.service.title}</h3>
          <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <MapPin className="size-4 text-secondary" aria-hidden="true" />
            {appointment.clinic.name} • {appointment.clinic.districtLabel}
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-surface p-2">
            <Avatar src={appointment.doctor.headshot} name={appointment.doctor.name} size="md" />
            <div>
              <p className="font-title-md text-title-md text-on-surface">{appointment.doctor.name}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{appointment.doctor.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm rounded-lg bg-secondary-fixed/30 p-3 text-on-secondary-fixed">
            <CalendarCheck className="size-5 text-secondary" aria-hidden="true" />
            <div>
              <p className="font-title-md text-body-sm font-semibold">{formatLongDate(fromDateKey(appointment.dateKey))}</p>
              <p className="font-body-sm text-label-sm text-on-secondary-fixed-variant">
                {formatSlot(appointment.slot)} AST • {appointment.durationMinutes} mins • {formatPrice(appointment.priceCharged)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to={ROUTES.patient.appointment(appointment.id)} size="sm" rightIcon={ArrowRight} className="shadow-none">
            View details
          </Button>
          <Button
            variant="soft"
            size="sm"
            leftIcon={CalendarPlus}
            onClick={() =>
              downloadIcs({
                id: appointment.id,
                title: `${appointment.service.shortTitle} — ${appointment.clinic.name}`,
                description: `With ${appointment.doctor.name}`,
                location: appointment.clinic.address,
                start: appointment.scheduledAt,
                durationMinutes: appointment.durationMinutes,
              })
            }
          >
            Add to calendar
          </Button>
          <Button variant="soft" size="sm" leftIcon={Navigation} href={mapsUrl(appointment.clinic)} target="_blank" rel="noopener noreferrer">
            Directions
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Patient overview: next visit, upcoming list, visits awaiting review, saved clinics. */
export default function PatientDashboardPage() {
  useDocumentTitle('My Dashboard');
  const { user } = useAuth();
  const savedIds = useFavoritesStore((state) => state.clinicIds);
  const upcoming = useAsync(() => getPatientAppointments(user.id, { scope: 'upcoming' }), [user.id]);
  const past = useAsync(() => getPatientAppointments(user.id, { scope: 'past' }), [user.id]);
  const reviewable = useAsync(() => getReviewableAppointments(user.id), [user.id]);
  const reviews = useAsync(() => getPatientReviews(user.id), [user.id]);
  const saved = useAsync(() => searchClinics({ pageSize: 50 }), []);

  const [next, ...later] = upcoming.data ?? [];
  const savedClinics = (saved.data?.items ?? []).filter((clinic) => savedIds.includes(clinic.id));

  return (
    <>
      <PageHeader
        pills={
          <>
            <Badge tone="gold" size="md" uppercase className="bg-secondary-fixed/40 text-on-secondary-fixed">
              <span className="size-1.5 animate-pulse rounded-full bg-secondary" aria-hidden="true" />
              Verified Patient
            </Badge>
            <Badge tone="neutral" size="md">
              {getDistrictName(user.district)} • Riyadh
            </Badge>
          </>
        }
        title={`Welcome back, ${getFirstName(user.name)}`}
        meta={
          <>
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            <span>{formatLongDate(fromDateKey(todayKey()))}</span>
            <span className="text-outline-variant">•</span>
            <span>Your private aesthetic journey</span>
          </>
        }
        actions={
          <>
            <Button to={ROUTES.clinics} variant="tonal">
              Browse Clinics
            </Button>
            <Button to={ROUTES.booking.root} leftIcon={CalendarPlus}>
              Book Appointment
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary">
        <StatCard label="Upcoming Visits" value={upcoming.data?.length ?? '—'} icon={CalendarDays} glow="gold" footer={next ? `Next: ${formatDate(next.scheduledAt)}` : 'No visits scheduled'} />
        <StatCard label="Completed Treatments" value={past.data?.filter((item) => item.status === 'completed').length ?? '—'} icon={Stethoscope} iconTone="secondary" glow="plum" footer="Across verified clinics" />
        <StatCard label="Saved Clinics" value={savedIds.length} icon={Heart} glow="champagne" footer={<Link to={ROUTES.patient.saved} className="text-primary hover:underline">View saved clinics</Link>} />
        <StatCard label="Reviews Shared" value={reviews.data?.length ?? '—'} icon={MessageSquareHeart} iconTone="secondary" glow="blush" footer={reviewable.data?.length ? `${reviewable.data.length} visit awaiting review` : 'Thank you for sharing'} />
      </section>

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-8">
          <Panel
            title="Your Upcoming Journey"
            subtitle="Confirmed and requested appointments"
            action={
              <Button to={ROUTES.patient.appointments} variant="ghost" size="sm" rightIcon={ArrowRight} className="text-primary">
                All appointments
              </Button>
            }
          >
            {upcoming.error ? (
              <ErrorState compact error={upcoming.error} onRetry={upcoming.reload} />
            ) : upcoming.isLoading ? (
              <div className="space-y-space-sm">
                <Skeleton className="h-64 w-full rounded-xl" />
                <RowSkeleton />
              </div>
            ) : !next ? (
              <EmptyState
                compact
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Discover verified clinics and reserve your next treatment in minutes."
                action={<Button to={ROUTES.clinics}>Find a clinic</Button>}
              />
            ) : (
              <div className="space-y-space-md">
                <NextAppointment appointment={next} />
                {later.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} compact />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Recent Treatments" subtitle="Your completed visits" titleSize="title">
            {past.isLoading ? (
              <RowSkeleton />
            ) : past.data?.length ? (
              <div className="space-y-space-sm">
                {past.data.slice(0, 3).map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} compact />
                ))}
              </div>
            ) : (
              <EmptyState compact title="No completed treatments yet" description="Your treatment history will appear here after your first visit." />
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-4">
          <Panel title="Awaiting Your Review" subtitle="Verified visits only" titleSize="title">
            {reviewable.isLoading ? (
              <RowSkeleton />
            ) : reviewable.data?.length ? (
              <ul className="space-y-space-sm">
                {reviewable.data.map((item) => (
                  <li key={item.id} className="space-y-2 rounded-lg bg-surface-container-low p-space-sm">
                    <p className="font-title-md text-title-md text-on-surface">{item.serviceTitle}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.clinicName} • {item.doctorName} • {formatDate(item.scheduledAt)}
                    </p>
                    <Button to={`${ROUTES.patient.appointment(item.id)}#review`} size="sm" leftIcon={PenLine} className="shadow-none">
                      Write a review
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">All caught up — thank you for helping other patients choose with confidence.</p>
            )}
          </Panel>

          <Panel
            title="Saved Clinics"
            titleSize="title"
            action={
              <Button to={ROUTES.patient.saved} variant="ghost" size="xs" className="text-primary">
                View all
              </Button>
            }
          >
            {saved.isLoading ? (
              <RowSkeleton />
            ) : savedClinics.length ? (
              <ul className="space-y-space-sm">
                {savedClinics.slice(0, 3).map((clinic) => (
                  <li key={clinic.id}>
                    <Link to={ROUTES.clinic(clinic.id)} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-2 transition-colors hover:bg-surface-container">
                      <img src={clinic.coverImage} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate font-title-md text-title-md text-on-surface">{clinic.name}</span>
                        <span className="flex items-center gap-2">
                          <RatingValue value={clinic.rating} size="sm" />
                          <span className="truncate font-label-sm text-label-sm text-on-surface-variant">{clinic.districtLabel}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tap the heart on any clinic to save it here.</p>
            )}
          </Panel>

          <Panel title="Care Preferences" titleSize="title" action={<Button to={ROUTES.patient.profile} variant="ghost" size="xs" className="text-primary">Edit</Button>}>
            <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <li>{user.preferences?.femaleStaff ? '✓ Female practitioner & staff preferred' : '• No practitioner gender preference'}</li>
              <li>{user.preferences?.whatsappReminders ? '✓ WhatsApp concierge reminders on' : '• WhatsApp reminders off'}</li>
              <li>{user.preferences?.privateArrival ? '✓ Private arrival requested' : '• Standard arrival'}</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
