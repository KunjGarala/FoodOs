import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Volume2, VolumeX, ChefHat, CheckCircle2, UtensilsCrossed,
  Info, X, Check, Trash2, ArrowRight
} from 'lucide-react';
import {
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  toggleSound,
  clearActiveToast,
  toggleManagementNotifications,
  saveNotificationPreference,
} from '../../store/notificationSlice';

export const NotificationBell = ({ className = '' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((s) => s.auth);
  const isManagement = ['OWNER', 'MANAGER', 'ADMIN'].includes((role || '').toUpperCase());

  const {
    notifications,
    unreadCount,
    soundEnabled,
    managementNotificationsEnabled,
    activeToast,
  } = useSelector((s) => s.notifications);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto clear toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dispatch(clearActiveToast());
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dispatch]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'KOT_FIRED':
        return <ChefHat className="h-4 w-4 text-amber-400" />;
      case 'KOT_READY':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'WAITER_ASSIGNED':
        return <UtensilsCrossed className="h-4 w-4 text-sky-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif) return;
    dispatch(markAsRead(notif.id));
    dispatch(clearActiveToast());
    setIsOpen(false);

    if (notif.tableUuid) {
      navigate(`/app/tables/${notif.tableUuid}`);
    } else if (notif.type === 'KOT_FIRED') {
      navigate('/app/kitchen');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-600 rounded-full ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Toast Popup for Live Alert - Positioned cleanly below bell so it does not overlap */}
      {activeToast && !isOpen && (
        <div
          onClick={() => handleNotificationClick(activeToast)}
          className={`fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-96 bg-white text-slate-900 border p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] animate-slide-down cursor-pointer transition-all flex items-start gap-3.5 group ${
            activeToast.type === 'KOT_READY'
              ? 'border-emerald-500 hover:border-emerald-600'
              : activeToast.type === 'KOT_FIRED'
              ? 'border-amber-500 hover:border-amber-600'
              : 'border-sky-500 hover:border-sky-600'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
              activeToast.type === 'KOT_READY'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : activeToast.type === 'KOT_FIRED'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-sky-50 border-sky-200 text-sky-700'
            }`}
          >
            {getNotificationIcon(activeToast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-600">
                {activeToast.type === 'KOT_READY'
                  ? 'KOT Ready'
                  : activeToast.type === 'KOT_FIRED'
                  ? 'New KOT'
                  : 'Table Assignment'}
              </span>
              <span className="text-[10px] text-slate-600 font-mono shrink-0">
                {formatTimeAgo(activeToast.timestamp)}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-slate-700 transition-colors">
              {activeToast.title}
            </h4>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {activeToast.message}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              {activeToast.tableNumber && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Table {activeToast.tableNumber}
                </span>
              )}
              {activeToast.kotNumber && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-800 border border-slate-200">
                  KOT #{activeToast.kotNumber}
                </span>
              )}
              <span className="text-[11px] text-blue-700 font-semibold ml-auto flex items-center gap-1 group-hover:underline">
                View <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(clearActiveToast());
            }}
            className="text-slate-600 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-900 animate-scale-in">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>

              {/* Sound Toggle (Mute / Unmute) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => dispatch(toggleSound())}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    soundEnabled
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-400 hover:bg-white/10'
                  }`}
                  title={soundEnabled ? 'Sound is ON (Click to Mute)' : 'Sound is MUTED (Click to Unmute)'}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-[11px]">Sound On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 text-slate-400" />
                      <span className="text-[11px]">Muted</span>
                    </>
                  )}
                </button>

                {notifications.length > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs"
                    title="Mark all as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Management Notification Toggle Option (ONLY for Owner, Manager, Admin) */}
            {isManagement && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Management Alerts</p>
                  <p className="text-[10px] text-slate-600">Receive live order & waiter notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(saveNotificationPreference(!managementNotificationsEnabled))}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    managementNotificationsEnabled
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                  title={
                    managementNotificationsEnabled
                      ? 'Click to turn off management alerts'
                      : 'Click to allow management alerts'
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      managementNotificationsEnabled ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {managementNotificationsEnabled ? 'Allowed' : 'Off'}
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-200">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Updates for KOTs and table assignments will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                    !n.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 border border-slate-200">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-600 font-mono shrink-0">
                        {formatTimeAgo(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {n.tableNumber && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Table {n.tableNumber}
                        </span>
                      )}
                      {n.kotNumber && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 text-slate-700 border border-slate-200">
                          KOT #{n.kotNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5 ring-2 ring-blue-600/20" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-3.5">
              <span className="text-[11px] text-slate-600">
                {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
              </span>
              <button
                onClick={() => dispatch(clearAllNotifications())}
                className="text-[11px] text-red-700 hover:text-red-800 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
