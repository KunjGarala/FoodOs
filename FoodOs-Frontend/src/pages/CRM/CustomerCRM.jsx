import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search, Phone, Mail, MapPin, Calendar, Users, Crown,
  Star, ShoppingBag, Tag, StickyNote,
  ChevronLeft, ChevronRight, X, Edit2, Save,
} from 'lucide-react';
import {
  PageHeader, Panel, Kpi, Pill, BtnPrimary, BtnGhost, Sheet,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  fetchCustomers,
  searchCustomers,
  fetchCustomerDetail,
  updateCustomer,
  fetchCrmStats,
  clearCustomerDetail,
  setSearchQuery,
} from '../../store/customerSlice';

// ── helpers ────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

// deterministic avatar tint from the name
const AVATAR_TINTS = [
  'bg-marigold/20 text-[#9a6500]',
  'bg-success/15 text-success-deep',
  'bg-gold/30 text-[#7a5e1d]',
  'bg-danger/15 text-danger-deep',
  'bg-ink/10 text-ink-text',
];
const avatarTint = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % AVATAR_TINTS.length;
  return AVATAR_TINTS[h];
};

// tier derived from lifetime spend
const tierFor = (totalSpent = 0) => {
  const v = Number(totalSpent) || 0;
  if (v >= 50000) return { label: 'Gold', tone: 'gold', icon: true };
  if (v >= 15000) return { label: 'Silver', tone: 'marigold', icon: false };
  return { label: 'Regular', tone: 'neutral', icon: false };
};

