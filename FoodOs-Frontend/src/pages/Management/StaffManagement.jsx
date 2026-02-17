import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  Lock,
  Building2,
  Loader2,
} from 'lucide-react';
import { employeeAPI } from '../../services/api';
import AddEmployee from './AddEmployee';
import EditEmployee from './EditEmployee';

const FILTER_ROLES = [
    { value: 'MANAGER', label: 'Store Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'WAITER', label: 'Captain / Waiter' },
    { value: 'CHEF', label: 'Kitchen Staff' },
    { value: 'GUEST', label: 'Guest / Limited Access' }
];

const StaffManagement = () => {
    const { role: userRole, restaurantIds, activeRestaurantId } = useSelector((state) => state.auth);
    
    // State
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    
    // Filters
    const [selectedRole, setSelectedRole] = useState('CASHIER');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail Modal
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Initial Setup
    useEffect(() => {
        if (userRole === 'MANAGER') {
            // Manager is locked to their active restaurant
            setSelectedRestaurantId(activeRestaurantId);
        } else if (restaurantIds && restaurantIds.length > 0) {
            // Admin/Owner defaults to active or first
            setSelectedRestaurantId(activeRestaurantId || restaurantIds[0]);
        }
    }, [userRole, restaurantIds, activeRestaurantId]);

    // Fetch Data
    const fetchEmployees = useCallback(async () => {
        if (!selectedRestaurantId) return;

        try {
            setLoading(true);
            setError(null);
            
            const params = {
                role: selectedRole,
                restaurantUuid: selectedRestaurantId
            };

            const response = await employeeAPI.getAll(params);
            setEmployees(response.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            setError('Failed to load staff list. Please try again.');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, [selectedRole, selectedRestaurantId]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Handle Search Filter (Client-side usually for small lists, or server?)
    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase();
        return (
            emp.fullName?.toLowerCase().includes(query) ||
            emp.username?.toLowerCase().includes(query) ||
            emp.phoneNumber?.includes(query) ||
            emp.employeeCode?.toLowerCase().includes(query)
        );
    });

    const handleViewProfile = (employee) => {
        setSelectedEmployee(employee);
        setIsDetailModalOpen(true);
    };

    const handleEditProfile = (employee) => {
        setSelectedEmployee(employee);
        setIsEditModalOpen(true);
    };

    const hasManagePermission = ['OWNER', 'MANAGER', 'ADMIN'].includes(userRole);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col space-y-6 pb-6">
            {/* 1️⃣ Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Staff Management</h1>
                    <p className="text-sm text-slate-500">View and manage restaurant employees</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchEmployees}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {hasManagePermission && (
                        <Button onClick={() => setIsAddEmployeeOpen(true)}>
                            <User className="h-4 w-4 mr-2" />
                            Add Staff
                        </Button>
                    )}
                </div>
            </div>

            {/* 2️⃣ Filter Bar */}
            <Card>
                <div className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        {/* Role Selector */}
                        <div className="w-full md:w-48">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Role</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {FILTER_ROLES.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                    <Filter className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                         {/* Restaurant Selector (Admin/Owner) */}
                         {(userRole === 'ADMIN' || userRole === 'OWNER') && (
                            <div className="w-full md:w-64">
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Restaurant</label>
                                <div className="relative">
                                    <select 
                                        className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                        value={selectedRestaurantId}
                                        onChange={(e) => setSelectedRestaurantId(e.target.value)}
                                    >
                                        {restaurantIds && restaurantIds.map(id => (
                                            <option key={id} value={id}>Restaurant {id}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="w-full lg:w-72">
                         <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Search Staff</label>
                         <div className="relative">
                             <input 
                                type="text"
                                placeholder="Name, Code, Phone..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                             />
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-400">
                                 <Search className="h-4 w-4" />
                             </div>
                         </div>
                    </div>
                </div>
            </Card>

            {/* 3️⃣ Staff List Table */}
             <Card>
                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : error ? (
                        <div className="px-4 py-8 text-center text-red-500">{error}</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <div className="bg-slate-50 p-4 rounded-full mb-2"><User className="h-8 w-8 text-slate-300" /></div>
                            <p className="font-medium">No staff found</p>
                            <p className="text-sm">Try changing filters</p>
                        </div>
                    ) : (
                        filteredEmployees.map((emp) => (
                            <div key={emp.uuid || emp.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">{emp.fullName}</p>
                                        <Badge variant="outline" className="mt-1 text-xs">
                                            {FILTER_ROLES.find(r => r.value === emp.role)?.label || emp.role}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleViewProfile(emp)} className="p-1.5 hover:bg-slate-100 rounded" title="View">
                                            <Eye className="h-4 w-4 text-slate-500" />
                                        </button>
                                        {hasManagePermission && (
                                            <button onClick={() => handleEditProfile(emp)} className="p-1.5 hover:bg-slate-100 rounded" title="Edit">
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {emp.phoneNumber || '--'}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                        <Mail className="h-3 w-3" /> {emp.email || '--'}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {emp.employeeCode && (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{emp.employeeCode}</span>
                                    )}
                                    {emp.isLocked ? (
                                        <Badge variant="danger" className="gap-1 text-xs"><Lock className="h-3 w-3"/> Locked</Badge>
                                    ) : emp.isActive ? (
                                        <Badge variant="success" className="gap-1 text-xs"><CheckCircle className="h-3 w-3"/> Active</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1 text-xs"><Ban className="h-3 w-3"/> Inactive</Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Name / Role</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Emp Code</th>
                                <th className="px-6 py-4">Restaurant</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                // Skeleton Loader
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32 mb-2"></div><div className="h-3 bg-slate-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 mb-2"></div><div className="h-3 bg-slate-200 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-slate-50 p-4 rounded-full">
                                                <User className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium">No staff found</p>
                                            <p className="text-sm">Try changing the role filter or search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.uuid || emp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">{emp.fullName}</p>
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    {FILTER_ROLES.find(r => r.value === emp.role)?.label || emp.role}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="h-3 w-3" /> {emp.phoneNumber || '--'}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                    <Mail className="h-3 w-3" /> {emp.email || '--'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {emp.employeeCode ? (
                                                <span className="bg-slate-100 px-2 py-1 rounded">{emp.employeeCode}</span>
                                            ) : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {emp.primaryRestaurant?.name || 'No assigned restaurant'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {emp.isLocked ? (
                                                    <Badge variant="danger" className="gap-1"><Lock className="h-3 w-3"/> Locked</Badge>
                                                ) : emp.isActive ? (
                                                    <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3"/> Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1"><Ban className="h-3 w-3"/> Inactive</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {emp.lastLoginAt ? formatDate(emp.lastLoginAt) : <span className="text-slate-400 italic">Never logged in</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleViewProfile(emp)} title="View Profile">
                                                    <Eye className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                </Button>
                                                {hasManagePermission && (
                                                    <Button size="icon" variant="ghost" onClick={() => handleEditProfile(emp)} title="Edit">
                                                        <Edit className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             </Card>

            {/* 4️⃣ Detail Modal */}
             <Modal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)}
                title="Employee Profile"
                footer={(
                    <div className="flex justify-between w-full">
                         <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                         {hasManagePermission && selectedEmployee && (
                            <Button variant={selectedEmployee.isActive ? 'danger' : 'success'}>
                                {selectedEmployee.isActive ? 'Disable Account' : 'Enable Account'}
                            </Button>
                         )}
                    </div>
                )}
            >
                {selectedEmployee && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                             <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                 <User className="h-8 w-8" />
                             </div>
                             <div>
                                 <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.fullName}</h3>
                                 <p className="text-slate-500">@{selectedEmployee.username}</p>
                                 <Badge className="mt-2">{selectedEmployee.role}</Badge>
                             </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Employee Code</label>
                                <p className="font-mono font-medium text-slate-800">{selectedEmployee.employeeCode || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Primary Restaurant</label>
                                <p className="font-medium text-slate-800">{selectedEmployee.primaryRestaurant?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                                <p className="font-medium text-slate-800 flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> {selectedEmployee.phoneNumber || 'N/A'}
                                </p>
                            </div>
                             <div className="bg-slate-50 p-3 rounded-lg">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                                <p className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                    <Mail className="h-3 w-3" /> {selectedEmployee.email || 'N/A'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Security */}
                        <div>
                             <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Security Status
                             </h4>
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                 <div className="flex justify-between p-2 border border-slate-100 rounded">
                                     <span>Account Active</span>
                                     {selectedEmployee.isActive ? <CheckCircle className="h-4 w-4 text-green-500"/> : <Ban className="h-4 w-4 text-red-500"/>}
                                 </div>
                                 <div className="flex justify-between p-2 border border-slate-100 rounded">
                                     <span>Account Locked</span>
                                     {selectedEmployee.isLocked ? <Lock className="h-4 w-4 text-red-500"/> : <CheckCircle className="h-4 w-4 text-green-500"/>}
                                 </div>
                                 <div className="flex justify-between p-2 border border-slate-100 rounded">
                                     <span>Has PIN</span>
                                     {selectedEmployee.hasPin ? <CheckCircle className="h-4 w-4 text-blue-500"/> : <span className="text-slate-400">-</span>}
                                 </div>
                             </div>
                        </div>

                        {/* Audit */}
                        <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 space-y-1">
                            <p>Created: {formatDate(selectedEmployee.createdAt)}</p>
                            <p>Last Login IP: {selectedEmployee.lastLoginIp || 'N/A'}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Employee Modal */}
            <AddEmployee 
                isOpen={isAddEmployeeOpen} 
                onClose={() => setIsAddEmployeeOpen(false)}
                onSuccess={() => {
                    fetchEmployees();
                    setIsAddEmployeeOpen(false);
                }}
            />

            {/* Edit Employee Modal */}
            <EditEmployee 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)}
                employee={selectedEmployee}
                onSuccess={() => {
                    fetchEmployees();
                    // Could add toast here
                }}
            />
        </div>
    );
};

export default StaffManagement;