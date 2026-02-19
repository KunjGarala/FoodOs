import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import {
  Plus, Trash2, Save, X, SparklesIcon, AlertCircle,
} from 'lucide-react';
import {
  createModifiersBulk,
  clearError,
  clearSuccess,
} from '../store/modifierSlice';

const emptyModifierRow = {
  id: Date.now(), // Temporary ID for React key
  name: '',
  price: '',
  isActive: true,
  sortOrder: 0,
};

const BulkModifierManager = ({ restaurantUuid, modifierGroupUuid, onComplete }) => {
  const dispatch = useDispatch();
  const { actionLoading, error, success } = useSelector(s => s.modifiers);

  const [modifiers, setModifiers] = useState([{ ...emptyModifierRow }]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add new row
  const handleAddRow = () => {
    setModifiers([...modifiers, { ...emptyModifierRow, id: Date.now() }]);
  };

  // Remove row
  const handleRemoveRow = (id) => {
    if (modifiers.length === 1) return; // Keep at least one row
    setModifiers(modifiers.filter(m => m.id !== id));
    // Clear validation errors for this row
    const newErrors = { ...validationErrors };
    delete newErrors[id];
    setValidationErrors(newErrors);
  };

  // Update field
  const handleFieldChange = (id, field, value) => {
    setModifiers(modifiers.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
    // Clear validation error for this field
    if (validationErrors[id]?.[field]) {
      setValidationErrors({
        ...validationErrors,
        [id]: { ...validationErrors[id], [field]: null },
      });
    }
  };

  // Validate all modifiers
  const validateModifiers = () => {
    const errors = {};
    let isValid = true;

    modifiers.forEach((m) => {
      const rowErrors = {};
      
      if (!m.name || m.name.trim() === '') {
        rowErrors.name = 'Name is required';
        isValid = false;
      }
      
      if (!m.price || m.price === '' || parseFloat(m.price) < 0) {
        rowErrors.price = 'Valid price is required (can be 0)';
        isValid = false;
      }

      if (Object.keys(rowErrors).length > 0) {
        errors[m.id] = rowErrors;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // Submit all modifiers using bulk endpoint
  const handleSubmitAll = async () => {
    if (!validateModifiers()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const modifiersData = modifiers.map(modifier => ({
        name: modifier.name.trim(),
        price: parseFloat(modifier.price),
        isActive: modifier.isActive,
        sortOrder: modifier.sortOrder ? parseInt(modifier.sortOrder) : 0,
      }));

      await dispatch(createModifiersBulk({
        restaurantUuid,
        modifierGroupUuid,
        data: { modifiers: modifiersData },
      })).unwrap();

      // Reset form on success
      setModifiers([{ ...emptyModifierRow, id: Date.now() }]);
      setValidationErrors({});
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to create modifiers in bulk:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel and reset
  const handleCancel = () => {
    setModifiers([{ ...emptyModifierRow, id: Date.now() }]);
    setValidationErrors({});
    if (onComplete) {
      onComplete();
    }
  };

  // Shared input styles
  const inputClass = 'flex h-8 w-full rounded border bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const inputErrorClass = 'border-red-300 focus:ring-red-500';
  const inputNormalClass = 'border-slate-300';

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          Add Multiple Modifiers
          <span className="text-xs font-normal text-slate-400">
            ({modifiers.length} {modifiers.length === 1 ? 'modifier' : 'modifiers'})
          </span>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmitAll}
            disabled={isSubmitting || modifiers.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Saving...' : `Save All (${modifiers.length})`}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Add multiple modifiers at once. Fill in the required fields (Name and Price) for each modifier, then click "Save All".
        </div>

        {/* Error/Success messages */}
        {(error || success) && (
          <div className={`mb-3 p-2 rounded text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {error || success}
          </div>
        )}

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
           {modifiers.map((modifier, index) => (
              <div key={modifier.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative">
                 <div className="absolute top-2 right-2">
                    <button
                       type="button"
                       onClick={() => handleRemoveRow(modifier.id)}
                       disabled={modifiers.length === 1 || isSubmitting}
                       className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                       title="Remove this modifier"
                    >
                       <X className="h-4 w-4" />
                    </button>
                 </div>
                 <h4 className="font-medium text-slate-700 mb-2 text-sm">Modifier #{index + 1}</h4>
                 <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                          className={`${inputClass} ${validationErrors[modifier.id]?.name ? inputErrorClass : inputNormalClass}`}
                          placeholder="e.g., Extra Cheese"
                          value={modifier.name}
                          onChange={e => handleFieldChange(modifier.id, 'name', e.target.value)}
                          disabled={isSubmitting}
                        />
                         {validationErrors[modifier.id]?.name && (
                           <span className="text-xs text-red-500 mt-1 block">{validationErrors[modifier.id].name}</span>
                         )}
                    </div>
                     <div>
                        <label className="text-xs text-slate-500 block mb-1">Price (₹) <span className="text-red-500">*</span></label>
                        <input
                          className={`${inputClass} ${validationErrors[modifier.id]?.price ? inputErrorClass : inputNormalClass}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={modifier.price}
                          onChange={e => handleFieldChange(modifier.id, 'price', e.target.value)}
                          disabled={isSubmitting}
                        />
                        {validationErrors[modifier.id]?.price && (
                           <span className="text-xs text-red-500 mt-1 block">{validationErrors[modifier.id].price}</span>
                         )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                          <label className="text-xs text-slate-500 block mb-1">Sort Order</label>
                           <input
                             className={`${inputClass} text-center ${inputNormalClass}`}
                             type="number"
                             min="0"
                             value={modifier.sortOrder}
                             onChange={e => handleFieldChange(modifier.id, 'sortOrder', e.target.value)}
                             disabled={isSubmitting}
                           />
                       </div>
                       <div className="flex items-end">
                           <label className="flex items-center gap-2 text-sm text-slate-700 h-8">
                             <input
                               type="checkbox"
                               checked={modifier.isActive}
                               onChange={e => handleFieldChange(modifier.id, 'isActive', e.target.checked)}
                               className="rounded border-slate-300 text-green-500 focus:ring-green-400"
                               disabled={isSubmitting}
                             />
                             Active
                           </label>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block bg-white rounded border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-medium">
              <tr>
                <th className="px-3 py-2 text-left w-[250px]">
                  Name <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-right w-[150px]">
                  Price (₹) <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-center w-[100px]">Active</th>
                <th className="px-3 py-2 text-center w-[100px]">Order</th>
                <th className="px-3 py-2 text-center w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modifiers.map((modifier, index) => (
                <tr key={modifier.id} className="hover:bg-slate-50 transition-colors">
                  {/* Name */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} ${validationErrors[modifier.id]?.name ? inputErrorClass : inputNormalClass}`}
                      placeholder="e.g., Extra Cheese, No Onions, Spicy"
                      value={modifier.name}
                      onChange={e => handleFieldChange(modifier.id, 'name', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {validationErrors[modifier.id]?.name && (
                      <span className="text-xs text-red-500 mt-1 block">{validationErrors[modifier.id].name}</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} text-right ${validationErrors[modifier.id]?.price ? inputErrorClass : inputNormalClass}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={modifier.price}
                      onChange={e => handleFieldChange(modifier.id, 'price', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {validationErrors[modifier.id]?.price && (
                      <span className="text-xs text-red-500 mt-1 block">{validationErrors[modifier.id].price}</span>
                    )}
                  </td>

                  {/* Is Active */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={modifier.isActive}
                      onChange={e => handleFieldChange(modifier.id, 'isActive', e.target.checked)}
                      className="rounded border-slate-300 text-green-500 focus:ring-green-400"
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Sort Order */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} text-center ${inputNormalClass}`}
                      type="number"
                      min="0"
                      value={modifier.sortOrder}
                      onChange={e => handleFieldChange(modifier.id, 'sortOrder', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(modifier.id)}
                      disabled={modifiers.length === 1 || isSubmitting}
                      className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remove this modifier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add More Button */}
        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            disabled={isSubmitting}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Another Modifier
          </Button>
        </div>

        {/* Summary */}
        {modifiers.length > 1 && (
          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
            <strong>Summary:</strong> You are about to create {modifiers.length} modifiers for this group.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkModifierManager;
