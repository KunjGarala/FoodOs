// src/pages/Management/EditEmployee.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import {
  Panel,
  Segmented,
  Toggle,
  Pill,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import { User, Mail, Phone, Lock, IdCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { employeeAPI } from '../../services/api';

const INPUT_CLS =
  'w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_CLS = 'eyebrow text-[11px] text-txt-faint block mb-1.5';

// Presentational per-member permission toggles (local only, NOT submitted).
const PERMISSION_DEFS = [
  { key: 'pos', label: 'Take orders (POS)', desc: 'Create and edit live orders' },
  { key: 'refunds', label: 'Issue refunds', desc: 'Void or refund completed bills' },
  { key: 'menu', label: 'Edit menu & pricing', desc: 'Manage items, modifiers, prices' },
  { key: 'reports', label: 'View reports', desc: 'Access sales & analytics' },
  { key: 'staff', label: 'Manage staff', desc: 'Add, edit and remove members' },
];

const ROLE_PERMISSIONS = {
  MANAGER: { pos: true, refunds: true, menu: true, reports: true, staff: true },
  CASHIER: { pos: true, refunds: true, menu: false, reports: false, staff: false },
  WAITER: { pos: true, refunds: false, menu: false, reports: false, staff: false },
  CHEF: { pos: false, refunds: false, menu: true, reports: false, staff: false },
  GUEST: { pos: false, refunds: false, menu: false, reports: false, staff: false },
};

const EditEmployee = ({ isOpen, onClose, employee, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    employeeCode: '',
    role: '',
    pin: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Presentational per-member permission toggles (local only, not submitted).
  const [permissions, setPermissions] = useState(ROLE_PERMISSIONS.CASHIER);

  useEffect(() => {
    if (employee) {
      const nextRole = employee.role || 'CASHIER';
      setFormData({
        fullName: employee.fullName || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        employeeCode: employee.employeeCode || '',
        role: nextRole,
        isActive: employee.isActive ?? true,
        pin: '', // PIN is always empty initially
      });
      setPermissions(ROLE_PERMISSIONS[nextRole] || ROLE_PERMISSIONS.CASHIER);
      setErrors({});
    }
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Role change also seeds the presentational permission defaults.
  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: null }));
    if (ROLE_PERMISSIONS[value]) setPermissions(ROLE_PERMISSIONS[value]);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim() || formData.fullName.length < 2)
      newErrors.fullName = 'Name needs to be at least 2 characters';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email format';
    if (!formData.phoneNumber.match(/^\d{10}$/)) newErrors.phoneNumber = 'Phone number must be 10 digits';
    if (formData.pin && !formData.pin.match(/^\d{4,6}$/)) newErrors.pin = 'PIN must be 4-6 digits';

    // Prevent Role escalation
    if (['ADMIN', 'OWNER'].includes(formData.role)) newErrors.role = 'Cannot assign this role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        employeeCode: formData.employeeCode,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include PIN if user entered something
      if (formData.pin) {
        payload.pin = formData.pin;
      }

      await employeeAPI.update(employee.userId || employee.id, payload); // Adapt to whatever ID field is used
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      // Backend validation errors could be mapped here
      setErrors({ form: err.response?.data?.message || 'Failed to update employee' });
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { value: 'MANAGER', label: 'Store Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'WAITER', label: 'Waiter' },
    { value: 'CHEF', label: 'Kitchen Staff' },
    { value: 'GUEST', label: 'Guest / Limited' },
  ];

  const initials = (formData.fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit member" size="xl" footer={null}>
      <div className="bg-paper -m-4 p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.form && (
            <div className="flex items-start gap-3 rounded-input border border-danger/30 bg-danger/[0.08] px-4 py-3 text-danger-deep">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm font-medium">{errors.form}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            {/* ── LEFT: profile form ───────────────────────────────────── */}
            <Panel className="p-5 sm:p-6 space-y-5">
              <p className="eyebrow text-[11px] text-txt-faint">Profile</p>

              {/* Identity header */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-tile border border-line-light bg-paper-2">
                  {initials ? (
                    <span className="font-display text-lg font-bold text-marigold">{initials}</span>
                  ) : (
                    <User className="h-6 w-6 text-txt-faint" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-ink-text truncate">
                    {formData.fullName || 'Member'}
                  </p>
                  <div className="mt-1">
                    <Pill tone={formData.isActive ? 'success' : 'danger'}>
                      {formData.isActive ? 'Active' : 'Disabled'}
                    </Pill>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className={LABEL_CLS}>Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className={cn(INPUT_CLS, 'pl-9', errors.fullName && 'border-danger focus:border-danger focus:ring-danger/30')}
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-danger-deep">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className={cn(INPUT_CLS, 'pl-9', errors.email && 'border-danger focus:border-danger focus:ring-danger/30')}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-danger-deep">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className={LABEL_CLS}>Phone number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="9876543210"
                      required
                      className={cn(INPUT_CLS, 'pl-9', errors.phoneNumber && 'border-danger focus:border-danger focus:ring-danger/30')}
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-1 text-xs text-danger-deep">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PIN */}
                <div>
                  <label className={LABEL_CLS}>
                    POS PIN <span className="font-normal normal-case text-txt-faint">(optional)</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                    <input
                      name="pin"
                      type="password"
                      value={formData.pin}
                      onChange={handleChange}
                      placeholder="Leave blank to keep existing"
                      maxLength={6}
                      className={cn(INPUT_CLS, 'pl-9 font-mono tracking-widest', errors.pin && 'border-danger focus:border-danger focus:ring-danger/30')}
                    />
                  </div>
                  {errors.pin && <p className="mt-1 text-xs text-danger-deep">{errors.pin}</p>}
                </div>

                {/* Employee Code */}
                <div>
                  <label className={LABEL_CLS}>Employee code</label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                    <input
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleChange}
                      placeholder="EMP001"
                      className={cn(INPUT_CLS, 'pl-9')}
                    />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className={LABEL_CLS}>Role</label>
                <Segmented
                  options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="flex-wrap"
                />
                {errors.role && <p className="mt-1 text-xs text-danger-deep">{errors.role}</p>}
              </div>

              {/* Active Status */}
              <div className="flex items-start justify-between gap-4 rounded-tile border border-line-light bg-paper-2 p-4">
                <div>
                  <span className="block text-sm font-medium text-ink-text">Account status</span>
                  <span className="block text-xs text-txt-muted mt-0.5">
                    {formData.isActive ? 'Member account is active' : 'Member access is disabled'}
                  </span>
                </div>
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) => {
                    setFormData((prev) => ({ ...prev, isActive: checked }));
                    if (errors.isActive) setErrors((prev) => ({ ...prev, isActive: null }));
                  }}
                />
              </div>
            </Panel>

            {/* ── RIGHT: ink permissions panel ─────────────────────────── */}
            <div className="rounded-card bg-ink text-txt-light p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-marigold" />
                <p className="eyebrow text-[11px] text-txt-mutedDark">Permissions</p>
              </div>
              <p className="mt-2 text-sm text-txt-mutedDark">
                Defaults from the selected role. Fine-tune access for this member.
              </p>

              <div className="mt-5 space-y-1">
                {PERMISSION_DEFS.map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-3 rounded-tile border border-ink-line bg-ink-card px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-txt-light">{perm.label}</p>
                      <p className="text-xs text-txt-mutedDark mt-0.5">{perm.desc}</p>
                    </div>
                    <Toggle
                      checked={!!permissions[perm.key]}
                      onChange={(checked) =>
                        setPermissions((prev) => ({ ...prev, [perm.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <BtnGhost type="button" onClick={onClose}>
              Cancel
            </BtnGhost>
            <BtnPrimary type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </BtnPrimary>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditEmployee;
