import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Users, Clock, Plus, Edit, Trash2, Shuffle, ArrowRightLeft, BarChart3,
  AlertCircle, X, Check, Loader2, Power
} from 'lucide-react';
import {
  getTablesByRestaurant, getAllTables, createTable, updateTable, updateTableStatus, deleteTable,
  mergeTables, transferTable, getTableAnalytics, clearError, setStatusFilter,
  setSectionFilter, selectFilteredTables, selectTablesByStatus, selectTableLoading,
  selectTableActionLoading, selectTableError, selectTableFilters, selectTableAnalytics,
  selectTablePagination, getValidNextStatuses, isValidStatusTransition,
} from '../../store/tableSlice';
import { selectActiveRestaurant, selectRole } from '../../store/authSlice';

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
  const activeRestaurantId = useSelector(selectActiveRestaurant);
  const userRole = useSelector(selectRole);
  const tables = useSelector(selectFilteredTables);
  const tablesByStatus = useSelector(selectTablesByStatus);
  const loading = useSelector(selectTableLoading);
  const actionLoading = useSelector(selectTableActionLoading);
  const error = useSelector(selectTableError);
  const filters = useSelector(selectTableFilters);
  const analytics = useSelector(selectTableAnalytics);
  const pagination = useSelector(selectTablePagination);

  // Determine if user has manager-level access (MANAGER, OWNER, ADMIN)
  const hasManagerAccess = ['MANAGER', 'OWNER', 'ADMIN'].includes(userRole);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

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

  const sections = ['All', ...new Set(tables.map(t => t.sectionName).filter(Boolean))];

  // Update time every minute for real-time occupied time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch tables based on user role
  useEffect(() => {
    if (hasManagerAccess) {
      // MANAGER/OWNER/ADMIN: Fetch all tables with pagination
      dispatch(getAllTables({ 
        page: pagination.page, 
        size: pagination.size, 
        status: filters.status 
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

  const getStatusColor = (status) => {
    const colors = {
      OCCUPIED: 'bg-yellow-100 border-yellow-400 text-yellow-900 hover:bg-yellow-50',
      BILLED: 'bg-green-100 border-green-400 text-green-900 hover:bg-green-50',
      DIRTY: 'bg-red-100 border-red-400 text-red-900 hover:bg-red-50',
      RESERVED: 'bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-50',
    };
    return colors[status] || 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-slate-50';
  };

  const getStatusBadgeVariant = (status) => {
    const variants = { OCCUPIED: 'warning', BILLED: 'success', DIRTY: 'error', RESERVED: 'info' };
    return variants[status] || 'default';
  };

  const getInactiveTableStyle = () => {
    return 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed';
  };

  const handleCreateTable = async () => {
    try {
      await dispatch(createTable({ restaurantUuid: activeRestaurantId, ...tableForm })).unwrap();
      
      // Refresh tables after creation
      if (hasManagerAccess) {
        await dispatch(getAllTables({ 
          page: pagination.page, 
          size: pagination.size, 
          status: filters.status 
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
          status: filters.status 
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
      const { tableUuid, tableNumber, ...statusData } = statusForm;
      
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
          status: filters.status 
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
            status: filters.status 
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
            status: filters.status 
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
          status: filters.status 
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
          status: filters.status 
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
  };

  const resetTableForm = () => setTableForm({
    sectionName: '', tableNumber: '', capacity: 4, minCapacity: 1,
    shape: 'RECTANGLE', posX: 0, posY: 0, isActive: true,
  });

  const resetStatusForm = () => setStatusForm({ status: 'VACANT', currentOrderId: '', waiterUuid: '', currentPax: 0, tableNumber: '', tableUuid: '' });
  const resetMergeForm = () => setMergeForm({ parentTableUuid: '', childTableUuids: [] });
  const resetTransferForm = () => setTransferForm({ fromTableUuid: '', toTableUuid: '' });

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] gap-4 lg:gap-6">
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Floor Plan</h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-500">Manage tables and seating</p>
                {hasManagerAccess && (
                  <Badge variant="info" size="sm">
                    {userRole} View - All Restaurants
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleViewAnalytics} disabled={loading}>
                <BarChart3 className="h-4 w-4 mr-2" />Analytics
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowMergeModal(true)}>
                <Shuffle className="h-4 w-4 mr-2" />Merge
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />Transfer
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Table
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(tablesByStatus).map(([status, count]) => (
              <Badge key={status} variant={filters.status === status.toUpperCase() ? 'default' : 'outline'}
                className="cursor-pointer capitalize" onClick={() => dispatch(setStatusFilter(status === filters.status ? null : status.toUpperCase()))}>
                {status}: {count}
              </Badge>
            ))}
          </div>

          <div className="flex overflow-x-auto bg-white p-1 rounded-lg border border-slate-200">
            {sections.map(section => (
              <button key={section} onClick={() => dispatch(setSectionFilter(section))}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  filters.section === section ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                {section}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => dispatch(clearError())} className="ml-auto">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Users className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">No tables found</p>
              <p className="text-sm">Create your first table to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {tables.map(table => {
                const isInactive = table.isActive === false;
                return (
                <div key={table.tableUuid}
                  className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all group ${
                    isInactive 
                      ? getInactiveTableStyle() 
                      : `cursor-pointer hover:shadow-md ${getStatusColor(table.status)}`
                  }`}
                  onClick={isInactive ? undefined : () => openStatusModal(table)}>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isInactive && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(table); }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm">
                          <Edit className="h-3.5 w-3.5 text-slate-700" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.tableUuid); }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm">
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleTableActive(table); }}
                      className={`p-1.5 backdrop-blur-sm rounded-lg shadow-sm ${
                        isInactive 
                          ? 'bg-green-500/90 hover:bg-green-600 text-white' 
                          : 'bg-white/90 hover:bg-white text-slate-700'
                      }`}
                      title={isInactive ? 'Activate table' : 'Deactivate table'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    {isInactive ? (
                      <Badge variant="default" size="sm" className="bg-slate-400 text-white">INACTIVE</Badge>
                    ) : (
                      <Badge variant={getStatusBadgeVariant(table.status)} size="sm">{table.status}</Badge>
                    )}
                  </div>
                  
                  <span className={`text-2xl font-bold ${isInactive ? 'line-through' : ''}`}>{table.tableNumber}</span>
                  <div className="flex items-center gap-1 mt-2 text-sm font-medium opacity-80">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity} Seats</span>
                  </div>
                  {table.sectionName && <span className="text-xs opacity-60 mt-1">{table.sectionName}</span>}
                  
                  {isInactive && (
                    <div className="mt-2 text-xs font-medium text-slate-500">
                      Not Available
                    </div>
                  )}
                  
                  {/* Guest count and time info for occupied/billed tables */}
                  {!isInactive && (table.status === 'OCCUPIED' || table.status === 'BILLED') && (
                    <div className="absolute bottom-2 left-0 right-0 px-3 flex flex-col items-center gap-1">
                      {table.currentPax > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg py-1 px-2 text-xs font-semibold shadow-sm">
                          {table.currentPax} Guest{table.currentPax !== 1 ? 's' : ''}
                        </div>
                      )}
                      {/* Show occupied time only for manager/owner/admin with seatedAt field */}
                      {hasManagerAccess && table.seatedAt && table.status === 'OCCUPIED' && (
                        <div className="bg-orange-100 text-orange-800 rounded-lg py-1 px-2 text-xs font-semibold inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {calculateOccupiedTime(table.seatedAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls for Manager/Owner/Admin */}
        {hasManagerAccess && pagination.totalPages > 1 && (
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {pagination.page * pagination.size + 1} to{' '}
                {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of{' '}
                {pagination.totalElements} tables
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(getAllTables({ 
                    page: pagination.page - 1, 
                    size: pagination.size, 
                    status: filters.status 
                  }))}
                  disabled={pagination.page === 0 || loading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = pagination.page < 3 ? i : 
                                   pagination.page >= pagination.totalPages - 3 ? 
                                   pagination.totalPages - 5 + i : 
                                   pagination.page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => dispatch(getAllTables({ 
                          page: pageNum, 
                          size: pagination.size, 
                          status: filters.status 
                        }))}
                        disabled={loading}
                        className={`min-w-[2rem] h-8 px-2 text-sm rounded ${
                          pagination.page === pageNum
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(getAllTables({ 
                    page: pagination.page + 1, 
                    size: pagination.size, 
                    status: filters.status 
                  }))}
                  disabled={pagination.page >= pagination.totalPages - 1 || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Card className="w-80 h-full bg-white hidden lg:flex lg:flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Live Status</h3>
          <Badge variant="success">{tablesByStatus.occupied} Occupied</Badge>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {tables.filter(t => t.status !== 'VACANT').map(table => (
            <div key={table.tableUuid} onClick={() => openStatusModal(table)}
              className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                  {table.tableNumber.length > 2 ? table.tableNumber.slice(-2) : table.tableNumber}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{table.sectionName || 'Main Hall'}</div>
                  <div className="text-xs text-slate-500">{table.currentPax || 0} / {table.capacity} Guests</div>
                  {/* Show occupied time in live status sidebar for manager/owner/admin */}
                  {hasManagerAccess && table.seatedAt && table.status === 'OCCUPIED' && (
                    <div className="text-xs text-orange-600 font-medium mt-0.5">
                      ⏱ {calculateOccupiedTime(table.seatedAt)}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(table.status)} size="sm">{table.status}</Badge>
            </div>
          ))}
          {tables.filter(t => t.status !== 'VACANT').length === 0 && (
            <div className="text-center text-slate-400 py-8">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active tables</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Tables</span>
              <span className="font-semibold text-slate-800">{tables.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Available</span>
              <span className="font-semibold text-green-600">{tablesByStatus.vacant}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Occupied</span>
              <span className="font-semibold text-yellow-600">{tablesByStatus.occupied}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal || showEditModal} onClose={() => {
        setShowCreateModal(false); setShowEditModal(false); setSelectedTable(null); resetTableForm();
      }} title={showEditModal ? 'Edit Table' : 'Create New Table'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label htmlFor="shape" className="block text-sm font-medium text-slate-700 mb-1">Shape *</label>
            <select id="shape" name="shape" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tableForm.shape} onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}>
              {TABLE_SHAPES.map(shape => (<option key={shape} value={shape}>{shape}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="posX" className="block text-sm font-medium text-slate-700 mb-1">Position X</label>
              <Input id="posX" name="posX" type="number" value={tableForm.posX} onChange={(e) => setTableForm({ ...tableForm, posX: parseInt(e.target.value) })} />
            </div>
            <div>
              <label htmlFor="posY" className="block text-sm font-medium text-slate-700 mb-1">Position Y</label>
              <Input id="posY" name="posY" type="number" value={tableForm.posY} onChange={(e) => setTableForm({ ...tableForm, posY: parseInt(e.target.value) })} />
            </div>
          </div>
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
                <label htmlFor="waiterUuid" className="block text-sm font-medium text-slate-700 mb-1">Waiter UUID (Optional)</label>
                <Input id="waiterUuid" name="waiterUuid" value={statusForm.waiterUuid}
                  onChange={(e) => setStatusForm({ ...statusForm, waiterUuid: e.target.value })}
                  placeholder="880e8400-e29b-41d4-a716-446655440000" />
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
          {console.log(analytics)}
          {analytics ? (
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};

export default TableManagement;
