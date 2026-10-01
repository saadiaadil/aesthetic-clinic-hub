import { USE_MOCK_API } from '@/constants/config';
import { http, mockRequest } from './apiClient';
import { db } from './mock/mockDb';

/**
 * Header notifications. Push notifications are Phase 2; this is the in-app feed.
 * REST endpoints (Phase 5): GET /me/notifications, PATCH /me/notifications/read
 */

export function getNotifications(userId) {
  if (!USE_MOCK_API) return http('/me/notifications');
  return mockRequest(
    () => db.where('notifications', (item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    { delay: 150 },
  );
}

export function markAllNotificationsRead(userId) {
  if (!USE_MOCK_API) return http('/me/notifications/read', { method: 'PATCH' });
  return mockRequest(() => {
    db.where('notifications', (item) => item.userId === userId && !item.read).forEach((item) => db.update('notifications', item.id, { read: true }));
    return { ok: true };
  }, { delay: 100 });
}
