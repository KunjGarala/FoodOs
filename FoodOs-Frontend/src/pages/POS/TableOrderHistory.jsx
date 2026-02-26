import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Search, Calendar, Clock, Receipt, Users,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Filter,
  CreditCard, X, Hash, User
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { fetchTableOrderHistory } from '../../store/orderSlice';
import { fetchTableDetails, selectTableDetails } from '../../store/tableSlice';

const STATUS_CONFIG = {
  DRAFT:       { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'Draft' },
  OPEN:        { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Open' },
  KOT_SENT:    { bg: 'bg-indigo-100',  text: 'text-indigo-700',  label: 'KOT Sent' },
  IN_PROGRESS: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'In Progress' },
  READY:       { bg: 'bg-teal-100',    text: 'text-teal-700',    label: 'Ready' },
  SERVED:      { bg: 'bg-cyan-100',    text: 'text-cyan-700',    label: 'Served' },
  BILLED:      { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Billed' },
  PAID:        { bg: 'bg-green-100',   text: 'text-green-700',   label: 'Paid' },
  COMPLETED:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  CANCELLED:   { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Cancelled' },
  VOID:        { bg: 'bg-gray-100',    text: 'text-gray-700',    label: 'Void' },
};

const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    return new Date(timeStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch { return ''; }
};

const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Custom', value: 'custom' },
];

const TableOrderHistory = () => {
  const { tableUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const tableDetails = useSelector(selectTableDetails);
  const { orders, loading, error, pagination } = useSelector(s => s.orders.tableOrderHistory);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const table = tableDetails?.table;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get date range from filter
  const getDateRange = useCallback(() => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        return { startDate: fmt(today), endDate: fmt(today) };
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { startDate: fmt(y), endDate: fmt(y) };
      }
      case '7days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        return { startDate: fmt(d), endDate: fmt(today) };
      }
      case '30days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 30);
        return { startDate: fmt(d), endDate: fmt(today) };
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate };
        }
        return {};
      default:
        return {};
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch table details
  useEffect(() => {
    if (tableUuid) dispatch(fetchTableDetails(tableUuid));
  }, [dispatch, tableUuid]);

  // Fetch order history
  useEffect(() => {
    if (!tableUuid) return;
    const { startDate, endDate } = getDateRange();
    dispatch(fetchTableOrderHistory({
      tableUuid,
      page: currentPage,
      size: 10,
      search: debouncedSearch || undefined,
      startDate,
      endDate,
    }));
  }, [dispatch, tableUuid, currentPage, debouncedSearch, getDateRange]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setCurrentPage(0);
    if (value !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/tables')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                Table {table?.tableNumber || '...'} — Order History
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {table?.sectionName && `${table.sectionName} · `}
                {pagination.totalElements} order{pagination.totalElements !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, order number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || dateFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Date filters */}
          {showFilters && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap gap-2">
                {DATE_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => handleDateFilterChange(f.value)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      dateFilter === f.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {dateFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => { setCustomStartDate(e.target.value); setCurrentPage(0); }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => { setCustomEndDate(e.target.value); setCurrentPage(0); }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-500">Loading orders...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load order history</p>
              <p className="text-xs text-red-600 mt-1">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Receipt className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium text-slate-500">No orders found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'This table has no order history yet'
              }
            </p>
          </div>
        )}

        {/* Order list */}
        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map(order => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
              return (
                <div
                  key={order.orderUuid}
                  onClick={() => navigate(`/app/orders/${order.orderUuid}`)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Left: Order info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          #{order.orderNumber || '—'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                        {order.orderType && (
                          <span className="text-[11px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                            {order.orderType.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 flex-wrap">
                        {order.customerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {order.customerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.orderDate)}
                        </span>
                        {order.orderTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(order.orderTime)}
                          </span>
                        )}
                        {order.itemCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" />
                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {order.waiterName && (
                        <p className="text-xs text-slate-400">Waiter: {order.waiterName}</p>
                      )}
                    </div>

                    {/* Right: Amount */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        {order.paidAmount > 0 && (
                          <p className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                            <CreditCard className="h-3 w-3" />
                            Paid: {formatCurrency(order.paidAmount)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-500">
              Showing {currentPage * pagination.size + 1}–{Math.min((currentPage + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {(() => {
                const pages = [];
                const total = pagination.totalPages;
                let start = Math.max(0, currentPage - 2);
                let end = Math.min(total - 1, currentPage + 2);
                if (currentPage < 2) end = Math.min(total - 1, 4);
                if (currentPage > total - 3) start = Math.max(0, total - 5);

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        i === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                }
                return pages;
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableOrderHistory;
