import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Modal } from '../../components/ui/Modal';
import {
  User,
  Shield,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Lock,
  Loader2,
  Check,
  Minus,
  UserPlus,
} from 'lucide-react';
import { employeeAPI, restaurantAPI } from '../../services/api';
import { PageHeader, Panel, Pill, BtnPrimary, BtnGhost } from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import AddEmployee from './AddEmployee';
import EditEmployee from './EditEmployee';

const FILTER_ROLES = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'MANAGER', label: 'Store Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'WAITER', label: 'Captain / Waiter' },
    { value: 'CHEF', label: 'Kitchen Staff' },
    { value: 'GUEST', label: 'Guest / Limited Access' }
];

// Roles fetched to assemble the full roster (the API is single-role per call).
const ROSTER_ROLES = ['OWNER', 'MANAGER', 'CASHIER', 'WAITER', 'CHEF', 'GUEST'];

/** Pill tone for a role badge. */
const roleTone = (role) => {
    if (role === 'OWNER' || role === 'ADMIN') return 'marigold';
    if (role === 'MANAGER') return 'gold';
    return 'neutral';
};

/** Deterministic avatar accent from a name, drawn from the design palette. */
const AVATAR_COLORS = [
    'bg-marigold/20 text-[#9a6500]',
    'bg-gold/30 text-[#7a5e1d]',
    'bg-success/[0.16] text-success-deep',
    'bg-ink/10 text-ink-text',
];
const avatarStyle = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || '?';

/**
 * Presentational fallback role→permission matrix.
 * The /api/users/roles endpoint is not yet exposed by the slice/api, so the
 * RBAC matrix renders from this common POS permission map until it is wired up.
 */
const MATRIX_ROLES = ['OWNER', 'MANAGER', 'CASHIER', 'WAITER', 'CHEF'];
const MATRIX_PERMS = [
    { key: 'pos', label: 'Take orders (POS)' },
    { key: 'refund', label: 'Refunds & voids' },
    { key: 'menu', label: 'Edit menu & pricing' },
    { key: 'staff', label: 'Manage staff' },
    { key: 'reports', label: 'View reports' },
    { key: 'kitchen', label: 'Kitchen display' },
    { key: 'settings', label: 'Restaurant settings' },
];
const ROLE_PERMS = {
    OWNER:   { pos: true, refund: true, menu: true, staff: true, reports: true, kitchen: true, settings: true },
    MANAGER: { pos: true, refund: true, menu: true, staff: true, reports: true, kitchen: true, settings: false },
    CASHIER: { pos: true, refund: false, menu: false, staff: false, reports: false, kitchen: false, settings: false },
    WAITER:  { pos: true, refund: false, menu: false, staff: false, reports: false, kitchen: true, settings: false },
    CHEF:    { pos: false, refund: false, menu: false, staff: false, reports: false, kitchen: true, settings: false },
};

