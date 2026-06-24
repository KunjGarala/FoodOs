import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Users, Clock, Plus, Edit, Trash2, Shuffle, ArrowRightLeft, BarChart3,
  AlertCircle, X, Check, Loader2, Power, Eye, HandMetal, Activity, ChevronUp, ChevronDown as ChevronDownIcon,
  Wifi, WifiOff, UserCheck, Star
} from 'lucide-react';
import {
  getTablesByRestaurant, getAllTables, createTable, updateTable, updateTableStatus, deleteTable,
  mergeTables, transferTable, getTableAnalytics, clearError,
  setSectionFilter, selectFilteredTables, selectTableLoading,
  selectTableActionLoading, selectTableError, selectTableFilters, selectTableAnalytics,
  selectTablePagination, getValidNextStatuses, isValidStatusTransition, occupyTable,
  handleTableWsEvent, assignWaiter,
} from '../../store/tableSlice';
import { selectActiveRestaurant, selectRole } from '../../store/authSlice';
import { employeeAPI, tableAPI } from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { DarkScreen, Segmented, Pill, LivePill, Sheet } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

// Live Floor status → table-card palette (dark surface)
const FLOOR_CARD = {
  OCCUPIED: 'bg-table-occupied text-ink border-transparent',
  BILLED: 'bg-table-billing text-[#06281a] border-transparent',
  DIRTY: 'bg-table-dirty text-[#ef8a88] border border-dashed border-danger',
  RESERVED: 'bg-table-reserved text-[#3a2c10] border-transparent',
  VACANT: 'bg-ink-card2 text-[#9fb0c1] border border-ink-line',
};
const FLOOR_PILL = {
  OCCUPIED: 'marigold', BILLED: 'success', DIRTY: 'danger', RESERVED: 'gold', VACANT: 'neutral',
};

const TABLE_SHAPES = ['RECTANGLE', 'ROUND', 'SQUARE', 'OVAL'];

// Utility function to calculate occupied time from seatedAt timestamp
const calculateOccupiedTime = (seatedAt) => {
  if (!seatedAt) return null;
  
  try {
    const seatedDate = new Date(seatedAt);
    const now = new Date();
    const diffMs = now - seatedDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '<1 min';
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } catch (e) {
    console.error('Error calculating occupied time:', e);
    return null;
  }
};

const TableManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeRestaurantId = useSelector(selectActiveRestaurant);
  const userRole = useSelector(selectRole);
  const currentUserUuid = useSelector((state) => state.auth.userId);
  const tables = useSelector(selectFilteredTables);
  const loading = useSelector(selectTableLoading);
  const actionLoading = useSelector(selectTableActionLoading);
  const error = useSelector(selectTableError);
  const filters = useSelector(selectTableFilters);
  const analytics = useSelector(selectTableAnalytics);
  const pagination = useSelector(selectTablePagination);

  // Determine if user has manager-level access (MANAGER, OWNER, ADMIN)
  const hasManagerAccess = ['MANAGER', 'OWNER', 'ADMIN'].includes(userRole);
  const isWaiter = userRole === 'WAITER';

  // Everyone on the floor view sees every table (vacant, occupied, billing, etc.).
  const displayTables = tables;

  // A waiter may only ACT on tables assigned to them; managers/owners act on any.
  const canActOnTable = (table) =>
    !isWaiter || table.currentWaiterUuid === currentUserUuid;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAssignWaiterModal, setShowAssignWaiterModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [waiterList, setWaiterList] = useState([]);
  const [waiterListLoading, setWaiterListLoading] = useState(false);
  const [assignWaiterTableUuid, setAssignWaiterTableUuid] = useState(null);

  const [tableForm, setTableForm] = useState({
    sectionName: '', tableNumber: '', capacity: 4, minCapacity: 1,
    shape: 'RECTANGLE', posX: 0, posY: 0, isActive: true,
  });

  const [statusForm, setStatusForm] = useState({
    status: 'VACANT', currentOrderId: '', waiterUuid: null, currentPax: 0, tableNumber: '', tableUuid: '',
  });

  const [mergeForm, setMergeForm] = useState({ parentTableUuid: '', childTableUuids: [] });
  const [transferForm, setTransferForm] = useState({ fromTableUuid: '', toTableUuid: '' });
  const [validStatuses, setValidStatuses] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date()); // For real-time occupied time updates
  const [actionPopoverTable, setActionPopoverTable] = useState(null); // For vacant table action popover
  const popoverRef = useRef(null);

  // ── Redesign Live Floor state ──
  const [floorSelected, setFloorSelected] = useState(null); // table selected into detail panel
  const [floorView, setFloorView] = useState('map');         // 'map' | 'list'
  const [liveSummary, setLiveSummary] = useState(null);      // pressure-band KPIs from backend
  const [seatPax, setSeatPax] = useState(2);                 // guest count for "Seat guests"

  const sections = ['All', ...new Set(tables.map(t => t.sectionName).filter(Boolean))];

  // Update time every minute for real-time occupied time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // ─── WebSocket: real-time table updates ───────────
  useWebSocket(
    activeRestaurantId ? `/topic/tables/${activeRestaurantId}` : null,
    (data) => {
      dispatch(handleTableWsEvent(data));
    }
  );

  // Close action popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActionPopoverTable(null);
      }
    };
    if (actionPopoverTable) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionPopoverTable]);

  // Fetch tables based on user role
  useEffect(() => {
    if (hasManagerAccess) {
      // MANAGER/OWNER/ADMIN: Fetch all tables with pagination
      dispatch(getAllTables({ 
        page: pagination.page, 
        size: pagination.size, 
        status: filters.status,
        restaurantUuid: activeRestaurantId
      }));
    } else if (activeRestaurantId) {
      // WAITER: Fetch only restaurant-specific tables
      dispatch(getTablesByRestaurant(activeRestaurantId));
    }
  }, [activeRestaurantId, dispatch, hasManagerAccess, pagination.page, pagination.size, filters.status]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Live pressure-band summary (covers seated / turning / dwell / KOTs late)
  useEffect(() => {
    if (!activeRestaurantId) return;
    let active = true;
    const load = () => {
      tableAPI.getLiveSummary(activeRestaurantId)
        .then((res) => { if (active) setLiveSummary(res.data); })
        .catch(() => { /* fall back to client-side metrics */ });
    };
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [activeRestaurantId]);

  // Keep the selected detail card in sync with refreshed table data
  useEffect(() => {
    if (!floorSelected) return;
    const fresh = tables.find((t) => t.tableUuid === floorSelected.tableUuid);
    if (fresh && fresh !== floorSelected) setFloorSelected(fresh);
  }, [tables]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTable = async () => {
    try {
      await dispatch(createTable({ restaurantUuid: activeRestaurantId, ...tableForm })).unwrap();
      
      // Refresh tables after creation
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status,
          restaurantUuid: activeRestaurantId
        })).unwrap();
      } else if (activeRestaurantId) {
        await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
      }
      
      setShowCreateModal(false);
      resetTableForm();
    } catch (err) {
      console.error('Create failed:', err);
    }
  };

  const handleUpdateTable = async () => {
    try {
      await dispatch(updateTable({ tableUuid: selectedTable.tableUuid, data: tableForm })).unwrap();
      
      // Refresh tables to ensure all fields are up-to-date
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status,
          restaurantUuid: activeRestaurantId
        })).unwrap();
      } else if (activeRestaurantId) {
        await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
      }
      
      setShowEditModal(false);
      setSelectedTable(null);
      resetTableForm();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const { tableUuid, tableNumber: _tableNumber, ...statusData } = statusForm;
      
      console.log('Update status - tableUuid:', tableUuid, 'statusData:', statusData);
      
      if (!tableUuid) {
        console.error('No table UUID available in statusForm:', statusForm);
        alert('Error: Unable to update table status. Table ID is missing.');
        return;
      }

      // Validate status transition
      if (selectedTable && !isValidStatusTransition(selectedTable.status, statusData.status)) {
        alert(`Invalid status transition from ${selectedTable.status} to ${statusData.status}`);
        return;
      }
      
      await dispatch(updateTableStatus({ tableUuid, statusData })).unwrap();
      
      // Refresh tables to ensure all fields (including restaurantName) are up-to-date
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status,
          restaurantUuid: activeRestaurantId
        })).unwrap();
      } else if (activeRestaurantId) {
        await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
      }
      
      setShowStatusModal(false);
      setSelectedTable(null);
      resetStatusForm();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteTable = async (tableUuid) => {
    if (window.confirm('Delete this table?')) {
      try {
        await dispatch(deleteTable(tableUuid)).unwrap();
        
        // Refresh tables after deletion
        if (hasManagerAccess) {
          await dispatch(getAllTables({ 
            page: pagination.page, 
            size: pagination.size, 
            status: filters.status,
            restaurantUuid: activeRestaurantId
          })).unwrap();
        } else if (activeRestaurantId) {
          await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
        }
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleToggleTableActive = async (table) => {
    // Prevent activating merged tables
    if (table.isMerged && !table.isActive) {
      alert('Cannot activate a merged table. Please demerge the parent table first.');
      return;
    }

    const action = table.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} table ${table.tableNumber}?`)) {
      try {
        await dispatch(updateTable({ 
          tableUuid: table.tableUuid, 
          data: { isActive: !table.isActive } 
        })).unwrap();
        
        // Refresh tables to reflect the change
        if (hasManagerAccess) {
          await dispatch(getAllTables({ 
            page: pagination.page, 
            size: pagination.size, 
            status: filters.status,
            restaurantUuid: activeRestaurantId
          })).unwrap();
        } else if (activeRestaurantId) {
          await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
        }
      } catch (err) {
        console.error('Toggle active status failed:', err);
      }
    }
  };

  const handleMergeTables = async () => {
    try {
      await dispatch(mergeTables(mergeForm)).unwrap();
      
      // Refresh tables to ensure merged table status is up-to-date
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status,
          restaurantUuid: activeRestaurantId
        })).unwrap();
      } else if (activeRestaurantId) {
        await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
      }
      
      setShowMergeModal(false);
      resetMergeForm();
    } catch (err) {
      console.error('Merge failed:', err);
    }
  };

  const handleTransferTable = async () => {
    try {
      await dispatch(transferTable(transferForm)).unwrap();
      
      // Refresh tables to ensure transferred table status is up-to-date
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status,
          restaurantUuid: activeRestaurantId
        })).unwrap();
      } else if (activeRestaurantId) {
        await dispatch(getTablesByRestaurant(activeRestaurantId)).unwrap();
      }
      
      setShowTransferModal(false);
      resetTransferForm();
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  const handleViewAnalytics = async () => {
    try {
      await dispatch(getTableAnalytics(activeRestaurantId)).unwrap();
      setShowAnalyticsModal(true);
    } catch (err) {
      console.error('Analytics failed:', err);
    }
  };

  const handleOpenAssignWaiter = async (table) => {
    setAssignWaiterTableUuid(table.tableUuid);
    setSelectedTable(table);
    setShowAssignWaiterModal(true);
    setWaiterListLoading(true);
    try {
      const res = await employeeAPI.getAll({ role: 'WAITER', restaurantUuid: activeRestaurantId });
      setWaiterList(Array.isArray(res.data) ? res.data : (res.data?.content || []));
    } catch (err) {
      console.error('Failed to fetch waiters:', err);
      setWaiterList([]);
    } finally {
      setWaiterListLoading(false);
    }
  };

  const handleAssignWaiter = async (waiterUuid) => {
    if (!assignWaiterTableUuid || !waiterUuid) return;
    try {
      await dispatch(assignWaiter({ tableUuid: assignWaiterTableUuid, waiterUuid })).unwrap();
      setShowAssignWaiterModal(false);
      setAssignWaiterTableUuid(null);
      // Refresh tables
      if (hasManagerAccess) {
        dispatch(getAllTables({ page: pagination.page, size: pagination.size, status: filters.status, restaurantUuid: activeRestaurantId }));
      } else if (activeRestaurantId) {
        dispatch(getTablesByRestaurant(activeRestaurantId));
      }
    } catch (err) {
      console.error('Assign waiter failed:', err);
    }
  };

  const openEditModal = (table) => {
    // Prevent editing inactive tables
    if (table.isActive === false) {
      alert('Cannot edit inactive table. Please activate it first.');
      return;
    }
    
    setSelectedTable(table);
    setTableForm({
      sectionName: table.sectionName || '', tableNumber: table.tableNumber || '',
      capacity: table.capacity || 4, minCapacity: table.minCapacity || 1,
      shape: table.shape || 'RECTANGLE', posX: table.posX || 0,
      posY: table.posY || 0, isActive: table.isActive !== false,
    });
    setShowEditModal(true);
  };

  const openStatusModal = (table) => {
    if (!table) {
      console.error('No table provided to openStatusModal');
      return;
    }

    // Prevent opening modal for inactive tables
    if (table.isActive === false) {
      console.log('Cannot modify inactive table:', table.tableNumber);
      return;
    }
    
    if (!table.tableUuid) {
      console.error('Table UUID is missing:', table);
      alert('Error: Table UUID is missing. Please refresh and try again.');
      return;
    }
    
    console.log('Opening modal for table:', table.tableNumber, 'UUID:', table.tableUuid);
    
    // Calculate valid next statuses based on current status
    const validNextStatuses = getValidNextStatuses(table.status);
    setValidStatuses(validNextStatuses);
    
    // Set all state updates - React 18 batches these automatically
    setSelectedTable(table);
    setStatusForm({
      status: validNextStatuses.length > 0 ? validNextStatuses[0] : table.status,
      currentOrderId: table.currentOrderId || '',
      waiterUuid: table.waiterUuid || '', 
      currentPax: table.currentPax || 0,
      tableNumber: table.tableNumber || '',
      tableUuid: table.tableUuid,
    });
    setShowStatusModal(true);

    // Fetch waiter list for dropdown
    if (hasManagerAccess) {
      employeeAPI.getAll({ role: 'WAITER', restaurantUuid: activeRestaurantId })
        .then(res => setWaiterList(Array.isArray(res.data) ? res.data : (res.data?.content || [])))
        .catch(() => setWaiterList([]));
    }
  };

  const resetTableForm = () => setTableForm({
    sectionName: '', tableNumber: '', capacity: 4, minCapacity: 1,
    shape: 'RECTANGLE', posX: 0, posY: 0, isActive: true,
  });

  const resetStatusForm = () => setStatusForm({ status: 'VACANT', currentOrderId: '', waiterUuid: '', currentPax: 0, tableNumber: '', tableUuid: '' });
  const resetMergeForm = () => setMergeForm({ parentTableUuid: '', childTableUuids: [] });
  const resetTransferForm = () => setTransferForm({ fromTableUuid: '', toTableUuid: '' });

  const formatINR = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0));

  // A single floor table card — used both in the spatial map (absolute) and grid fallback.
  const renderFloorCard = (table, absolute = false) => {
    const isInactive = table.isActive === false;
    const mins = table.seatedAt ? Math.floor((currentTime - new Date(table.seatedAt)) / 60000) : 0;
    const late = table.status === 'OCCUPIED' && mins >= 45;
    const round = (table.shape || '').toUpperCase() === 'ROUND';
    const busy = table.status === 'OCCUPIED' || table.status === 'BILLED';
    const selected = floorSelected?.tableUuid === table.tableUuid;
    const mine = isWaiter && table.currentWaiterUuid === currentUserUuid;
    return (
      <button
        key={table.tableUuid}
        type="button"
        onClick={() => !isInactive && setFloorSelected(table)}
        style={absolute ? { left: table.posX || 0, top: table.posY || 0 } : undefined}
        className={cn(
          absolute && 'absolute',
          'w-[118px] h-[104px] p-2.5 flex flex-col justify-between text-left transition',
          round ? 'rounded-full items-center justify-center text-center' : 'rounded-tile',
          isInactive
            ? 'bg-ink-card2/40 text-txt-faintDark border border-dashed border-ink-line opacity-60'
            : cn(FLOOR_CARD[table.status] || FLOOR_CARD.VACANT, 'hover:brightness-105'),
          mine && !selected && 'ring-2 ring-marigold/70',
          selected && 'ring-2 ring-marigold ring-offset-2 ring-offset-ink-panel',
        )}
      >
        <div className="flex items-center justify-between w-full gap-1">
          <span className="flex items-center gap-1 min-w-0">
            {mine && <Star className="h-3.5 w-3.5 fill-current shrink-0" />}
            <span className="font-display font-bold text-[22px] leading-none">{table.tableNumber}</span>
          </span>
          {!round && busy && (
            <span className={cn('font-mono text-[10px] leading-none px-1.5 py-1 rounded-full whitespace-nowrap shrink-0', late ? 'bg-danger text-white' : 'bg-black/15')}>
              {calculateOccupiedTime(table.seatedAt) || '—'}
            </span>
          )}
        </div>
        <div className={cn('w-full min-w-0', round && 'mt-1')}>
          <div className="font-mono text-[10px] opacity-80">{table.currentPax || 0}/{table.capacity} pax</div>
          {!round && table.currentWaiterName && busy && (
            <div className="text-[10px] font-medium truncate">{table.currentWaiterName}</div>
          )}
          {!round && table.currentOrderTotal != null && busy && (
            <div className="font-mono text-[11px] font-bold">{formatINR(table.currentOrderTotal)}</div>
          )}
        </div>
      </button>
    );
  };

  const STATUS_GROUPS = [
    { key: 'OCCUPIED', label: 'Occupied' },
    { key: 'BILLED', label: 'Billing' },
    { key: 'VACANT', label: 'Open' },
    { key: 'DIRTY', label: 'Dirty' },
    { key: 'RESERVED', label: 'Reserved' },
  ];

  // Detail panel content for the selected floor table (used in aside + mobile sheet).
  const renderDetail = () => {
    const t = floorSelected;
    if (!t) {
      return (
        <div className="h-full grid place-items-center p-8 text-center text-txt-faintDark text-sm">
          Select a table to see its session & actions.
        </div>
      );
    }
    const busy = t.status === 'OCCUPIED' || t.status === 'BILLED';
    const canAct = canActOnTable(t);
    const Stat = ({ label, value, highlight }) => (
      <div className="rounded-tile bg-ink-card2 p-3">
        <p className="eyebrow text-[9px] text-txt-faintDark">{label}</p>
        <p className={cn('font-display font-bold text-base mt-0.5 truncate', highlight ? 'text-marigold' : 'text-white')}>{value}</p>
      </div>
    );
    const Action = (props) => {
      const { icon: Icon, label, onClick, primary, danger, disabled } = props;
      return (
        <button onClick={onClick} disabled={disabled}
          className={cn('flex items-center justify-center gap-2 h-11 rounded-input text-sm font-semibold transition disabled:opacity-40',
            primary ? 'bg-marigold text-ink hover:brightness-105'
              : danger ? 'bg-danger/15 text-danger hover:bg-danger/25'
              : 'bg-ink-card2 text-txt-light hover:bg-ink-card2/70')}>
          <Icon className="h-4 w-4" /> {label}
        </button>
      );
    };
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-ink-line flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg text-white truncate">Table {t.tableNumber}</h3>
            <p className="text-[11px] text-txt-mutedDark truncate">{t.sectionName || 'Floor'} · {t.capacity} seats</p>
          </div>
          <Pill tone={FLOOR_PILL[t.status] || 'neutral'}>{t.status}</Pill>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Guests" value={`${t.currentPax || 0}/${t.capacity}`} />
            <Stat label="Dwell" value={busy && t.seatedAt ? calculateOccupiedTime(t.seatedAt) : '—'} />
            <Stat label="Waiter" value={t.currentWaiterName || '—'} />
            <Stat label="Running" value={busy && t.currentOrderTotal != null ? formatINR(t.currentOrderTotal) : '—'} highlight />
          </div>

          {!canAct ? (
            <div className="rounded-input bg-ink-card2 border border-ink-line px-3 py-4 text-center">
              <p className="text-sm text-txt-light font-medium">
                {t.currentWaiterName ? `Assigned to ${t.currentWaiterName}` : 'Not assigned to you'}
              </p>
              <p className="text-[11px] text-txt-faintDark mt-1">
                You can view this table — a manager assigns the tables you serve.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {t.status === 'VACANT' ? (
                  <>
                    <div className="col-span-2 flex items-center justify-between rounded-input bg-ink-card2 px-3 py-2">
                      <span className="eyebrow text-[10px] text-txt-faintDark">Guests</span>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setSeatPax((p) => Math.max(1, p - 1))}
                          className="h-7 w-7 rounded-full bg-ink-card text-txt-light grid place-items-center text-lg leading-none hover:text-white">−</button>
                        <span className="font-display font-bold text-white w-6 text-center tabular-nums">{seatPax}</span>
                        <button type="button" onClick={() => setSeatPax((p) => Math.min(t.capacity || 99, p + 1))}
                          className="h-7 w-7 rounded-full bg-ink-card text-txt-light grid place-items-center text-lg leading-none hover:text-white">+</button>
                      </div>
                    </div>
                    <Action icon={HandMetal} label="Seat guests" primary disabled={actionLoading}
                      onClick={async () => {
                        try {
                          await dispatch(occupyTable({ tableUuid: t.tableUuid, data: { orderType: 'DINE_IN', numberOfGuests: seatPax } })).unwrap();
                          navigate(`/app/tables/${t.tableUuid}`);
                        } catch (err) { console.error('Failed to occupy table:', err); }
                      }} />
                    <Action icon={Eye} label="View" onClick={() => navigate(`/app/tables/${t.tableUuid}`)} />
                  </>
                ) : (
                  <>
                    <Action icon={Eye} label="View order" primary onClick={() => navigate(`/app/tables/${t.tableUuid}`)} />
                    <Action icon={Plus} label="Add items" onClick={() => navigate(`/app/tables/${t.tableUuid}/add-items`)} />
                    {hasManagerAccess && <Action icon={UserCheck} label="Assign waiter" onClick={() => handleOpenAssignWaiter(t)} />}
                    <Action icon={Activity} label="Status" onClick={() => openStatusModal(t)} />
                  </>
                )}
              </div>

              {hasManagerAccess && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink-line">
                  <Action icon={Edit} label="Edit" onClick={() => openEditModal(t)} />
                  <Action icon={Power} label={t.isActive === false ? 'Enable' : 'Disable'} onClick={() => handleToggleTableActive(t)} />
                  <Action icon={Trash2} label="Delete" danger onClick={() => handleDeleteTable(t.tableUuid)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Pressure-band metrics (backend live-summary, with client-side fallback) ──
  const occupiedTables = displayTables.filter((t) => t.status === 'OCCUPIED');
  const coversSeated = liveSummary?.coversSeated ??
    occupiedTables.reduce((a, t) => a + (t.currentPax || 0), 0);
  const tablesTurning = liveSummary?.tablesTurning ??
    displayTables.filter((t) => t.status === 'BILLED').length;
  const avgDwellMin = Math.round(Number(
    liveSummary?.avgDwellMinutes ?? (() => {
      const seated = occupiedTables.filter((t) => t.seatedAt);
      if (!seated.length) return 0;
      return seated.reduce((a, t) => a + Math.floor((currentTime - new Date(t.seatedAt)) / 60000), 0) / seated.length;
    })()
  ) || 0);
  const fmtMinutes = (m) => {
    if (!m || m < 1) return '0m';
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
  };
  const kotsLate = liveSummary?.kotsLate;

  // Use the spatial map only when every active table has a unique, non-zero
  // position; otherwise fall back to a flowing grid so cards never overlap.
  const uniquePositions = new Set(displayTables.map((t) => `${t.posX || 0},${t.posY || 0}`));
  const hasLayout = displayTables.length > 0
    && displayTables.every((t) => (t.posX || 0) !== 0 || (t.posY || 0) !== 0)
    && uniquePositions.size === displayTables.length;

  return (
    <DarkScreen className="flex flex-col">
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6 p-4 sm:p-6">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 sm:mb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl sm:text-[23px] tracking-[-0.01em] text-white">Live Floor</h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-xs sm:text-sm text-txt-mutedDark">Real-time seating & service</p>
                <LivePill dark />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented dark value={floorView} onChange={setFloorView}
                options={[{ value: 'map', label: 'Map' }, { value: 'list', label: 'List' }]} />
              {hasManagerAccess && (
                <>
                  <button onClick={handleViewAnalytics} disabled={loading}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-input bg-ink-card text-txt-mutedDark hover:text-white text-sm font-medium">
                    <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Analytics</span>
                  </button>
                  <button onClick={() => setShowMergeModal(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-input bg-ink-card text-txt-mutedDark hover:text-white text-sm font-medium">
                    <Shuffle className="h-4 w-4" /><span className="hidden sm:inline">Merge</span>
                  </button>
                  <button onClick={() => setShowTransferModal(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-input bg-ink-card text-txt-mutedDark hover:text-white text-sm font-medium">
                    <ArrowRightLeft className="h-4 w-4" /><span className="hidden sm:inline">Transfer</span>
                  </button>
                  <button onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-input bg-marigold text-ink text-sm font-semibold hover:brightness-105">
                    <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Table</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pressure band */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Covers Seated', value: coversSeated },
              { label: 'Tables Turning', value: tablesTurning },
              { label: 'Avg Dwell', value: fmtMinutes(avgDwellMin) },
              { label: 'KOTs Late', value: kotsLate ?? '—', danger: true },
            ].map((tile) => (
              <div key={tile.label}
                className={cn('rounded-tile border p-3', tile.danger && Number(kotsLate) > 0
                  ? 'bg-danger/[0.14] border-danger/30' : 'bg-ink-card border-ink-line')}>
                <p className="eyebrow text-[10px] text-txt-faintDark">{tile.label}</p>
                <p className={cn('font-display font-bold text-2xl mt-1', tile.danger && Number(kotsLate) > 0 ? 'text-danger' : 'text-white')}>{tile.value}</p>
              </div>
            ))}
          </div>

          {/* Section tabs */}
          <div className="flex overflow-x-auto scrollbar-hide gap-1 bg-ink-card p-1 rounded-input">
            {sections.map((section) => (
              <button key={section} onClick={() => dispatch(setSectionFilter(section))}
                className={cn('px-3 sm:px-4 py-1.5 rounded-[8px] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                  filters.section === section ? 'bg-marigold text-ink' : 'text-txt-mutedDark hover:text-white')}>
                {section}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/15 border border-danger/30 rounded-input flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{error}</p>
            <button onClick={() => dispatch(clearError())} className="ml-auto">
              <X className="h-4 w-4 text-danger" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="h-8 w-8 animate-spin text-txt-faintDark" />
            </div>
          ) : displayTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-txt-faintDark">
              <Users className="h-14 w-14 mb-3 opacity-60" />
              <p className="text-base font-medium">No tables found</p>
              <p className="text-sm">Create your first table to get started</p>
            </div>
          ) : (
            <>
              {/* Spatial map (lg + Map view) */}
              <div className={cn(floorView === 'list' ? 'hidden' : 'hidden lg:block')}>
                <div className="relative floor-stripes bg-ink-panel rounded-card border border-ink-line p-4 min-h-[560px] overflow-auto">
                  {hasLayout ? (
                    <div className="relative" style={{ minHeight: 540 }}>
                      {displayTables.map((t) => renderFloorCard(t, true))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {displayTables.map((t) => renderFloorCard(t, false))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grouped list (List view / all mobile) */}
              <div className={cn(floorView === 'list' ? 'block' : 'block lg:hidden', 'space-y-5 pb-4')}>
                {STATUS_GROUPS.map((group) => {
                  const rows = displayTables.filter((t) => t.status === group.key);
                  if (!rows.length) return null;
                  return (
                    <section key={group.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="eyebrow text-[11px] text-txt-mutedDark">{group.label}</h3>
                        <span className="text-[11px] font-mono text-txt-faintDark">{rows.length}</span>
                      </div>
                      <div className="space-y-2">
                        {rows.map((table) => {
                          const busy = table.status === 'OCCUPIED' || table.status === 'BILLED';
                          const selected = floorSelected?.tableUuid === table.tableUuid;
                          const mine = isWaiter && table.currentWaiterUuid === currentUserUuid;
                          return (
                            <button key={table.tableUuid} type="button" onClick={() => setFloorSelected(table)}
                              className={cn('w-full flex items-center gap-3 p-3 rounded-tile bg-ink-card border text-left',
                                selected ? 'border-marigold' : mine ? 'border-marigold/60' : 'border-ink-line hover:border-ink-line/80')}>
                              <span className={cn('h-10 w-10 rounded-full grid place-items-center font-display font-bold shrink-0',
                                FLOOR_CARD[table.status] || FLOOR_CARD.VACANT)}>
                                {String(table.tableNumber).slice(-2)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                                  {mine && <Star className="h-3.5 w-3.5 fill-marigold text-marigold shrink-0" />}
                                  {table.sectionName || 'Floor'} · {table.currentPax || 0}/{table.capacity}
                                </p>
                                <p className="text-[11px] text-txt-mutedDark truncate">
                                  {busy && table.currentWaiterName ? table.currentWaiterName : table.status}
                                  {busy && table.seatedAt ? ` · ${calculateOccupiedTime(table.seatedAt)}` : ''}
                                </p>
                              </div>
                              {busy && table.currentOrderTotal != null && (
                                <span className="font-mono text-sm font-bold text-marigold shrink-0">{formatINR(table.currentOrderTotal)}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination Controls for Manager/Owner/Admin */}
        {hasManagerAccess && pagination.totalPages > 1 && (
          <div className="mt-4 pt-3 border-t border-ink-line">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
              <div className="text-xs text-txt-mutedDark">
                Showing {pagination.page * pagination.size + 1}–
                {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="h-8 px-3 text-sm rounded-input bg-ink-card text-txt-mutedDark hover:text-white disabled:opacity-40"
                  onClick={() => dispatch(getAllTables({ page: pagination.page - 1, size: pagination.size, status: filters.status, restaurantUuid: activeRestaurantId }))}
                  disabled={pagination.page === 0 || loading}
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = pagination.page < 3 ? i :
                      pagination.page >= pagination.totalPages - 3 ? pagination.totalPages - 5 + i : pagination.page - 2 + i;
                    return (
                      <button key={pageNum}
                        onClick={() => dispatch(getAllTables({ page: pageNum, size: pagination.size, status: filters.status, restaurantUuid: activeRestaurantId }))}
                        disabled={loading}
                        className={cn('min-w-[2rem] h-8 px-2 text-sm rounded-input',
                          pagination.page === pageNum ? 'bg-marigold text-ink font-semibold' : 'bg-ink-card text-txt-mutedDark hover:text-white')}>
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="h-8 px-3 text-sm rounded-input bg-ink-card text-txt-mutedDark hover:text-white disabled:opacity-40"
                  onClick={() => dispatch(getAllTables({ page: pagination.page + 1, size: pagination.size, status: filters.status, restaurantUuid: activeRestaurantId }))}
                  disabled={pagination.page >= pagination.totalPages - 1 || loading}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel (desktop) */}
      <aside className="hidden lg:flex w-[340px] shrink-0 flex-col bg-ink-panel rounded-card border border-ink-line overflow-hidden">
        {renderDetail()}
      </aside>

      {/* Detail panel (mobile bottom sheet) — wrapper is hidden on lg so its
          full-screen backdrop never overlays/intercepts the desktop panel. */}
      <div className="lg:hidden">
        <Sheet open={!!floorSelected} onClose={() => setFloorSelected(null)} side="bottom" className="bg-ink-panel">
          <div className="max-h-[80vh] overflow-auto text-txt-light">
            {renderDetail()}
          </div>
        </Sheet>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal || showEditModal} onClose={() => {
        setShowCreateModal(false); setShowEditModal(false); setSelectedTable(null); resetTableForm();
      }} title={showEditModal ? 'Edit Table' : 'Create New Table'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tableNumber" className="block text-sm font-medium text-slate-700 mb-1">Table Number *</label>
              <Input id="tableNumber" name="tableNumber" value={tableForm.tableNumber} onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                placeholder="T12" required />
            </div>
            <div>
              <label htmlFor="sectionName" className="block text-sm font-medium text-slate-700 mb-1">Section Name *</label>
              <Input id="sectionName" name="sectionName" value={tableForm.sectionName} onChange={(e) => setTableForm({ ...tableForm, sectionName: e.target.value })}
                placeholder="AC Hall" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 mb-1">Capacity *</label>
              <Input id="capacity" name="capacity" type="number" value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })}
                min="1" required />
            </div>
            <div>
              <label htmlFor="minCapacity" className="block text-sm font-medium text-slate-700 mb-1">Min Capacity *</label>
              <Input id="minCapacity" name="minCapacity" type="number" value={tableForm.minCapacity} onChange={(e) => setTableForm({ ...tableForm, minCapacity: parseInt(e.target.value) })}
                min="1" required />
            </div>
          </div>
          {/* <div>
            <label htmlFor="shape" className="block text-sm font-medium text-slate-700 mb-1">Shape *</label>
            <select id="shape" name="shape" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tableForm.shape} onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}>
              {TABLE_SHAPES.map(shape => (<option key={shape} value={shape}>{shape}</option>))}
            </select>
          </div> */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="posX" className="block text-sm font-medium text-slate-700 mb-1">Position X</label>
              <Input id="posX" name="posX" type="number" value={tableForm.posX} onChange={(e) => setTableForm({ ...tableForm, posX: parseInt(e.target.value) })} />
            </div>
            <div>
              <label htmlFor="posY" className="block text-sm font-medium text-slate-700 mb-1">Position Y</label>
              <Input id="posY" name="posY" type="number" value={tableForm.posY} onChange={(e) => setTableForm({ ...tableForm, posY: parseInt(e.target.value) })} />
            </div>
          </div> */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={tableForm.isActive}
              onChange={(e) => setTableForm({ ...tableForm, isActive: e.target.checked })} className="rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedTable(null); resetTableForm(); }}>Cancel</Button>
            <Button onClick={showEditModal ? handleUpdateTable : handleCreateTable} disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <>{showEditModal ? 'Update' : 'Create'} Table</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => { setShowStatusModal(false); setSelectedTable(null); resetStatusForm(); }}
        title={`Update Status - ${statusForm.tableNumber || 'Table'}`}>
        <div className="space-y-4">
          {selectedTable && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Current Status:</span> {selectedTable.status}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Valid transitions: {validStatuses.length > 0 ? validStatuses.join(', ') : 'None available'}
              </p>
            </div>
          )}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              New Status * {validStatuses.length === 0 && <span className="text-red-600 text-xs">(No valid transitions available)</span>}
            </label>
            <select 
              id="status" 
              name="status" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={statusForm.status} 
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              disabled={validStatuses.length === 0}
            >
              {validStatuses.length === 0 ? (
                <option value={selectedTable?.status}>{selectedTable?.status} (No changes allowed)</option>
              ) : (
                validStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))
              )}
            </select>
          </div>
          {(statusForm.status === 'OCCUPIED' || statusForm.status === 'BILLED') && (
            <>
              <div>
                <label htmlFor="currentPax" className="block text-sm font-medium text-slate-700 mb-1">Current Guests</label>
                <Input id="currentPax" name="currentPax" type="number" value={statusForm.currentPax}
                  onChange={(e) => setStatusForm({ ...statusForm, currentPax: parseInt(e.target.value) || 0 })} min="0" />
              </div>
              <div>
                <label htmlFor="currentOrderId" className="block text-sm font-medium text-slate-700 mb-1">Order ID (Optional)</label>
                <Input id="currentOrderId" name="currentOrderId" value={statusForm.currentOrderId}
                  onChange={(e) => setStatusForm({ ...statusForm, currentOrderId: e.target.value })}
                  placeholder="550e8400-e29b-41d4-a716-446655440000" />
              </div>
              <div>
                <label htmlFor="waiterUuid" className="block text-sm font-medium text-slate-700 mb-1">Assign Waiter (Optional)</label>
                <select
                  id="waiterUuid"
                  name="waiterUuid"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusForm.waiterUuid}
                  onChange={(e) => setStatusForm({ ...statusForm, waiterUuid: e.target.value })}
                >
                  <option value="">-- No Waiter --</option>
                  {waiterList.map(w => (
                    <option key={w.userUuid || w.id} value={w.userUuid || w.id}>
                      {w.fullName || w.username} {w.role ? `(${w.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowStatusModal(false); setSelectedTable(null); resetStatusForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={actionLoading || validStatuses.length === 0}
            >
              {actionLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />Update Status</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Merge Tables Modal */}
      <Modal isOpen={showMergeModal} onClose={() => { setShowMergeModal(false); resetMergeForm(); }} title="Merge Tables">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Combine multiple tables for a large party.</p>
          <div>
            <label htmlFor="parentTableUuid" className="block text-sm font-medium text-slate-700 mb-1">Parent Table *</label>
            <select id="parentTableUuid" name="parentTableUuid" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mergeForm.parentTableUuid} onChange={(e) => setMergeForm({ ...mergeForm, parentTableUuid: e.target.value })}>
              <option value="">Select Parent Table</option>
              {tables.filter(t => t.status === 'VACANT').map(table => (
                <option key={table.tableUuid} value={table.tableUuid}>{table.tableNumber} - {table.sectionName} ({table.capacity} seats)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Child Tables *</label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-300 rounded-lg p-2">
              {tables.filter(t => t.status === 'VACANT' && t.tableUuid !== mergeForm.parentTableUuid).map(table => (
                <label key={table.tableUuid} htmlFor={`child-table-${table.tableUuid}`} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input id={`child-table-${table.tableUuid}`} name={`child-table-${table.tableUuid}`} type="checkbox" checked={mergeForm.childTableUuids.includes(table.tableUuid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMergeForm({ ...mergeForm, childTableUuids: [...mergeForm.childTableUuids, table.tableUuid] });
                      } else {
                        setMergeForm({ ...mergeForm, childTableUuids: mergeForm.childTableUuids.filter(id => id !== table.tableUuid) });
                      }
                    }}
                    className="rounded" />
                  <span className="text-sm">{table.tableNumber} - {table.sectionName} ({table.capacity} seats)</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowMergeModal(false); resetMergeForm(); }}>Cancel</Button>
            <Button onClick={handleMergeTables} disabled={actionLoading || !mergeForm.parentTableUuid || mergeForm.childTableUuids.length === 0}>
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Merging...</> : <><Shuffle className="h-4 w-4 mr-2" />Merge Tables</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Table Modal */}
      <Modal isOpen={showTransferModal} onClose={() => { setShowTransferModal(false); resetTransferForm(); }} title="Transfer Order">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Move guests and their order from one table to another.</p>
          <div>
            <label htmlFor="fromTableUuid" className="block text-sm font-medium text-slate-700 mb-1">From Table *</label>
            <select id="fromTableUuid" name="fromTableUuid" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transferForm.fromTableUuid} onChange={(e) => setTransferForm({ ...transferForm, fromTableUuid: e.target.value })}>
              <option value="">Select Source Table</option>
              {tables.filter(t => t.status === 'OCCUPIED').map(table => (
                <option key={table.tableUuid} value={table.tableUuid}>{table.tableNumber} - {table.sectionName} ({table.currentPax} guests)</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="toTableUuid" className="block text-sm font-medium text-slate-700 mb-1">To Table *</label>
            <select id="toTableUuid" name="toTableUuid" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transferForm.toTableUuid} onChange={(e) => setTransferForm({ ...transferForm, toTableUuid: e.target.value })}>
              <option value="">Select Destination Table</option>
              {tables.filter(t => t.status === 'VACANT' && t.tableUuid !== transferForm.fromTableUuid).map(table => (
                <option key={table.tableUuid} value={table.tableUuid}>{table.tableNumber} - {table.sectionName} ({table.capacity} seats)</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowTransferModal(false); resetTransferForm(); }}>Cancel</Button>
            <Button onClick={handleTransferTable} disabled={actionLoading || !transferForm.fromTableUuid || !transferForm.toTableUuid}>
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Transferring...</> : <><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer Order</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} title="Table Analytics">
        <div className="space-y-4">
          {analytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-slate-500">Avg Turn Time</p>
                <p className="text-2xl font-bold text-slate-800">
                  {analytics.averageTurnTimeMinutes ? `${Math.round(analytics.averageTurnTimeMinutes)} min` : 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Occupancy Rate</p>
                <p className="text-2xl font-bold text-slate-800">
                  {analytics.occupancyRate ? `${analytics.occupancyRate.toFixed(1)}%` : 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Most Used Table</p>
                <p className="text-2xl font-bold text-slate-800">{analytics.mostUsedTable || 'N/A'}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Orders Today</p>
                <p className="text-2xl font-bold text-slate-800">{analytics.totalOrdersToday || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Peak Hour</p>
                <p className="text-2xl font-bold text-slate-800">
                  {analytics.peakHour !== null && analytics.peakHour !== undefined 
                    ? `${analytics.peakHour}:00` 
                    : 'N/A'}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-slate-500">Avg Guests/Table</p>
                <p className="text-2xl font-bold text-slate-800">
                  {analytics.averageGuestsPerTable ? analytics.averageGuestsPerTable.toFixed(1) : 'N/A'}
                </p>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Waiter Modal */}
      <Modal isOpen={showAssignWaiterModal} onClose={() => { setShowAssignWaiterModal(false); setAssignWaiterTableUuid(null); }} title="Assign Waiter">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select a waiter to assign to <span className="font-semibold">Table {selectedTable?.tableNumber}</span>.
          </p>
          {waiterListLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading waiters...</span>
            </div>
          ) : waiterList.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No waiters found</p>
              <p className="text-xs mt-1">Add waiters to your restaurant first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {waiterList.map(waiter => {
                const isCurrentWaiter = (waiter.userUuid || waiter.id) === selectedTable?.currentWaiterUuid;
                return (
                  <button
                    key={waiter.userUuid || waiter.id}
                    onClick={() => !isCurrentWaiter && handleAssignWaiter(waiter.userUuid || waiter.id)}
                    disabled={actionLoading || isCurrentWaiter}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      isCurrentWaiter
                        ? 'border-blue-300 bg-blue-50 cursor-default'
                        : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{waiter.fullName || waiter.username}</div>
                        <div className="text-xs text-slate-500">{waiter.role || 'WAITER'}</div>
                      </div>
                    </div>
                    {isCurrentWaiter && (
                      <Badge variant="info" size="sm">Current</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowAssignWaiterModal(false); setAssignWaiterTableUuid(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </DarkScreen>
  );
};

export default TableManagement;
