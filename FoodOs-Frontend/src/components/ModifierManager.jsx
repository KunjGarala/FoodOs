import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import {
  Plus, Edit2, Trash2, Check, X, Loader2, Sparkles,
} from 'lucide-react';
import {
  fetchModifiers,
  createModifier,
  updateModifier,
  deleteModifier,
  toggleModifierStatus,
  clearError,
  clearSuccess,
  clearModifiers,
} from '../store/modifierSlice';

const emptyForm = {
  name: '',
  priceAdd: '',
  isActive: true,
  sortOrder: 0,
};

const ModifierManager = ({ restaurantUuid, modifierGroupUuid }) => {
  const dispatch = useDispatch();
  const { modifiers, loading, actionLoading, error, success } = useSelector(s => s.modifiers);

  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingUuid, setEditingUuid] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Fetch on mount
  useEffect(() => {
    if (restaurantUuid && modifierGroupUuid) {
      dispatch(fetchModifiers({ restaurantUuid, modifierGroupUuid, includeInactive: true }));
    }
    return () => dispatch(clearModifiers());
  }, [dispatch, restaurantUuid, modifierGroupUuid]);

  // Auto-clear messages
  useEffect(() => {
    if (error) { const t = setTimeout(() => dispatch(clearError()), 3000); return () => clearTimeout(t); }
  }, [error, dispatch]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => dispatch(clearSuccess()), 3000); return () => clearTimeout(t); }
  }, [success, dispatch]);

  // ── Handlers ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name || !addForm.priceAdd) return;
    try {
      await dispatch(createModifier({
        restaurantUuid,
        modifierGroupUuid,
        data: {
          name: addForm.name,
          priceAdd: parseFloat(addForm.priceAdd),
          isActive: addForm.isActive,
          sortOrder: addForm.sortOrder ? parseInt(addForm.sortOrder) : 0,
        },
      })).unwrap();
      setAddForm(emptyForm);
      setShowAddRow(false);
    } catch { /* error is in redux */ }
  };

  const startEdit = (m) => {
    setEditingUuid(m.modifierUuid);
    setEditForm({
      name: m.name || '',
      priceAdd: m.priceAdd ?? '',
      isActive: m.isActive !== false,
      sortOrder: m.sortOrder ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingUuid(null);
    setEditForm(emptyForm);
  };

  const handleUpdate = async () => {
    try {
      await dispatch(updateModifier({
        restaurantUuid,
        modifierGroupUuid,
        modifierUuid: editingUuid,
        data: {
          name: editForm.name || undefined,
          priceAdd: editForm.priceAdd !== '' ? parseFloat(editForm.priceAdd) : undefined,
          isActive: editForm.isActive,
          sortOrder: editForm.sortOrder !== '' ? parseInt(editForm.sortOrder) : undefined,
        },
      })).unwrap();
      cancelEdit();
    } catch { /* error is in redux */ }
  };

  const handleDelete = async (modifierUuid) => {
    if (!window.confirm('Delete this modifier?')) return;
    dispatch(deleteModifier({ restaurantUuid, modifierGroupUuid, modifierUuid }));
  };

  const handleToggleStatus = (m) => {
    dispatch(toggleModifierStatus({
      restaurantUuid,
      modifierGroupUuid,
      modifierUuid: m.modifierUuid,
      isActive: !m.isActive,
    }));
  };

  // ── Shared styles ───────────────────────────────────────
  const cellInput = 'flex h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  // ── Render ──────────────────────────────────────────────
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Modifiers
          {modifiers.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({modifiers.length})</span>
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
            <Plus className="h-4 w-4 mr-1" /> Add Modifier
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
          <>
             {/* Mobile View (Cards) */}
             <div className="md:hidden space-y-4">
                {modifiers.length === 0 && !showAddRow && (
                  <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded border border-slate-200">
                    No modifiers yet. Tap "Add Modifier" to create one.
                  </div>
                )}

                {/* Mobile Add Form */}
                {showAddRow && (
                   <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="font-medium text-green-800 mb-2">New Modifier</div>
                      <input className={cellInput} placeholder="Name *" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-xs text-slate-500 block mb-1">Price (₹)</label>
                           <input className={cellInput} type="number" step="0.01" placeholder="0.00 *" value={addForm.priceAdd} onChange={e => setAddForm(p => ({ ...p, priceAdd: e.target.value }))} />
                        </div>
                        <div>
                           <label className="text-xs text-slate-500 block mb-1">Sort Order</label>
                           <input className={cellInput} type="number" value={addForm.sortOrder} onChange={e => setAddForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300 text-green-500 focus:ring-green-400" />
                        Active
                      </label>
                      <div className="flex gap-2 justify-end pt-2">
                         <Button size="sm" variant="ghost" onClick={() => { setShowAddRow(false); setAddForm(emptyForm); }}>
                           Cancel
                         </Button>
                         <Button size="sm" onClick={handleAdd} disabled={actionLoading || !addForm.name || !addForm.priceAdd} className="bg-green-600 hover:bg-green-700 text-white">
                           <Check className="h-4 w-4 mr-1" /> Save
                         </Button>
                      </div>
                   </div>
                )}

                {/* Mobile List Items */}
                {modifiers.map((m) => {
                   const isEditing = editingUuid === m.modifierUuid;

                   if (isEditing) {
                      return (
                        <div key={m.modifierUuid} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                           <div className="font-medium text-blue-800 mb-2">Edit Modifier</div>
                           <input className={cellInput} placeholder="Name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                           <div className="grid grid-cols-2 gap-2">
                              <div>
                                 <label className="text-xs text-slate-500 block mb-1">Price (₹)</label>
                                 <input className={cellInput} type="number" step="0.01" value={editForm.priceAdd} onChange={e => setEditForm(p => ({ ...p, priceAdd: e.target.value }))} />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-500 block mb-1">Sort Order</label>
                                 <input className={cellInput} type="number" value={editForm.sortOrder} onChange={e => setEditForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                              </div>
                           </div>
                           <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300 text-green-500 focus:ring-green-400" />
                              Active
                           </label>
                           <div className="flex gap-2 justify-end pt-2">
                             <Button size="sm" variant="ghost" onClick={cancelEdit}>
                               Cancel
                             </Button>
                             <Button size="sm" onClick={handleUpdate} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                               <Check className="h-4 w-4 mr-1" /> Update
                             </Button>
                           </div>
                        </div>
                      );
                   }

                   return (
                      <div key={m.modifierUuid} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
                         <div>
                            <div className="font-semibold text-slate-800">{m.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                               <span className="font-medium text-slate-700">₹{m.priceAdd}</span>
                               <span className="text-slate-300">|</span>
                               <span>Order: {m.sortOrder ?? 0}</span>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <button type="button" onClick={() => handleToggleStatus(m)} disabled={actionLoading}>
                               <Badge variant={m.isActive ? 'success' : 'danger'}>
                                  {m.isActive ? 'Active' : 'Inactive'}
                               </Badge>
                            </button>
                            <div className="flex gap-1">
                               <button type="button" onClick={() => startEdit(m)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                                  <Edit2 className="h-4 w-4" />
                               </button>
                               <button type="button" onClick={() => handleDelete(m.modifierUuid)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                               </button>
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-white rounded border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right">Price (₹)</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Order</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modifiers.length === 0 && !showAddRow && (
                    <tr>
                      <td colSpan="5" className="px-3 py-6 text-center text-slate-400 italic">
                        No modifiers yet. Click "Add Modifier" to create one.
                      </td>
                    </tr>
                  )}

                  {modifiers.map((m) => {
                    const isEditing = editingUuid === m.modifierUuid;

                    if (isEditing) {
                      return (
                        <tr key={m.modifierUuid} className="bg-blue-50/40">
                          <td className="px-3 py-2">
                            <input className={cellInput} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={cellInput + ' text-right'} type="number" step="0.01" value={editForm.priceAdd} onChange={e => setEditForm(p => ({ ...p, priceAdd: e.target.value }))} />
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
                      <tr key={m.modifierUuid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-800">{m.name}</td>
                        <td className="px-3 py-2 text-right font-semibold">₹{m.priceAdd}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => handleToggleStatus(m)} disabled={actionLoading}>
                            <Badge variant={m.isActive ? 'success' : 'danger'}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400">{m.sortOrder ?? 0}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <button type="button" onClick={() => startEdit(m)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDelete(m.modifierUuid)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors">
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
                        <input className={cellInput + ' text-right'} type="number" step="0.01" placeholder="0.00 *" value={addForm.priceAdd} onChange={e => setAddForm(p => ({ ...p, priceAdd: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2">
                        <input className={cellInput + ' text-center w-16 mx-auto'} type="number" value={addForm.sortOrder} onChange={e => setAddForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button type="button" onClick={handleAdd} disabled={actionLoading || !addForm.name || !addForm.priceAdd} className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-40">
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ModifierManager;
