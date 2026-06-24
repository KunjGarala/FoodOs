import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus, Trash2, Check, Loader2, Settings2, GripVertical, Pencil,
} from 'lucide-react';
import { Panel, Pill, Toggle, BtnPrimary, BtnGhost } from './ui/kit';
import { cn } from '../utils/cn';
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
  const cellInput = 'h-9 w-full rounded-input border border-line-input bg-paper-2 px-3 text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 transition';
  const fieldLabel = 'eyebrow text-[10px] text-txt-faint block mb-1';

  // Selected group (for builder highlight reference)
  const isBuilderOpen = showAddRow;

  // ── Render builder form (shared for add / edit) ─────────
  const renderForm = (form, setForm, { onSave, onCancel, saveLabel, title, disabled }) => (
    <Panel className="p-4 sm:p-5 border-marigold/40 bg-paper-card">
      <h3 className="font-display font-semibold text-[15px] text-ink-text mb-4">{title}</h3>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>Name</label>
            <input className={cellInput} placeholder="e.g. Toppings" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className={fieldLabel}>Sort Order</label>
            <input className={cellInput} type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Description</label>
          <input className={cellInput} placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>Min Selection</label>
            <input className={cellInput} type="number" placeholder="0" value={form.minSelection} onChange={e => setForm(p => ({ ...p, minSelection: e.target.value }))} min="0" />
          </div>
          <div>
            <label className={fieldLabel}>Max Selection</label>
            <input className={cellInput} type="number" placeholder="1" value={form.maxSelection} onChange={e => setForm(p => ({ ...p, maxSelection: e.target.value }))} min="1" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-input border border-line-light bg-paper-2 px-3 py-2.5">
            <span className="text-sm font-medium text-ink-text">Required</span>
            <Toggle checked={form.isRequired} onChange={(v) => setForm(p => ({ ...p, isRequired: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-input border border-line-light bg-paper-2 px-3 py-2.5">
            <span className="text-sm font-medium text-ink-text">Active</span>
            <Toggle checked={form.isActive} onChange={(v) => setForm(p => ({ ...p, isActive: v }))} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <BtnGhost onClick={onCancel}>Cancel</BtnGhost>
          <BtnPrimary onClick={onSave} disabled={disabled}>
            <Check className="h-4 w-4" /> {saveLabel}
          </BtnPrimary>
        </div>
      </div>
    </Panel>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr]">
      <Panel className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-[17px] text-ink-text flex items-center gap-2">
              Modifier Groups
              {modifierGroups.length > 0 && (
                <span className="text-xs font-normal text-txt-faint font-mono">({modifierGroups.length})</span>
              )}
            </h2>
            <p className="text-xs text-txt-muted mt-0.5">
              Organize add-ons like “Toppings”, “Spice Level” or “Sides”.
            </p>
          </div>
          {!isBuilderOpen && (
            <BtnPrimary onClick={() => setShowAddRow(true)} disabled={actionLoading}>
              <Plus className="h-4 w-4" /> Add Group
            </BtnPrimary>
          )}
        </div>

        {/* Notification inline */}
        {(error || success) && (
          <div className={cn(
            'mb-4 rounded-input border px-3 py-2 text-sm font-medium',
            error
              ? 'border-danger/30 bg-danger/[0.08] text-danger-deep'
              : 'border-success/30 bg-success/[0.10] text-success-deep',
          )}>
            {error || success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-txt-faint" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add form (builder) */}
            {showAddRow && renderForm(addForm, setAddForm, {
              title: 'New Modifier Group',
              saveLabel: 'Save Group',
              onSave: handleAdd,
              onCancel: () => { setShowAddRow(false); setAddForm(emptyForm); },
              disabled: actionLoading || !addForm.name,
            })}

            {/* Empty state */}
            {modifierGroups.length === 0 && !showAddRow && (
              <div className="rounded-tile border border-dashed border-line-input bg-paper-2 px-4 py-10 text-center">
                <p className="text-sm text-txt-muted">No modifier groups yet.</p>
                <p className="text-xs text-txt-faint mt-1">Click “Add Group” to create your first one.</p>
              </div>
            )}

            {/* Group list */}
            <div className="space-y-3">
              {modifierGroups.map((mg) => {
                const isEditing = editingUuid === mg.modifierGroupUuid;

                if (isEditing) {
                  return (
                    <div key={mg.modifierGroupUuid}>
                      {renderForm(editForm, setEditForm, {
                        title: 'Edit Modifier Group',
                        saveLabel: 'Update',
                        onSave: handleUpdate,
                        onCancel: cancelEdit,
                        disabled: actionLoading,
                      })}
                    </div>
                  );
                }

                return (
                  <div
                    key={mg.modifierGroupUuid}
                    className="rounded-tile border border-line-light bg-paper-card p-4 transition hover:border-line-input"
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-txt-faint" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-semibold text-[15px] text-ink-text truncate">{mg.name}</h3>
                          {mg.isRequired ? (
                            <Pill tone="gold">Required</Pill>
                          ) : (
                            <Pill tone="neutral">Optional</Pill>
                          )}
                          <button type="button" onClick={() => handleToggleStatus(mg)} disabled={actionLoading} className="disabled:opacity-50">
                            <Pill tone={mg.isActive ? 'success' : 'danger'}>
                              {mg.isActive ? 'Active' : 'Inactive'}
                            </Pill>
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-txt-muted truncate">{mg.description || 'No description'}</p>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-txt-muted">
                          <span>
                            <span className="text-txt-faint">Selection </span>
                            <span className="font-mono text-ink-text">{mg.minSelection ?? 0}–{mg.maxSelection ?? 1}</span>
                          </span>
                          <span>
                            <span className="text-txt-faint">Order </span>
                            <span className="font-mono text-ink-text">{mg.sortOrder ?? 0}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <BtnGhost
                          onClick={() => onManageModifiers(mg)}
                          disabled={actionLoading}
                          className="h-9 px-3"
                          title="Manage Modifiers"
                        >
                          <Settings2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Options</span>
                        </BtnGhost>
                        <button
                          type="button"
                          onClick={() => startEdit(mg)}
                          disabled={actionLoading}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-input border border-line-input bg-paper-card text-txt-muted transition hover:bg-paper-2 hover:text-ink-text disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mg.modifierGroupUuid)}
                          disabled={actionLoading}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-input border border-line-input bg-paper-card text-txt-muted transition hover:border-danger/40 hover:bg-danger/[0.08] hover:text-danger-deep disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default ModifierGroupManager;
