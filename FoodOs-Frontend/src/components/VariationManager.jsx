import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import {
  Plus, Edit2, Trash2, Check, X, Star, Loader2, Package,
} from 'lucide-react';
import {
  fetchVariations,
  createVariation,
  updateVariation,
  deleteVariation,
  toggleVariationStatus,
  setDefaultVariation,
  clearError,
  clearSuccess,
  clearVariations,
} from '../store/variationSlice';

const emptyForm = {
  name: '',
  shortCode: '',
  price: '',
  costPrice: '',
  sku: '',
  isDefault: false,
  isActive: true,
  sortOrder: 0,
};

const VariationManager = ({ restaurantUuid, productUuid }) => {
  const dispatch = useDispatch();
  const { variations, loading, actionLoading, error, success } = useSelector(s => s.variations);

  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingUuid, setEditingUuid] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Fetch on mount
  useEffect(() => {
    if (restaurantUuid && productUuid) {
      dispatch(fetchVariations({ restaurantUuid, productUuid }));
    }
    return () => dispatch(clearVariations());
  }, [dispatch, restaurantUuid, productUuid]);

  // Auto-clear messages
  useEffect(() => {
    if (error) { const t = setTimeout(() => dispatch(clearError()), 3000); return () => clearTimeout(t); }
  }, [error, dispatch]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => dispatch(clearSuccess()), 3000); return () => clearTimeout(t); }
  }, [success, dispatch]);

  // ── Handlers ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) return;
    try {
      await dispatch(createVariation({
        restaurantUuid,
        productUuid,
        data: {
          name: addForm.name,
          shortCode: addForm.shortCode || undefined,
          price: parseFloat(addForm.price),
          costPrice: addForm.costPrice ? parseFloat(addForm.costPrice) : undefined,
          sku: addForm.sku || undefined,
          isDefault: addForm.isDefault,
          isActive: addForm.isActive,
          sortOrder: addForm.sortOrder ? parseInt(addForm.sortOrder) : 0,
        },
      })).unwrap();
      setAddForm(emptyForm);
      setShowAddRow(false);
    } catch { /* error is in redux */ }
  };

  const startEdit = (v) => {
    setEditingUuid(v.variationUuid);
    setEditForm({
      name: v.name || '',
      shortCode: v.shortCode || '',
      price: v.price ?? '',
      costPrice: v.costPrice ?? '',
      sku: v.sku || '',
      isDefault: v.isDefault || false,
      isActive: v.isActive !== false,
      sortOrder: v.sortOrder ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingUuid(null);
    setEditForm(emptyForm);
  };

  const handleUpdate = async () => {
    try {
      await dispatch(updateVariation({
        restaurantUuid,
        productUuid,
        variationUuid: editingUuid,
        data: {
          name: editForm.name || undefined,
          shortCode: editForm.shortCode || undefined,
          price: editForm.price !== '' ? parseFloat(editForm.price) : undefined,
          costPrice: editForm.costPrice !== '' ? parseFloat(editForm.costPrice) : undefined,
          sku: editForm.sku || undefined,
          isDefault: editForm.isDefault,
          isActive: editForm.isActive,
          sortOrder: editForm.sortOrder !== '' ? parseInt(editForm.sortOrder) : undefined,
        },
      })).unwrap();
      cancelEdit();
    } catch { /* error is in redux */ }
  };

  const handleDelete = async (variationUuid) => {
    if (!window.confirm('Delete this variation?')) return;
    dispatch(deleteVariation({ restaurantUuid, productUuid, variationUuid }));
  };

  const handleToggleStatus = (v) => {
    dispatch(toggleVariationStatus({
      restaurantUuid,
      productUuid,
      variationUuid: v.variationUuid,
      isActive: !v.isActive,
    }));
  };

  const handleSetDefault = (variationUuid) => {
    dispatch(setDefaultVariation({ restaurantUuid, productUuid, variationUuid }));
  };

  // ── Shared styles ───────────────────────────────────────
  const cellInput = 'flex h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  // ── Render ──────────────────────────────────────────────
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-indigo-500" />
          Product Variations
          {variations.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({variations.length})</span>
          )}
        </CardTitle>
        {!showAddRow && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => setShowAddRow(true)}
            disabled={actionLoading}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Variation
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Notification inline */}
        {(error || success) && (
          <div className={`mb-3 p-2 rounded text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {error || success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-medium">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Short Code</th>
                  <th className="px-3 py-2 text-right">Price (₹)</th>
                  <th className="px-3 py-2 text-right">Cost (₹)</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-center">Default</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Order</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variations.length === 0 && !showAddRow && (
                  <tr>
                    <td colSpan="9" className="px-3 py-6 text-center text-slate-400 italic">
                      No variations yet. Click "Add Variation" to create one.
                    </td>
                  </tr>
                )}

                {variations.map((v) => {
                  const isEditing = editingUuid === v.variationUuid;

                  if (isEditing) {
                    return (
                      <tr key={v.variationUuid} className="bg-blue-50/40">
                        <td className="px-3 py-2">
                          <input className={cellInput} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={cellInput} value={editForm.shortCode} onChange={e => setEditForm(p => ({ ...p, shortCode: e.target.value }))} maxLength={10} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={cellInput + ' text-right'} type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={cellInput + ' text-right'} type="number" step="0.01" value={editForm.costPrice} onChange={e => setEditForm(p => ({ ...p, costPrice: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <input className={cellInput} value={editForm.sku} onChange={e => setEditForm(p => ({ ...p, sku: e.target.value }))} maxLength={50} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={editForm.isDefault} onChange={e => setEditForm(p => ({ ...p, isDefault: e.target.checked }))} className="rounded border-slate-300 text-yellow-500 focus:ring-yellow-400" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300 text-green-500 focus:ring-green-400" />
                        </td>
                        <td className="px-3 py-2">
                          <input className={cellInput + ' text-center w-16 mx-auto'} type="number" value={editForm.sortOrder} onChange={e => setEditForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <button type="button" onClick={handleUpdate} disabled={actionLoading} className="p-1 rounded hover:bg-green-100 text-green-600">
                              <Check className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={cancelEdit} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={v.variationUuid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-800">{v.name}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{v.shortCode || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">₹{v.price}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{v.costPrice != null ? `₹${v.costPrice}` : '—'}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{v.sku || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleSetDefault(v.variationUuid)}
                          disabled={actionLoading || v.isDefault}
                          className="p-1 rounded hover:bg-yellow-50 transition-colors disabled:opacity-50"
                          title={v.isDefault ? 'Default variation' : 'Set as default'}
                        >
                          <Star className={`h-4 w-4 ${v.isDefault ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => handleToggleStatus(v)} disabled={actionLoading}>
                          <Badge variant={v.isActive ? 'success' : 'danger'}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400">{v.sortOrder ?? 0}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button type="button" onClick={() => startEdit(v)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(v.variationUuid)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Add row */}
                {showAddRow && (
                  <tr className="bg-green-50/30">
                    <td className="px-3 py-2">
                      <input className={cellInput} placeholder="Name *" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={cellInput} placeholder="Code" value={addForm.shortCode} onChange={e => setAddForm(p => ({ ...p, shortCode: e.target.value }))} maxLength={10} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={cellInput + ' text-right'} type="number" step="0.01" placeholder="0.00 *" value={addForm.price} onChange={e => setAddForm(p => ({ ...p, price: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={cellInput + ' text-right'} type="number" step="0.01" placeholder="0.00" value={addForm.costPrice} onChange={e => setAddForm(p => ({ ...p, costPrice: e.target.value }))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={cellInput} placeholder="SKU" value={addForm.sku} onChange={e => setAddForm(p => ({ ...p, sku: e.target.value }))} maxLength={50} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={addForm.isDefault} onChange={e => setAddForm(p => ({ ...p, isDefault: e.target.checked }))} className="rounded border-slate-300" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300" />
                    </td>
                    <td className="px-3 py-2">
                      <input className={cellInput + ' text-center w-16 mx-auto'} type="number" value={addForm.sortOrder} onChange={e => setAddForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={handleAdd} disabled={actionLoading || !addForm.name || !addForm.price} className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-40">
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => { setShowAddRow(false); setAddForm(emptyForm); }} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationManager;
