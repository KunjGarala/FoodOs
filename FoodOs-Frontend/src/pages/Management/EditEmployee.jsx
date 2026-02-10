// src/pages/Management/EditEmployee.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { User, Mail, Phone, Shield, Lock, CheckCircle, Ban, IdCard } from 'lucide-react';
import { employeeAPI } from '../../services/api';

const EditEmployee = ({ isOpen, onClose, employee, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '', 
    employeeCode: '',
    role: '',
    pin: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        employeeCode: employee.employeeCode || '',
        role: employee.role || 'CASHIER',
        isActive: employee.isActive ?? true,
        pin: '' // PIN is always empty initially
      });
      setErrors({});
    }
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim() || formData.fullName.length < 2) newErrors.fullName = "Name needs to be at least 2 characters";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Invalid email format";
    if (!formData.phoneNumber.match(/^\d{10}$/)) newErrors.phoneNumber = "Phone number must be 10 digits";
    if (formData.pin && !formData.pin.match(/^\d{4,6}$/)) newErrors.pin = "PIN must be 4-6 digits";
    
    // Prevent Role escalation
    if (['ADMIN', 'OWNER'].includes(formData.role)) newErrors.role = "Cannot assign this role";

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
        isActive: formData.isActive
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
      setErrors({ form: err.response?.data?.message || "Failed to update employee" });
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { value: 'MANAGER', label: 'Store Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'WAITER', label: 'Waiter' },
    { value: 'CHEF', label: 'Kitchen Staff' },
    { value: 'GUEST', label: 'Guest / Limited' }
  ];

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Employee Details"
        footer={null}
    >
        <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                    {errors.form}
                </div>
            )}

            <div className="space-y-4">
                 {/* Full Name */}
                 <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name</label>
                    <div className="relative">
                        <Input 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="pl-10"
                            required
                        />
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    </div>
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Email */}
                     <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                        <div className="relative">
                            <Input 
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className="pl-10"
                                required
                            />
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                     </div>

                     {/* Phone */}
                     <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Phone Number</label>
                        <div className="relative">
                            <Input 
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="9876543210"
                                className="pl-10"
                                required
                            />
                            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                        {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Role */}
                     <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
                        <div className="relative">
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {ROLES.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            <Shield className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                     </div>

                     {/* Employee Code */}
                     <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Employee Code</label>
                        <div className="relative">
                            <Input 
                                name="employeeCode"
                                value={formData.employeeCode}
                                onChange={handleChange}
                                placeholder="EMP001"
                                className="pl-10"
                            />
                            <IdCard className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        </div>
                     </div>
                 </div>

                 {/* PIN */}
                 <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                        PIN <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <Input 
                            name="pin"
                            type="password"
                            value={formData.pin}
                            onChange={handleChange}
                            placeholder="Leave blank to keep existing PIN"
                            className="pl-10"
                            maxLength={6}
                        />
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    </div>
                    {errors.pin && <p className="text-xs text-red-500 mt-1">{errors.pin}</p>}
                 </div>

                 {/* Active Status */}
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                        {formData.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <Ban className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                            <p className="font-medium text-sm text-slate-900">Account Status</p>
                            <p className="text-xs text-slate-500">
                                {formData.isActive ? 'Employee account is active' : 'Employee access is disabled'}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Updating...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    </Modal>
  );
};

export default EditEmployee;
