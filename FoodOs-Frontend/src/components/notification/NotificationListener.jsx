import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useWebSocket from '../../hooks/useWebSocket';
import { addNotification, dismissNotificationsByContext } from '../../store/notificationSlice';
import { soundEffects } from '../../utils/soundEffects';

export const NotificationListener = () => {
  const dispatch = useDispatch();
  const { role, userId, userUuid, activeRestaurantId } = useSelector((s) => s.auth);
  const { soundEnabled, managementNotificationsEnabled } = useSelector((s) => s.notifications);

  const handleNotification = useCallback(
    (notif) => {
      if (!notif) return;

      const userRole = (role || '').toUpperCase();
      const currentUserId = userUuid || userId;
      const notifRole = (notif.recipientRole || 'ALL').toUpperCase();

      // If an order/KOT is served -> remove notifications matching this KOT/order from all waiters
      if (notif.type === 'KOT_SERVED') {
        dispatch(
          dismissNotificationsByContext({
            kotNumber: notif.kotNumber,
            orderUuid: notif.orderUuid,
            tableUuid: notif.tableUuid,
          })
        );
        return;
      }

      const isManagement = ['OWNER', 'MANAGER', 'ADMIN'].includes(userRole);

      let isRelevant = false;

      if (isManagement) {
        // Owner and Manager have an option to get notifications or not; only send if allowed!
        if (managementNotificationsEnabled) {
          isRelevant = true;
        } else {
          isRelevant = false;
        }
      } else if (userRole === 'WAITER') {
        // Waiters do NOT have an option to disable notifications
        if (notifRole === 'WAITER' || notifRole === 'ALL') {
          // If targeted to a specific waiter, match user UUID.
          // When NO waiter is assigned to the table (recipientUserUuid is null/empty), goes to ALL waiters!
          if (!notif.recipientUserUuid || notif.recipientUserUuid === currentUserId) {
            isRelevant = true;
          }
        }
      } else if (userRole === 'CHEF') {
        // Chefs do NOT have an option to disable notifications
        if (notifRole === 'CHEF' || notif.type === 'KOT_FIRED') {
          isRelevant = true;
        }
      } else if (notifRole === 'ALL') {
        isRelevant = true;
      }

      if (isRelevant) {
        dispatch(addNotification(notif));

        // Play chime if user has not muted sound
        if (soundEnabled) {
          soundEffects.play(notif.type);
        }
      }
    },
    [dispatch, role, userId, userUuid, soundEnabled, managementNotificationsEnabled]
  );

  // Subscribe to live notification topic for active restaurant
  useWebSocket(
    activeRestaurantId ? `/topic/notifications/${activeRestaurantId}` : null,
    handleNotification
  );

  return null;
};

export default NotificationListener;
