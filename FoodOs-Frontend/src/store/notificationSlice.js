import { createSlice } from '@reduxjs/toolkit';

const getInitialSoundState = () => {
  try {
    const saved = localStorage.getItem('foodos_notification_sound');
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
};

const getInitialManagementNotifState = () => {
  try {
    const saved = localStorage.getItem('foodos_mgmt_notif_enabled');
    // Default to false so Owner and Manager do not receive operational noise unless they explicitly opt in ("allowing")
    return saved !== null ? saved === 'true' : false;
  } catch {
    return false;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  soundEnabled: getInitialSoundState(),
  managementNotificationsEnabled: getInitialManagementNotifState(),
  activeToast: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const item = action.payload;
      if (!item || !item.id) return;

      // Deduplicate by ID
      const exists = state.notifications.some((n) => n.id === item.id);
      if (exists) return;

      const newNotif = {
        ...item,
        timestamp: item.timestamp || new Date().toISOString(),
        read: false,
      };

      state.notifications.unshift(newNotif);
      // Cap list at 50 notifications
      if (state.notifications.length > 50) {
        state.notifications.pop();
      }
      state.unreadCount += 1;
      state.activeToast = newNotif;
    },

    clearActiveToast: (state) => {
      state.activeToast = null;
    },

    markAsRead: (state, action) => {
      const id = action.payload;
      const target = state.notifications.find((n) => n.id === id);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.activeToast = null;
    },

    // Remove notifications when an order/KOT is served
    dismissNotificationsByContext: (state, action) => {
      const { kotNumber, orderUuid, tableUuid } = action.payload || {};
      const remaining = state.notifications.filter((n) => {
        if (kotNumber && n.kotNumber && String(n.kotNumber) === String(kotNumber)) {
          return false;
        }
        if (orderUuid && n.orderUuid && String(n.orderUuid) === String(orderUuid)) {
          return false;
        }
        if (tableUuid && n.tableUuid && String(n.tableUuid) === String(tableUuid)) {
          if (n.type === 'KOT_READY' || n.type === 'WAITER_ASSIGNED') {
            return false;
          }
        }
        return true;
      });
      state.notifications = remaining;
      state.unreadCount = remaining.filter((n) => !n.read).length;

      // Also dismiss toast if it matches the served item
      if (
        state.activeToast &&
        ((kotNumber && state.activeToast.kotNumber && String(state.activeToast.kotNumber) === String(kotNumber)) ||
          (orderUuid && state.activeToast.orderUuid && String(state.activeToast.orderUuid) === String(orderUuid)) ||
          (tableUuid && state.activeToast.tableUuid && String(state.activeToast.tableUuid) === String(tableUuid)))
      ) {
        state.activeToast = null;
      }
    },

    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
      try {
        localStorage.setItem('foodos_notification_sound', String(state.soundEnabled));
      } catch (e) {
        console.warn('Failed to save sound preference:', e);
      }
    },

    setSoundEnabled: (state, action) => {
      state.soundEnabled = Boolean(action.payload);
      try {
        localStorage.setItem('foodos_notification_sound', String(state.soundEnabled));
      } catch (e) {
        console.warn('Failed to save sound preference:', e);
      }
    },

    toggleManagementNotifications: (state) => {
      state.managementNotificationsEnabled = !state.managementNotificationsEnabled;
      try {
        localStorage.setItem(
          'foodos_mgmt_notif_enabled',
          String(state.managementNotificationsEnabled)
        );
      } catch (e) {
        console.warn('Failed to save management notifications preference:', e);
      }
    },

    setManagementNotificationsEnabled: (state, action) => {
      state.managementNotificationsEnabled = Boolean(action.payload);
      try {
        localStorage.setItem(
          'foodos_mgmt_notif_enabled',
          String(state.managementNotificationsEnabled)
        );
      } catch (e) {
        console.warn('Failed to save management notifications preference:', e);
      }
    },
  },
});

export const {
  addNotification,
  clearActiveToast,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  dismissNotificationsByContext,
  toggleSound,
  setSoundEnabled,
  toggleManagementNotifications,
  setManagementNotificationsEnabled,
} = notificationSlice.actions;

export const saveNotificationPreference = (enabled) => async (dispatch) => {
  dispatch(setManagementNotificationsEnabled(enabled));
  try {
    const { profileAPI } = await import('../services/api');
    await profileAPI.updateNotificationPreference(enabled);
  } catch (err) {
    console.warn('Failed to save notification preference to DB:', err);
  }
};

export default notificationSlice.reducer;
