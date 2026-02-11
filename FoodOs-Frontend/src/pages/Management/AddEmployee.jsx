import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { User, Mail, Lock, Phone, Building2, IdCard, KeyRound, Shield, Upload, X } from 'lucide-react';
import api from '../../services/api';

const AddEmployee = ({ isOpen, onClose, onSuccess }) => {
  const { activeRestaurantId , role: userRole } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    restaurantId: activeRestaurantId,
    employeeCode: '',
    pin: '',
    role: 'WAITER'
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update restaurantId when activeRestaurantId changes
  useEffect(() => {
    if (activeRestaurantId && activeRestaurantId !== formData.restaurantId) {
      setFormData(prev => ({
        ...prev,
        restaurantId: activeRestaurantId
      }));
    }
  }, [activeRestaurantId]);

  const roles = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'CHEF', label: 'Chef' },
    { value: 'WAITER', label: 'Waiter' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        image: ''
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
        restaurantId: formData.restaurantId ||undefined,
        employeeCode: formData.employeeCode || undefined,
        pin: formData.pin || undefined,
        role: formData.role
      };

      // Remove undefined values
      Object.keys(dataObject).forEach(key => 
        dataObject[key] === undefined && delete dataObject[key]
      );

      // Append data as JSON blob
      formDataToSend.append('data', new Blob([JSON.stringify(dataObject)], {
        type: 'application/json'
      }));

      // Append image if exists
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await api.post('/api/users/create-employee', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMessage(response.data.message || 'Employee created successfully! An email has been sent to the employee.');
      
      // Reset form
      setFormData(prev => ({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        restaurantId: activeRestaurantId || prev.restaurantId || '',
        employeeCode: '',
        pin: '',
        role: ''
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
        error.response.data.errors.forEach(err => {
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
      setFormData(prev => ({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        restaurantId: activeRestaurantId || prev.restaurantId || '',
        employeeCode: '',
        pin: '',
        role: ''
      }));
      setImage(null);
      setImagePreview(null);
      setErrors({});
      setSuccessMessage('');
      onClose();
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Profile Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Profile Image (Optional)
        </label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </span>
          </label>
        </div>
        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="employee@example.com"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter full name"
            className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            className={`pl-10 ${errors.phoneNumber ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Role <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`flex h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.role ? 'border-red-500' : ''}`}
          >
            {roles.map(role => {
              if(userRole == 'MANAGER' && role.value === 'MANAGER') {
                return null;
              }
              return (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              );
            })}
          </select>
        </div>
        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
      </div>

      {/* Restaurant ID */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Restaurant ID <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="restaurantId"
            value={formData.restaurantId}
            disabled
            placeholder="Active restaurant"
            className={`pl-10 bg-slate-50 cursor-not-allowed ${errors.restaurantId ? 'border-red-500' : ''}`}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Employee will be added to the active restaurant</p>
        {errors.restaurantId && <p className="text-red-500 text-xs mt-1">{errors.restaurantId}</p>}
      </div>

      {/* Employee Code */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Employee Code
        </label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="employeeCode"
            value={formData.employeeCode}
            onChange={handleChange}
            placeholder="e.g., EMP-002"
            className={`pl-10 ${errors.employeeCode ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.employeeCode && <p className="text-red-500 text-xs mt-1">{errors.employeeCode}</p>}
      </div>

      {/* PIN */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          PIN (4-6 digits)
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Enter PIN"
            maxLength={6}
            className={`pl-10 ${errors.pin ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );

  // If used as modal
  if (isOpen !== undefined) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add New Employee"
      >
        {formContent}
      </Modal>
    );
  }

  // If used as standalone page
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Add New Employee</h1>
        <p className="text-slate-500">Create a new employee account</p>
      </div>
      
      <Card className="max-w-2xl">
        <div className="p-6">
          {formContent}
        </div>
      </Card>
    </div>
  );
};

export default AddEmployee;