const StaffManagement = () => {
    const { role: userRole, restaurantIds, activeRestaurantId } = useSelector((state) => state.auth);

    // State
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

    // Filters
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail Modal
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Restaurant Names Map
    const [restaurantNames, setRestaurantNames] = useState({});

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

    // Fetch Restaurant Names
    useEffect(() => {
        const fetchRestaurantNames = async () => {
            if (!restaurantIds || restaurantIds.length === 0) return;
            const names = {};
            await Promise.all(restaurantIds.map(async (id) => {
                try {
                    const response = await restaurantAPI.getRestaurantDetail(id);
                    names[id] = response.data.name;
                } catch {
                    names[id] = `Restaurant ${id}`; // Fallback
                }
            }));
            setRestaurantNames(names);
        };
        fetchRestaurantNames();
    }, [restaurantIds]);

    // Fetch the full roster across every role (the API is single-role per call),
    // then merge + dedupe. The role dropdown filters this list client-side.
    const fetchEmployees = useCallback(async () => {
        if (!selectedRestaurantId) return;

        try {
            setLoading(true);
            setError(null);

            const results = await Promise.all(
                ROSTER_ROLES.map((r) =>
                    employeeAPI
                        .getAll({ role: r, restaurantUuid: selectedRestaurantId })
                        .then((res) => res.data || [])
                        .catch(() => [])
                )
            );

            const seen = new Set();
            const merged = [];
            results.flat().forEach((emp) => {
                const key = emp.uuid || emp.id || emp.username;
                if (key && !seen.has(key)) {
                    seen.add(key);
                    merged.push(emp);
                }
            });
            setEmployees(merged);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            setError('Failed to load staff list. Please try again.');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, [selectedRestaurantId]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Role filter + search, both client-side over the full roster.
    const filteredEmployees = employees.filter(emp => {
        const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query || (
            emp.fullName?.toLowerCase().includes(query) ||
            emp.username?.toLowerCase().includes(query) ||
            emp.phoneNumber?.includes(query) ||
            emp.employeeCode?.toLowerCase().includes(query)
        );
        return matchesRole && matchesSearch;
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

    // On-shift status derived from available data. No attendance feed is exposed,
    // so we fall back to active + a recent last-login as a graceful "On shift" hint.
    const isOnShift = (emp) => {
        if (emp.isLocked || !emp.isActive) return false;
        if (!emp.lastLoginAt) return false;
        const diffHrs = (Date.now() - new Date(emp.lastLoginAt).getTime()) / 36e5;
        return diffHrs <= 12;
    };

    const roleLabel = (role) => FILTER_ROLES.find((r) => r.value === role)?.label || role;

    const inputCls =
        'w-full bg-paper-card border border-line-input text-ink-text rounded-input py-2 px-3 text-sm focus:outline-none focus:border-marigold transition';

    return (
        <div className="space-y-6">
            {/* 1️⃣ Page Header */}
            <PageHeader
                eyebrow="Team & RBAC"
                title="Team"
                subtitle="Roster, shift status and role permissions"
                actions={(
                    <>
                        <BtnGhost onClick={fetchEmployees} disabled={loading}>
                            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                            <span className="hidden sm:inline">Refresh</span>
                        </BtnGhost>
                        {hasManagePermission && (
                            <BtnPrimary onClick={() => setIsAddEmployeeOpen(true)}>
                                <UserPlus className="h-4 w-4" />
                                Add member
                            </BtnPrimary>
                        )}
                    </>
                )}
            />

            {/* 2️⃣ Filter Bar */}
            <Panel className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        {/* Role Selector */}
                        <div className="w-full md:w-48">
                            <label className="eyebrow text-[10px] text-txt-faint mb-1 block">Role</label>
                            <select
                                className={cn(inputCls, 'appearance-none')}
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="ALL">All roles</option>
                                {FILTER_ROLES.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Restaurant Selector (Admin/Owner) */}
                        {(userRole === 'ADMIN' || userRole === 'OWNER') && (
                            <div className="w-full md:w-64">
                                <label className="eyebrow text-[10px] text-txt-faint mb-1 block">Restaurant</label>
                                <select
                                    className={cn(inputCls, 'appearance-none')}
                                    value={selectedRestaurantId}
                                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                                >
                                    {restaurantIds && restaurantIds.map(id => (
                                        <option key={id} value={id}>{restaurantNames[id] || 'Loading...*'}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="w-full lg:w-72">
                        <label className="eyebrow text-[10px] text-txt-faint mb-1 block">Search staff</label>
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Name, code, phone..."
                                className={cn(inputCls, 'pl-9')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Panel>

            {/* 3️⃣ Roster */}
            {loading ? (
                <Panel className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-11 w-11 rounded-full bg-paper-3" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-paper-3 rounded w-40" />
                                <div className="h-3 bg-paper-3 rounded w-24" />
                            </div>
                            <div className="h-6 w-16 bg-paper-3 rounded-full" />
                        </div>
                    ))}
                </Panel>
            ) : error ? (
                <Panel className="p-10 text-center text-danger-deep">{error}</Panel>
            ) : filteredEmployees.length === 0 ? (
                <Panel className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-paper-3 p-4 rounded-full mb-3">
                        <User className="h-8 w-8 text-txt-faint" />
                    </div>
                    <p className="font-display font-semibold text-ink-text">No staff found</p>
                    <p className="text-sm text-txt-muted mt-1">Try changing the role filter or search criteria</p>
                </Panel>
            ) : (
                <Panel className="divide-y divide-line-light">
                    {filteredEmployees.map((emp) => {
                        const onShift = isOnShift(emp);
                        return (
                            <div
                                key={emp.uuid || emp.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 hover:bg-paper-2 transition-colors"
                            >
                                {/* Avatar + identity */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn('h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-display font-bold text-sm', avatarStyle(emp.fullName))}>
                                        {initials(emp.fullName)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-display font-semibold text-ink-text truncate">{emp.fullName}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <Pill tone={roleTone(emp.role)}>{roleLabel(emp.role)}</Pill>
                                            {emp.employeeCode && (
                                                <span className="font-mono text-[11px] text-txt-muted bg-paper-3 px-1.5 py-0.5 rounded">
                                                    {emp.employeeCode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="flex flex-col gap-1 text-sm text-txt-muted sm:w-56 min-w-0">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Phone className="h-3.5 w-3.5 shrink-0" /> {emp.phoneNumber || '--'}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-txt-faint truncate">
                                        <Mail className="h-3.5 w-3.5 shrink-0" /> {emp.email || '--'}
                                    </span>
                                </div>

                                {/* Status + last active */}
                                <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-64">
                                    <div className="flex flex-col items-start sm:items-end gap-1">
                                        {emp.isLocked ? (
                                            <Pill tone="danger"><Lock className="h-3 w-3" /> Locked</Pill>
                                        ) : onShift ? (
                                            <Pill tone="success"><CheckCircle className="h-3 w-3" /> On shift</Pill>
                                        ) : (
                                            <Pill tone="neutral"><Ban className="h-3 w-3" /> Off</Pill>
                                        )}
                                        <span className="text-[11px] text-txt-faint">
                                            {emp.lastLoginAt ? formatDate(emp.lastLoginAt) : 'Never logged in'}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleViewProfile(emp)}
                                            title="View profile"
                                            className="p-2 rounded-input hover:bg-paper-3 text-txt-muted hover:text-ink-text transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {hasManagePermission && (
                                            <button
                                                onClick={() => handleEditProfile(emp)}
                                                title="Edit"
                                                className="p-2 rounded-input hover:bg-paper-3 text-txt-muted hover:text-ink-text transition-colors"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </Panel>
            )}

            {/* 4️⃣ Role–permission matrix (ink card) */}
            <div className="bg-ink text-txt-light rounded-card border border-ink-line p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-marigold" />
                    <h2 className="font-display font-semibold text-txt-light">Role permissions</h2>
                </div>
                <p className="text-xs text-txt-mutedDark mb-4">What each role can do across the POS.</p>

                <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                    <table className="w-full border-collapse text-sm min-w-[640px]">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-ink text-left font-medium text-txt-mutedDark py-2 pr-4 align-bottom">
                                    Permission
                                </th>
                                {MATRIX_ROLES.map((role) => (
                                    <th key={role} className="px-3 py-2 text-center">
                                        <span className="eyebrow text-[10px] text-txt-faintDark">{role}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MATRIX_PERMS.map((perm) => (
                                <tr key={perm.key} className="border-t border-ink-line">
                                    <td className="sticky left-0 z-10 bg-ink py-2.5 pr-4 text-txt-light whitespace-nowrap">
                                        {perm.label}
                                    </td>
                                    {MATRIX_ROLES.map((role) => {
                                        const allowed = ROLE_PERMS[role]?.[perm.key];
                                        return (
                                            <td key={role} className="px-3 py-2.5 text-center">
                                                {allowed ? (
                                                    <Check className="h-4 w-4 text-marigold inline-block" />
                                                ) : (
                                                    <Minus className="h-4 w-4 text-txt-faintDark inline-block" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Employee Profile"
                footer={(
                    <div className="flex justify-between w-full">
                        <BtnGhost onClick={() => setIsDetailModalOpen(false)}>Close</BtnGhost>
                        {hasManagePermission && selectedEmployee && (
                            <BtnPrimary
                                className={selectedEmployee.isActive ? 'bg-danger text-white hover:brightness-105' : 'bg-success text-white hover:brightness-105'}
                            >
                                {selectedEmployee.isActive ? 'Disable Account' : 'Enable Account'}
                            </BtnPrimary>
                        )}
                    </div>
                )}
            >
                {selectedEmployee && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="flex items-start gap-4 pb-4 border-b border-line-light">
                            <div className={cn('h-16 w-16 rounded-full flex items-center justify-center font-display font-bold text-lg', avatarStyle(selectedEmployee.fullName))}>
                                {initials(selectedEmployee.fullName)}
                            </div>
                            <div>
                                <h3 className="font-display text-xl font-bold text-ink-text">{selectedEmployee.fullName}</h3>
                                <p className="text-txt-muted">@{selectedEmployee.username}</p>
                                <Pill tone={roleTone(selectedEmployee.role)} className="mt-2">{selectedEmployee.role}</Pill>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-paper-2 p-3 rounded-tile">
                                <label className="eyebrow text-[10px] text-txt-faint">Employee Code</label>
                                <p className="font-mono font-medium text-ink-text">{selectedEmployee.employeeCode || 'N/A'}</p>
                            </div>
                            <div className="bg-paper-2 p-3 rounded-tile">
                                <label className="eyebrow text-[10px] text-txt-faint">Primary Restaurant</label>
                                <p className="font-medium text-ink-text">{selectedEmployee.primaryRestaurant?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-paper-2 p-3 rounded-tile">
                                <label className="eyebrow text-[10px] text-txt-faint">Phone</label>
                                <p className="font-medium text-ink-text flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> {selectedEmployee.phoneNumber || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-paper-2 p-3 rounded-tile">
                                <label className="eyebrow text-[10px] text-txt-faint">Email</label>
                                <p className="font-medium text-ink-text flex items-center gap-2 truncate">
                                    <Mail className="h-3 w-3" /> {selectedEmployee.email || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Security */}
                        <div>
                            <h4 className="font-display font-semibold text-ink-text mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Security Status
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between p-2 border border-line-light rounded-input text-txt-dark">
                                    <span>Account Active</span>
                                    {selectedEmployee.isActive ? <CheckCircle className="h-4 w-4 text-success" /> : <Ban className="h-4 w-4 text-danger" />}
                                </div>
                                <div className="flex justify-between p-2 border border-line-light rounded-input text-txt-dark">
                                    <span>Account Locked</span>
                                    {selectedEmployee.isLocked ? <Lock className="h-4 w-4 text-danger" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                </div>
                                <div className="flex justify-between p-2 border border-line-light rounded-input text-txt-dark">
                                    <span>Has PIN</span>
                                    {selectedEmployee.hasPin ? <CheckCircle className="h-4 w-4 text-marigold" /> : <span className="text-txt-faint">-</span>}
                                </div>
                            </div>
                        </div>

                        {/* Audit */}
                        <div className="text-xs text-txt-faint pt-2 border-t border-line-light space-y-1">
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
