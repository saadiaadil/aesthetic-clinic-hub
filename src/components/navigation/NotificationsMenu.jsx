import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { IconButton } from '@/components/common/IconButton';
import { Popover } from '@/components/common/Popover';
import { Spinner } from '@/components/common/States';
import { useAsync } from '@/hooks/useAsync';
import { useDisclosure } from '@/hooks/useDisclosure';
import { getNotifications, markAllNotificationsRead } from '@/services/notificationService';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/format';

/** Header bell with unread dot (Stitch) and a dropdown feed. */
export function NotificationsMenu({ userId, size = 'lg' }) {
  const { isOpen, toggle, close } = useDisclosure();
  const { data: items = [], isLoading, setData } = useAsync(() => getNotifications(userId), [userId]);
  const unread = items.filter((item) => !item.read).length;

  const markAll = async () => {
    setData((current) => current.map((item) => ({ ...item, read: true })));
    await markAllNotificationsRead(userId);
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={close}
      panelClassName="w-[min(22rem,calc(100vw-2rem))] p-0"
      trigger={
        <IconButton
          icon={Bell}
          label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
          dot={unread > 0}
          size={size}
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
        />
      }
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="font-title-md text-title-md text-on-surface">Notifications</p>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="font-label-sm text-label-sm text-primary hover:text-tertiary">
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto px-2 pb-2">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="px-3 py-6 text-center font-body-sm text-body-sm text-on-surface-variant">You’re all caught up.</p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            onClick={close}
            className={cn('flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container', !item.read && 'bg-surface-container-low')}
          >
            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-secondary')} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-label-md text-label-md text-on-surface">{item.title}</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant">{item.body}</span>
              <span className="mt-0.5 block font-label-sm text-label-sm text-outline">{formatRelative(item.createdAt)}</span>
            </span>
          </Link>
        ))}
      </div>
    </Popover>
  );
}