const CustomerCRM = () => {
  const dispatch = useDispatch();
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const {
    customers, totalElements, totalPages, currentPage,
    selectedCustomer, stats,
    loading, detailLoading, searchQuery,
  } = useSelector((state) => state.customers);

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '', tags: '' });
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [selectedUuid, setSelectedUuid] = useState(null);

  // Load customers and stats on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: 0, size: 20 }));
      dispatch(fetchCrmStats(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setLocalSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      dispatch(setSearchQuery(value));
      if (value.trim()) {
        dispatch(searchCustomers({ restaurantUuid: activeRestaurantId, query: value, page: 0, size: 20 }));
      } else {
        dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: 0, size: 20 }));
      }
    }, 400);
    setDebounceTimer(timer);
  }, [dispatch, activeRestaurantId, debounceTimer]);

  // Pagination
  const handlePageChange = (newPage) => {
    if (localSearch.trim()) {
      dispatch(searchCustomers({ restaurantUuid: activeRestaurantId, query: localSearch, page: newPage, size: 20 }));
    } else {
      dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: newPage, size: 20 }));
    }
  };

  // View customer detail
  const handleViewCustomer = (customerUuid) => {
    dispatch(fetchCustomerDetail(customerUuid));
    setSelectedUuid(customerUuid);
    setDetailOpen(true);
    setEditMode(false);
  };

  // Close detail
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setEditMode(false);
    setSelectedUuid(null);
    dispatch(clearCustomerDetail());
  };

  // Start editing
  const handleStartEdit = () => {
    if (selectedCustomer) {
      setEditForm({
        notes: selectedCustomer.notes || '',
        tags: selectedCustomer.tags || '',
        name: selectedCustomer.name || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
      });
      setEditMode(true);
    }
  };

  // Save edits
  const handleSaveEdit = () => {
    if (selectedCustomer) {
      dispatch(updateCustomer({
        customerUuid: selectedCustomer.customerUuid,
        data: editForm,
      })).then(() => {
        dispatch(fetchCustomerDetail(selectedCustomer.customerUuid));
        setEditMode(false);
      });
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Relative time
  const relativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // ── shared profile body (used in desktop panel + mobile sheet) ─────────────
  const renderProfile = () => {
    if (detailLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-input border-t-marigold" />
        </div>
      );
    }
    if (!selectedCustomer) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-txt-faint">
          <Users className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium text-txt-muted">Select a guest</p>
          <p className="text-xs mt-1">Tap a row to see their profile</p>
        </div>
      );
    }

    const tier = tierFor(selectedCustomer.totalSpent);

    return (
      <div className="space-y-5">
        {/* identity */}
        <div className="flex items-start gap-3">
          <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold', avatarTint(selectedCustomer.name))}>
            {initials(selectedCustomer.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg font-bold text-ink-text truncate">{selectedCustomer.name}</h3>
              <Pill tone={tier.tone}>
                {tier.icon && <Crown className="h-3 w-3" />}
                {tier.label}
              </Pill>
            </div>
            <div className="mt-1 space-y-0.5 text-sm text-txt-muted">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-txt-faint" />
                <span className="truncate">{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-txt-faint" />
                  <span className="truncate">{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-txt-faint" />
                  <span>{selectedCustomer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-txt-faint" />
                <span className="text-txt-faint">Guest since {formatDate(selectedCustomer.firstOrderDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* edit identity fields */}
        {editMode && (
          <div className="space-y-2 rounded-tile bg-paper-2 p-3">
            <input
              className="w-full rounded-input border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-text outline-none focus:border-marigold"
              placeholder="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <input
              className="w-full rounded-input border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-text outline-none focus:border-marigold"
              placeholder="Email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <input
              className="w-full rounded-input border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-text outline-none focus:border-marigold"
              placeholder="Address"
              value={editForm.address || ''}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
        )}

        {/* stat chips */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Visits', value: selectedCustomer.totalOrders || 0 },
            { label: 'Lifetime', value: formatCurrency(selectedCustomer.totalSpent) },
            { label: 'Avg order', value: formatCurrency(selectedCustomer.averageOrderValue) },
          ].map((chip) => (
            <div key={chip.label} className="rounded-tile bg-paper-2 px-3 py-2.5 text-center">
              <p className="font-display text-base font-bold text-ink-text leading-none">{chip.value}</p>
              <p className="eyebrow mt-1.5 text-[10px] text-txt-faint">{chip.label}</p>
            </div>
          ))}
        </div>

        {/* tags */}
        <div className="space-y-2">
          <p className="eyebrow flex items-center gap-1 text-[10px] text-txt-faint">
            <Tag className="h-3 w-3" /> Tags
          </p>
          {editMode ? (
            <input
              className="w-full rounded-input border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-text outline-none focus:border-marigold"
              placeholder="Comma-separated tags (e.g., VIP, Regular)"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedCustomer.tags
                ? selectedCustomer.tags.split(',').map((tag, i) => (
                  <Pill key={i} tone="marigold">{tag.trim()}</Pill>
                ))
                : <span className="text-sm text-txt-faint">No tags</span>}
            </div>
          )}
        </div>

        {/* favourites */}
        {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.length > 0 && (
          <div className="space-y-2">
            <p className="eyebrow flex items-center gap-1 text-[10px] text-txt-faint">
              <Star className="h-3 w-3" /> Favourites
            </p>
            <div className="space-y-1.5">
              {selectedCustomer.favoriteItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-tile bg-paper-2 px-3 py-2 text-sm">
                  <span className="text-ink-text">{item.productName}</span>
                  <Pill tone="neutral" className="font-mono">{item.timesOrdered}x</Pill>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* recent orders */}
        {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 && (
          <div className="space-y-2">
            <p className="eyebrow flex items-center gap-1 text-[10px] text-txt-faint">
              <ShoppingBag className="h-3 w-3" /> Recent orders
            </p>
            <div className="divide-y divide-line-light rounded-tile border border-line-light overflow-hidden">
              {selectedCustomer.recentOrders.map((order) => (
                <div key={order.orderUuid} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-text truncate">{order.orderNumber}</p>
                    <p className="text-xs text-txt-faint">
                      {formatDate(order.orderDate)} · {order.orderType?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-ink-text">{formatCurrency(order.totalAmount)}</span>
                    <Pill
                      tone={
                        order.status === 'COMPLETED' || order.status === 'PAID' ? 'success'
                          : order.status === 'CANCELLED' ? 'danger' : 'neutral'
                      }
                    >
                      {order.status}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* notes */}
        <div className="space-y-2 rounded-tile border border-line-light bg-paper-2 p-3">
          <p className="eyebrow flex items-center gap-1 text-[10px] text-txt-faint">
            <StickyNote className="h-3 w-3" /> Notes
          </p>
          {editMode ? (
            <textarea
              className="w-full resize-none rounded-input border border-line-input bg-paper-card px-3 py-2 text-sm text-ink-text outline-none focus:border-marigold"
              rows={3}
              placeholder="Add notes about this guest..."
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          ) : (
            <p className="text-sm text-txt-muted">
              {selectedCustomer.notes || <span className="text-txt-faint">No notes yet</span>}
            </p>
          )}
        </div>

        {/* actions */}
        <div className="flex justify-end gap-2 pt-1">
          {editMode ? (
            <>
              <BtnGhost onClick={() => setEditMode(false)}>
                <X className="h-4 w-4" /> Cancel
              </BtnGhost>
              <BtnPrimary onClick={handleSaveEdit}>
                <Save className="h-4 w-4" /> Save
              </BtnPrimary>
            </>
          ) : (
            <BtnGhost onClick={handleStartEdit}>
              <Edit2 className="h-4 w-4" /> Edit
            </BtnGhost>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests"
        subtitle="Guest insights from order history"
        actions={(
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
            <input
              className="h-10 w-full rounded-input border border-line-input bg-paper-card pl-9 pr-3 text-sm text-ink-text outline-none placeholder:text-txt-faint focus:border-marigold"
              placeholder="Search name, phone, email..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        )}
      />

      {/* KPI row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi tone="ink" label="Total Guests" value={stats.totalCustomers || 0} sub="All-time" />
          <Kpi label="Returning" value={stats.returningCustomers || 0} sub="More than 1 order" />
          <Kpi label="New" value={stats.newCustomers || 0} sub="Single order" />
          <Kpi label="Return Rate" value={`${stats.returnRate || 0}%`} sub="Of all guests" />
        </div>
      )}

      {/* List + profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* GUEST LIST */}
        <Panel className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line-light px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink-text">Guests</p>
            <span className="text-xs text-txt-faint">
              {totalElements} guest{totalElements !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-input border-t-marigold" />
            </div>
          )}

          {!loading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-txt-faint">
              <Users className="mb-3 h-12 w-12" />
              <p className="text-base font-medium text-txt-muted">No guests found</p>
              <p className="mt-1 text-sm">
                {localSearch ? 'Try a different search term' : 'Guests will appear here as orders come in'}
              </p>
            </div>
          )}

          {!loading && customers.length > 0 && (
            <div className="divide-y divide-line-light overflow-auto">
              {customers.map((customer) => {
                const active = selectedUuid === customer.customerUuid;
                return (
                  <button
                    type="button"
                    key={customer.customerUuid}
                    onClick={() => handleViewCustomer(customer.customerUuid)}
                    className={cn(
                      'relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      active ? 'bg-marigold/10' : 'hover:bg-paper-2',
                    )}
                  >
                    {active && <span className="absolute inset-y-0 left-0 w-1 bg-marigold" />}
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold font-display', avatarTint(customer.name))}>
                      {initials(customer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-text">{customer.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-txt-muted">
                        <Phone className="h-3 w-3 shrink-0 text-txt-faint" />
                        {customer.phone}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-semibold text-ink-text">
                        {customer.totalOrders || 0} visit{customer.totalOrders !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-txt-faint">{relativeTime(customer.lastOrderDate)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold text-ink-text">{formatCurrency(customer.totalSpent)}</p>
                      <p className="eyebrow text-[10px] text-txt-faint">lifetime</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-auto flex items-center justify-between border-t border-line-light px-4 py-3">
              <p className="text-xs text-txt-faint">
                Page {currentPage + 1} of {totalPages} ({totalElements} total)
              </p>
              <div className="flex items-center gap-2">
                <BtnGhost
                  className="h-9 w-9 px-0"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </BtnGhost>
                <BtnGhost
                  className="h-9 w-9 px-0"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </BtnGhost>
              </div>
            </div>
          )}
        </Panel>

        {/* PROFILE PANEL (desktop) */}
        <Panel className="hidden p-5 lg:block">
          {renderProfile()}
        </Panel>
      </div>

      {/* PROFILE SHEET (mobile) */}
      <div className="lg:hidden">
        <Sheet open={detailOpen} onClose={handleCloseDetail} side="right">
          <div className="flex items-center justify-between border-b border-line-light px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink-text">Guest Profile</p>
            <button type="button" onClick={handleCloseDetail} className="rounded-full p-1 text-txt-muted hover:bg-paper-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {renderProfile()}
          </div>
        </Sheet>
      </div>
    </div>
  );
};

export default CustomerCRM;
