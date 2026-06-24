import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal } from '../../components/ui/Modal';
import {
  PageHeader,
  Panel,
  Segmented,
  Toggle,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  IdCard,
  KeyRound,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

const INPUT_CLS =
  'w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_CLS = 'eyebrow text-[11px] text-txt-faint block mb-1.5';

// Default permission presets per role (presentation only — NOT part of the
// create-employee payload). Mirrors the frame-15 per-member toggles.
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
  CHEF: { pos: false, refunds: false, menu: true, reports: false, staff: false },
  WAITER: { pos: true, refunds: false, menu: false, reports: false, staff: false },
};

const AddEmployee = ({ isOpen, onClose, onSuccess }) => {
  const { activeRestaurantId, role: userRole } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    restaurantId: activeRestaurantId,
    employeeCode: '',
    pin: '',
    role: 'WAITER',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Presentational per-member permission toggles (local only, not submitted).
  const [permissions, setPermissions] = useState(ROLE_PERMISSIONS.WAITER);

  // Update restaurantId when activeRestaurantId changes
  useEffect(() => {
    if (activeRestaurantId && activeRestaurantId !== formData.restaurantId) {
      setFormData((prev) => ({
        ...prev,
        restaurantId: activeRestaurantId,
      }));
    }
  }, [activeRestaurantId]);

  const roles = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'CHEF', label: 'Chef' },
    { value: 'WAITER', label: 'Waiter' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Role change also seeds the presentational permission defaults.
  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
    if (ROLE_PERMISSIONS[value]) setPermissions(ROLE_PERMISSIONS[value]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          image: 'Please select a valid image file',
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: 'Image size should be less than 5MB',
        }));
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({
        ...prev,
        image: '',
      }));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must not exceed 50 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Full name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Phone number validation (optional but must be valid if provided)
    if (formData.phoneNumber && !/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be a valid 10-digit Indian mobile number';
    }

    // Employee code validation (optional)
    if (formData.employeeCode && formData.employeeCode.length > 50) {
      newErrors.employeeCode = 'Employee code must not exceed 50 characters';
    }

    // PIN validation (optional but must be valid if provided)
    if (formData.pin) {
      if (!/^\d+$/.test(formData.pin)) {
        newErrors.pin = 'PIN must contain only digits';
      } else if (formData.pin.length < 4 || formData.pin.length > 6) {
        newErrors.pin = 'PIN must be 4 to 6 digits';
      }
    }

    // Restaurant ID validation
    if (!formData.restaurantId) {
      newErrors.restaurantId = 'Restaurant ID is required. Please ensure you have an active restaurant.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();

      // Create the data object as a JSON string (but we'll send it as a Blob to maintain JSON format)
      const dataObject = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber || undefined,
        restaurantId: formData.restaurantId || undefined,
        employeeCode: formData.employeeCode || undefined,
        pin: formData.pin || undefined,
        role: formData.role,
      };

      // Remove undefined values
      Object.keys(dataObject).forEach(
        (key) => dataObject[key] === undefined && delete dataObject[key]
      );

      // Append data as JSON blob
      formDataToSend.append(
        'data',
        new Blob([JSON.stringify(dataObject)], {
          type: 'application/json',
        })
      );

      // Append image if exists
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await api.post('/api/users/create-employee', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(
        response.data.message ||
          'Employee created successfully! An email has been sent to the employee.'
      );

      // Reset form
      setFormData((prev) => ({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        restaurantId: activeRestaurantId || prev.restaurantId || '',
        employeeCode: '',
        pin: '',
        role: '',
      }));
      setImage(null);
      setImagePreview(null);
      setErrors({});

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error creating employee:', error);

      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to create employee. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && onClose) {
      setFormData((prev) => ({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        restaurantId: activeRestaurantId || prev.restaurantId || '',
        employeeCode: '',
        pin: '',
        role: '',
      }));
      setImage(null);
      setImagePreview(null);
      setErrors({});
      setSuccessMessage('');
      onClose();
    }
  };

  // Roles available to the current user (managers can't create managers).
  const availableRoles = roles.filter(
    (r) => !(userRole == 'MANAGER' && r.value === 'MANAGER')
  );

  const initials = (formData.fullName || formData.username || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-input border border-success/30 bg-success/[0.08] px-4 py-3 text-success-deep">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="flex items-start gap-3 rounded-input border border-danger/30 bg-danger/[0.08] px-4 py-3 text-danger-deep">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-medium">{errors.submit}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* ── LEFT: profile form ─────────────────────────────────────── */}
        <Panel className="p-5 sm:p-6 space-y-5">
          <p className="eyebrow text-[11px] text-txt-faint">Profile</p>

          {/* Photo upload */}
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-tile object-cover border border-line-light"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 rounded-full bg-danger p-1 text-white hover:brightness-110"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-tile border border-dashed border-line-input bg-paper-2">
                {initials ? (
                  <span className="font-display text-xl font-bold text-marigold">{initials}</span>
                ) : (
                  <Upload className="h-7 w-7 text-txt-faint" />
                )}
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="inline-flex h-9 items-center rounded-input border border-line-input bg-paper-card px-3 text-sm font-medium text-txt-dark hover:bg-paper-2">
                  {imagePreview ? 'Change photo' : 'Upload photo'}
                </span>
              </label>
              <p className="mt-1.5 text-xs text-txt-faint">PNG or JPG, up to 5MB.</p>
              {errors.image && <p className="mt-1 text-xs text-danger-deep">{errors.image}</p>}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={LABEL_CLS}>Username *</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className={cn(INPUT_CLS, 'pl-9', errors.username && 'border-danger focus:border-danger focus:ring-danger/30')}
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-danger-deep">{errors.username}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className={LABEL_CLS}>Full name *</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                className={cn(INPUT_CLS, 'pl-9', errors.fullName && 'border-danger focus:border-danger focus:ring-danger/30')}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-danger-deep">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className={LABEL_CLS}>Email *</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                  className={cn(INPUT_CLS, 'pl-9', errors.email && 'border-danger focus:border-danger focus:ring-danger/30')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger-deep">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className={LABEL_CLS}>Phone number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={cn(INPUT_CLS, 'pl-9', errors.phoneNumber && 'border-danger focus:border-danger focus:ring-danger/30')}
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-xs text-danger-deep">{errors.phoneNumber}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className={LABEL_CLS}>Password *</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className={cn(INPUT_CLS, 'pl-9', errors.password && 'border-danger focus:border-danger focus:ring-danger/30')}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger-deep">{errors.password}</p>}
            </div>

            {/* PIN */}
            <div>
              <label className={LABEL_CLS}>POS PIN (4-6 digits)</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="text"
                  name="pin"
                  value={formData.pin}
                  onChange={handleChange}
                  placeholder="Enter PIN"
                  maxLength={6}
                  className={cn(INPUT_CLS, 'pl-9 font-mono tracking-widest', errors.pin && 'border-danger focus:border-danger focus:ring-danger/30')}
                />
              </div>
              {errors.pin && <p className="mt-1 text-xs text-danger-deep">{errors.pin}</p>}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className={LABEL_CLS}>Role *</label>
            <Segmented
              options={availableRoles.map((r) => ({ value: r.value, label: r.label }))}
              value={formData.role}
              onChange={handleRoleChange}
              className="flex-wrap"
            />
            {errors.role && <p className="mt-1 text-xs text-danger-deep">{errors.role}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className={LABEL_CLS}>Employee code</label>
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  placeholder="e.g., EMP-002"
                  className={cn(INPUT_CLS, 'pl-9', errors.employeeCode && 'border-danger focus:border-danger focus:ring-danger/30')}
                />
              </div>
              {errors.employeeCode && <p className="mt-1 text-xs text-danger-deep">{errors.employeeCode}</p>}
            </div>

            {/* Restaurant / Outlet */}
            <div>
              <label className={LABEL_CLS}>Outlet</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
                <input
                  type="text"
                  name="restaurantId"
                  value={formData.restaurantId}
                  disabled
                  placeholder="Active restaurant"
                  className={cn(INPUT_CLS, 'pl-9', errors.restaurantId && 'border-danger')}
                />
              </div>
              <p className="mt-1 text-xs text-txt-faint">Member is added to the active outlet.</p>
              {errors.restaurantId && <p className="mt-1 text-xs text-danger-deep">{errors.restaurantId}</p>}
            </div>
          </div>
        </Panel>

        {/* ── RIGHT: ink permissions panel ───────────────────────────── */}
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
                  onChange={(checked) => setPermissions((prev) => ({ ...prev, [perm.key]: checked }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );

  const headerActions = (
    <>
      <BtnGhost type="button" onClick={handleClose} disabled={loading}>
        Cancel
      </BtnGhost>
      <BtnPrimary type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </BtnPrimary>
    </>
  );

  // If used as modal
  if (isOpen !== undefined) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Add member" size="xl">
        <div className="bg-paper -m-4 p-4 sm:p-5">
          {formBody}
          <div className="mt-5 flex justify-end gap-2">
            <BtnGhost type="button" onClick={handleClose} disabled={loading}>
              Cancel
            </BtnGhost>
            <BtnPrimary type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </BtnPrimary>
          </div>
        </div>
      </Modal>
    );
  }

  // If used as standalone page
  return (
    <div className="bg-paper min-h-full -m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
      <div className="max-w-5xl mx-auto pb-12">
        <PageHeader
          eyebrow="Team"
          title="Add member"
          subtitle="Create a new team member account and set their access."
          className="mb-6"
          actions={headerActions}
        />
        {formBody}
      </div>
    </div>
  );
};

export default AddEmployee;
