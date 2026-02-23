import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import {
  Plus, Edit2, Trash2, Check, X, Loader2, ListOrdered, Settings2,
} from 'lucide-react';
import {
  fetchModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  toggleModifierGroupStatus,
  clearError,
  clearSuccess,
} from '../store/modifierGroupSlice';

const emptyForm = {
  name: '',
  description: '',
  minSelection: 0,
  maxSelection: 1,
  isRequired: false,
  isActive: true,
  sortOrder: 0,
};

const ModifierGroupManager = ({ restaurantUuid, onManageModifiers }) => {
  const dispatch = useDispatch();
  const { modifierGroups, loading, actionLoading, error, success } = useSelector(s => s.modifierGroups);

  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingUuid, setEditingUuid] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Fetch on mount
  useEffect(() => {
    if (restaurantUuid) {
      dispatch(fetchModifierGroups({ restaurantUuid, includeInactive: true }));
    }
  }, [dispatch, restaurantUuid]);

  // Auto-clear messages
  useEffect(() => {
    if (error) { const t = setTimeout(() => dispatch(clearError()), 3000); return () => clearTimeout(t); }
  }, [error, dispatch]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => dispatch(clearSuccess()), 3000); return () => clearTimeout(t); }
  }, [success, dispatch]);

  // ── Handlers ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.name) return;
    try {
      await dispatch(createModifierGroup({
        restaurantUuid,
        data: {
          name: addForm.name,
          description: addForm.description || undefined,
          minSelection: parseInt(addForm.minSelection) || 0,
          maxSelection: parseInt(addForm.maxSelection) || 1,
          isRequired: addForm.isRequired,
          isActive: addForm.isActive,
          sortOrder: parseInt(addForm.sortOrder) || 0,
        },
      })).unwrap();
      setAddForm(emptyForm);
      setShowAddRow(false);
    } catch { /* error is in redux */ }
  };

  const startEdit = (mg) => {
    setEditingUuid(mg.modifierGroupUuid);
    setEditForm({
      name: mg.name || '',
      description: mg.description || '',
      minSelection: mg.minSelection ?? 0,
      maxSelection: mg.maxSelection ?? 1,
      isRequired: mg.isRequired || false,
      isActive: mg.isActive !== false,
      sortOrder: mg.sortOrder ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingUuid(null);
    setEditForm(emptyForm);
  };

  const handleUpdate = async () => {
    try {
      await dispatch(updateModifierGroup({
        restaurantUuid,
        modifierGroupUuid: editingUuid,
        data: {
          name: editForm.name || undefined,
          description: editForm.description || undefined,
          minSelection: editForm.minSelection !== '' ? parseInt(editForm.minSelection) : undefined,
          maxSelection: editForm.maxSelection !== '' ? parseInt(editForm.maxSelection) : undefined,
          isRequired: editForm.isRequired,
          isActive: editForm.isActive,
          sortOrder: editForm.sortOrder !== '' ? parseInt(editForm.sortOrder) : undefined,
        },
      })).unwrap();
      cancelEdit();
    } catch { /* error is in redux */ }
  };

  const handleDelete = async (modifierGroupUuid) => {
    if (!window.confirm('Delete this modifier group? All its modifiers will also be deleted.')) return;
    dispatch(deleteModifierGroup({ restaurantUuid, modifierGroupUuid }));
  };

  const handleToggleStatus = (mg) => {
    dispatch(toggleModifierGroupStatus({
      restaurantUuid,
      modifierGroupUuid: mg.modifierGroupUuid,
      isActive: !mg.isActive,
    }));
  };

  // ── Shared styles ───────────────────────────────────────
  const cellInput = 'flex h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  // ── Render ──────────────────────────────────────────────
  return (
    <Card className="w-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered className="h-4 w-4 text-purple-500" />
          Modifier Groups
          {modifierGroups.length > 0 && (
            <span className="text-xs font-normal text-slate-400">({modifierGroups.length})</span>
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
            <Plus className="h-4 w-4 mr-1" /> Add Group
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
               {modifierGroups.length === 0 && !showAddRow && (
                  <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded border border-slate-200">
                    No modifier groups yet. Tap "Add Group" to create one.
                  </div>
                )}

              {/* Mobile Add Form */}
              {showAddRow && (
                <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="font-medium text-green-800 mb-2">New Modifier Group</div>
                  <input className={cellInput} placeholder="Name *" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                  <input className={cellInput} placeholder="Description" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Min Select</label>
                      <input className={cellInput} type="number" placeholder="0" value={addForm.minSelection} onChange={e => setAddForm(p => ({ ...p, minSelection: e.target.value }))} min="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Max Select</label>
                      <input className={cellInput} type="number" placeholder="1" value={addForm.maxSelection} onChange={e => setAddForm(p => ({ ...p, maxSelection: e.target.value }))} min="1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={addForm.isRequired} onChange={e => setAddForm(p => ({ ...p, isRequired: e.target.checked }))} className="rounded border-slate-300 text-purple-500 focus:ring-purple-400" />
                        Required
                     </label>
                     <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300 text-green-500 focus:ring-green-400" />
                        Active
                     </label>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Sort Order</label>
                    <input className={cellInput} type="number" value={addForm.sortOrder} onChange={e => setAddForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                     <Button size="sm" variant="ghost" onClick={() => { setShowAddRow(false); setAddForm(emptyForm); }}>
                       Cancel
                     </Button>
                     <Button size="sm" onClick={handleAdd} disabled={actionLoading || !addForm.name} className="bg-green-600 hover:bg-green-700 text-white">
                       <Check className="h-4 w-4 mr-1" /> Save
                     </Button>
                  </div>
                </div>
              )}

              {/* Mobile List Info */}
              {modifierGroups.map((mg) => {
                const isEditing = editingUuid === mg.modifierGroupUuid;

                if (isEditing) {
                   return (
                    <div key={mg.modifierGroupUuid} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                       <div className="font-medium text-blue-800 mb-2">Edit Group</div>
                       <input className={cellInput} placeholder="Name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                       <input className={cellInput} placeholder="Description" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                       <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Min Select</label>
                          <input className={cellInput} type="number" value={editForm.minSelection} onChange={e => setEditForm(p => ({ ...p, minSelection: e.target.value }))} min="0" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Max Select</label>
                          <input className={cellInput} type="number" value={editForm.maxSelection} onChange={e => setEditForm(p => ({ ...p, maxSelection: e.target.value }))} min="1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={editForm.isRequired} onChange={e => setEditForm(p => ({ ...p, isRequired: e.target.checked }))} className="rounded border-slate-300 text-purple-500 focus:ring-purple-400" />
                            Required
                         </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300 text-green-500 focus:ring-green-400" />
                            Active
                         </label>
                      </div>
                       <div>
                        <label className="text-xs text-slate-500 block mb-1">Sort Order</label>
                        <input className={cellInput} type="number" value={editForm.sortOrder} onChange={e => setEditForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                      </div>
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
                  <div key={mg.modifierGroupUuid} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">{mg.name}</h3>
                        <p className="text-sm text-slate-500">{mg.description || 'No description'}</p>
                      </div>
                       <button type="button" onClick={() => handleToggleStatus(mg)} disabled={actionLoading}>
                          <Badge variant={mg.isActive ? 'success' : 'danger'}>
                            {mg.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mb-3">
                      <div>
                         <span className="text-slate-400 text-xs block">Selection</span>
                         {mg.minSelection} - {mg.maxSelection}
                      </div>
                      <div>
                         <span className="text-slate-400 text-xs block">Required</span>
                         {mg.isRequired ? 'Yes' : 'No'}
                      </div>
                       <div>
                         <span className="text-slate-400 text-xs block">Order</span>
                         {mg.sortOrder ?? 0}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                      <Button 
                         size="sm" 
                         variant="outline" 
                         className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                         onClick={() => onManageModifiers(mg)}
                      >
                         <Settings2 className="h-4 w-4 mr-1" /> Modifiers
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(mg)} className="text-slate-500">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                       <Button size="sm" variant="ghost" onClick={() => handleDelete(mg.modifierGroupUuid)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-center">Min Selection</th>
                    <th className="px-3 py-2 text-center">Max Selection</th>
                    <th className="px-3 py-2 text-center">Required</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Order</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modifierGroups.length === 0 && !showAddRow && (
                    <tr>
                      <td colSpan="8" className="px-3 py-6 text-center text-slate-400 italic">
                        No modifier groups yet. Click "Add Group" to create one.
                      </td>
                    </tr>
                  )}

                  {modifierGroups.map((mg) => {
                    const isEditing = editingUuid === mg.modifierGroupUuid;

                    if (isEditing) {
                      return (
                        <tr key={mg.modifierGroupUuid} className="bg-blue-50/40">
                          <td className="px-3 py-2">
                            <input className={cellInput} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={cellInput} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className={cellInput + ' text-center'} type="number" value={editForm.minSelection} onChange={e => setEditForm(p => ({ ...p, minSelection: e.target.value }))} min="0" />
                          </td>
                          <td className="px-3 py-2">
                            <input className={cellInput + ' text-center'} type="number" value={editForm.maxSelection} onChange={e => setEditForm(p => ({ ...p, maxSelection: e.target.value }))} min="1" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={editForm.isRequired} onChange={e => setEditForm(p => ({ ...p, isRequired: e.target.checked }))} className="rounded border-slate-300 text-purple-500 focus:ring-purple-400" />
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
                      <tr key={mg.modifierGroupUuid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-800">{mg.name}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{mg.description || '—'}</td>
                        <td className="px-3 py-2 text-center">{mg.minSelection ?? 0}</td>
                        <td className="px-3 py-2 text-center">{mg.maxSelection ?? 1}</td>
                        <td className="px-3 py-2 text-center">
                          {mg.isRequired ? (
                            <Badge variant="warning" size="sm">Required</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">Optional</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => handleToggleStatus(mg)} disabled={actionLoading}>
                            <Badge variant={mg.isActive ? 'success' : 'danger'}>
                              {mg.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400">{mg.sortOrder ?? 0}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <button 
                              type="button" 
                              onClick={() => onManageModifiers(mg)} 
                              disabled={actionLoading}
                              className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                              title="Manage Modifiers"
                            >
                              <Settings2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => startEdit(mg)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDelete(mg.modifierGroupUuid)} disabled={actionLoading} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors">
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
                        <input className={cellInput} placeholder="Description" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={cellInput + ' text-center'} type="number" placeholder="0" value={addForm.minSelection} onChange={e => setAddForm(p => ({ ...p, minSelection: e.target.value }))} min="0" />
                      </td>
                      <td className="px-3 py-2">
                        <input className={cellInput + ' text-center'} type="number" placeholder="1" value={addForm.maxSelection} onChange={e => setAddForm(p => ({ ...p, maxSelection: e.target.value }))} min="1" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={addForm.isRequired} onChange={e => setAddForm(p => ({ ...p, isRequired: e.target.checked }))} className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2">
                        <input className={cellInput + ' text-center w-16 mx-auto'} type="number" value={addForm.sortOrder} onChange={e => setAddForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button type="button" onClick={handleAdd} disabled={actionLoading || !addForm.name} className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-40">
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

export default ModifierGroupManager;
