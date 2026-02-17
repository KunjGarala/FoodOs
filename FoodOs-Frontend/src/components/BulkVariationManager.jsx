import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import {
  Plus, Trash2, Save, X, PackagePlus, AlertCircle,
} from 'lucide-react';
import {
  createVariation,
  clearError,
  clearSuccess,
} from '../store/variationSlice';

const emptyVariationRow = {
  id: Date.now(), // Temporary ID for React key
  name: '',
  shortCode: '',
  price: '',
  costPrice: '',
  sku: '',
  isDefault: false,
  isActive: true,
  sortOrder: 0,
};

const BulkVariationManager = ({ restaurantUuid, productUuid, onComplete }) => {
  const dispatch = useDispatch();
  const { actionLoading, error, success } = useSelector(s => s.variations);

  const [variations, setVariations] = useState([{ ...emptyVariationRow }]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add new row
  const handleAddRow = () => {
    setVariations([...variations, { ...emptyVariationRow, id: Date.now() }]);
  };

  // Remove row
  const handleRemoveRow = (id) => {
    if (variations.length === 1) return; // Keep at least one row
    setVariations(variations.filter(v => v.id !== id));
    // Clear validation errors for this row
    const newErrors = { ...validationErrors };
    delete newErrors[id];
    setValidationErrors(newErrors);
  };

  // Update field
  const handleFieldChange = (id, field, value) => {
    setVariations(variations.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
    // Clear validation error for this field
    if (validationErrors[id]?.[field]) {
      setValidationErrors({
        ...validationErrors,
        [id]: { ...validationErrors[id], [field]: null },
      });
    }
  };

  // Validate all variations
  const validateVariations = () => {
    const errors = {};
    let isValid = true;

    variations.forEach((v) => {
      const rowErrors = {};
      
      if (!v.name || v.name.trim() === '') {
        rowErrors.name = 'Name is required';
        isValid = false;
      }
      
      if (!v.price || v.price === '' || parseFloat(v.price) <= 0) {
        rowErrors.price = 'Valid price is required';
        isValid = false;
      }

      if (v.costPrice !== '' && parseFloat(v.costPrice) < 0) {
        rowErrors.costPrice = 'Cost price must be positive';
        isValid = false;
      }

      if (Object.keys(rowErrors).length > 0) {
        errors[v.id] = rowErrors;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // Submit all variations
  const handleSubmitAll = async () => {
    if (!validateVariations()) {
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const variation of variations) {
      try {
        await dispatch(createVariation({
          restaurantUuid,
          productUuid,
          data: {
            name: variation.name.trim(),
            shortCode: variation.shortCode.trim() || undefined,
            price: parseFloat(variation.price),
            costPrice: variation.costPrice ? parseFloat(variation.costPrice) : undefined,
            sku: variation.sku.trim() || undefined,
            isDefault: variation.isDefault,
            isActive: variation.isActive,
            sortOrder: variation.sortOrder ? parseInt(variation.sortOrder) : 0,
          },
        })).unwrap();
        successCount++;
      } catch (err) {
        failCount++;
        console.error('Failed to create variation:', variation.name, err);
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      // Reset form on success
      setVariations([{ ...emptyVariationRow, id: Date.now() }]);
      setValidationErrors({});
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    }

    // Show summary
    if (failCount > 0) {
      alert(`Created ${successCount} variations. ${failCount} failed.`);
    }
  };

  // Cancel and reset
  const handleCancel = () => {
    setVariations([{ ...emptyVariationRow, id: Date.now() }]);
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
          <PackagePlus className="h-5 w-5 text-indigo-500" />
          Add Multiple Variations
          <span className="text-xs font-normal text-slate-400">
            ({variations.length} {variations.length === 1 ? 'variation' : 'variations'})
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
            disabled={isSubmitting || variations.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Saving...' : `Save All (${variations.length})`}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Add multiple variations at once. Fill in the required fields (Name and Price) for each variation, then click "Save All".
        </div>

        {/* Error/Success messages */}
        {(error || success) && (
          <div className={`mb-3 p-2 rounded text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {error || success}
          </div>
        )}

        <div className="bg-white rounded border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-medium">
              <tr>
                <th className="px-3 py-2 text-left w-[180px]">
                  Name <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-left w-[100px]">Short Code</th>
                <th className="px-3 py-2 text-right w-[120px]">
                  Price (₹) <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-2 text-right w-[120px]">Cost (₹)</th>
                <th className="px-3 py-2 text-left w-[120px]">SKU</th>
                <th className="px-3 py-2 text-center w-[80px]">Default</th>
                <th className="px-3 py-2 text-center w-[80px]">Active</th>
                <th className="px-3 py-2 text-center w-[80px]">Order</th>
                <th className="px-3 py-2 text-center w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variations.map((variation, index) => (
                <tr key={variation.id} className="hover:bg-slate-50 transition-colors">
                  {/* Name */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} ${validationErrors[variation.id]?.name ? inputErrorClass : inputNormalClass}`}
                      placeholder="e.g., Small, Medium, Large"
                      value={variation.name}
                      onChange={e => handleFieldChange(variation.id, 'name', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {validationErrors[variation.id]?.name && (
                      <span className="text-xs text-red-500 mt-1">{validationErrors[variation.id].name}</span>
                    )}
                  </td>

                  {/* Short Code */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} ${inputNormalClass}`}
                      placeholder="S, M, L"
                      value={variation.shortCode}
                      onChange={e => handleFieldChange(variation.id, 'shortCode', e.target.value)}
                      maxLength={10}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} text-right ${validationErrors[variation.id]?.price ? inputErrorClass : inputNormalClass}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={variation.price}
                      onChange={e => handleFieldChange(variation.id, 'price', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {validationErrors[variation.id]?.price && (
                      <span className="text-xs text-red-500 mt-1">{validationErrors[variation.id].price}</span>
                    )}
                  </td>

                  {/* Cost Price */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} text-right ${validationErrors[variation.id]?.costPrice ? inputErrorClass : inputNormalClass}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={variation.costPrice}
                      onChange={e => handleFieldChange(variation.id, 'costPrice', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* SKU */}
                  <td className="px-3 py-2">
                    <input
                      className={`${inputClass} ${inputNormalClass}`}
                      placeholder="SKU-001"
                      value={variation.sku}
                      onChange={e => handleFieldChange(variation.id, 'sku', e.target.value)}
                      maxLength={50}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Is Default */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={variation.isDefault}
                      onChange={e => handleFieldChange(variation.id, 'isDefault', e.target.checked)}
                      className="rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Is Active */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={variation.isActive}
                      onChange={e => handleFieldChange(variation.id, 'isActive', e.target.checked)}
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
                      value={variation.sortOrder}
                      onChange={e => handleFieldChange(variation.id, 'sortOrder', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(variation.id)}
                      disabled={variations.length === 1 || isSubmitting}
                      className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remove this variation"
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
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Another Variation
          </Button>
        </div>

        {/* Summary */}
        {variations.length > 1 && (
          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
            <strong>Summary:</strong> You are about to create {variations.length} variations for this product.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkVariationManager;
