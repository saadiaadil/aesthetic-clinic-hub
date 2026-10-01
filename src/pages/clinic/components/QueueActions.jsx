import { BellRing, CalendarClock, Check, ClipboardList, ConciergeBell, FolderOpen, Play, Receipt, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';

/**
 * Contextual queue actions per appointment status, as drawn on the Stitch
 * clinic dashboard (Completed → intake / receipt; In Consultation → Intake +
 * Finish Session; Checked-in → Call to Suite; Confirmed → Send Reminder +
 * Reschedule). `onAction(type, appointment)` is handled by useQueueActions.
 */
export function QueueActions({ appointment, onAction }) {
  const act = (type) => () => onAction(type, appointment);
  const suite = appointment.suite?.split(' (')[0];

  switch (appointment.status) {
    case 'completed':
    case 'no_show':
      return (
        <>
          <IconButton icon={ClipboardList} label="View medical intake" size="md" onClick={act('intake')} />
          <IconButton icon={Receipt} label="Receipt & summary" size="md" onClick={act('receipt')} />
        </>
      );
    case 'in_session':
      return (
        <>
          <Button variant="soft" size="sm" leftIcon={FolderOpen} className="text-primary" onClick={act('intake')}>
            Intake
          </Button>
          <Button size="sm" className="shadow-none" onClick={act('finish')}>
            Finish Session
          </Button>
        </>
      );
    case 'checked_in':
      return (
        <>
          <Button variant="soft" size="sm" onClick={act('call')}>
            Call to {suite ?? 'Suite'}
          </Button>
          <Button size="sm" leftIcon={Play} className="shadow-none" onClick={act('start')}>
            Start
          </Button>
          <IconButton icon={ConciergeBell} label="VIP refreshment protocol" size="md" onClick={act('refreshment')} />
        </>
      );
    case 'confirmed':
    case 'rescheduled':
      return (
        <>
          <Button variant="soft" size="sm" leftIcon={UserCheck} onClick={act('checkin')}>
            Check in
          </Button>
          <Button variant="soft" size="sm" leftIcon={BellRing} onClick={act('remind')}>
            Send Reminder
          </Button>
          <Button variant="soft" size="sm" leftIcon={CalendarClock} onClick={act('reschedule')}>
            Reschedule
          </Button>
        </>
      );
    case 'pending':
      return (
        <>
          <Button size="sm" leftIcon={Check} className="shadow-none" onClick={act('accept')}>
            Accept
          </Button>
          <Button variant="soft" size="sm" leftIcon={CalendarClock} onClick={act('propose')}>
            Propose Time
          </Button>
          <IconButton icon={X} label="Decline request" size="md" onClick={act('decline')} />
        </>
      );
    default:
      return <IconButton icon={ClipboardList} label="View details" size="md" onClick={act('intake')} />;
  }
}
