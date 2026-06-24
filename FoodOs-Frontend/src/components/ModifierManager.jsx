import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus, Trash2, Check, Loader2, Pencil, GripVertical,
} from 'lucide-react';
import { Toggle, BtnPrimary, BtnGhost } from './ui/kit';
import { cn } from '../utils/cn';
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
  const cellInput = 'h-9 w-full rounded-input border border-line-input bg-paper-2 px-3 text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 transition';
  const fieldLabel = 'eyebrow text-[10px] text-txt-faint block mb-1';

  // ── Render add / edit form ──────────────────────────────
  const renderForm = (form, setForm, { onSave, onCancel, saveLabel, disabled }) => (
    <div className="rounded-tile border border-marigold/40 bg-paper-card p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className={fieldLabel}>Name</label>
          <input className={cellInput} placeholder="e.g. Extra Cheese" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="sm:w-32">
          <label className={fieldLabel}>Price (+₹)</label>
          <input className={cn(cellInput, 'font-mono text-right')} type="number" step="0.01" placeholder="0.00" value={form.priceAdd} onChange={e => setForm(p => ({ ...p, priceAdd: e.target.value }))} />
        </div>
        <div className="sm:w-24">
          <label className={fieldLabel}>Order</label>
          <input className={cn(cellInput, 'font-mono text-center')} type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} min="0" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Toggle checked={form.isActive} onChange={(v) => setForm(p => ({ ...p, isActive: v }))} size="sm" />
          <span className="text-sm text-ink-text">Active</span>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={onCancel}>Cancel</BtnGhost>
          <BtnPrimary onClick={onSave} disabled={disabled}>
            <Check className="h-4 w-4" /> {saveLabel}
          </BtnPrimary>
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-semibold text-[15px] text-ink-text flex items-center gap-2">
          Options
          {modifiers.length > 0 && (
            <span className="text-xs font-normal text-txt-faint font-mono">({modifiers.length})</span>
          )}
        </h2>
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
        <div className="space-y-2.5">
          {modifiers.length === 0 && !showAddRow && (
            <div className="rounded-tile border border-dashed border-line-input bg-paper-2 px-4 py-8 text-center">
              <p className="text-sm text-txt-muted">No options yet.</p>
              <p className="text-xs text-txt-faint mt-1">Add your first option below.</p>
            </div>
          )}

          {/* Option rows */}
          {modifiers.map((m) => {
            const isEditing = editingUuid === m.modifierUuid;

            if (isEditing) {
              return (
                <div key={m.modifierUuid}>
                  {renderForm(editForm, setEditForm, {
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
                key={m.modifierUuid}
                className="flex items-center gap-3 rounded-tile border border-line-light bg-paper-card px-3 py-2.5 transition hover:border-line-input"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-txt-faint" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-ink-text">{m.name}</span>
                </div>
                <span className="font-mono text-sm text-success-deep">+₹{m.priceAdd}</span>
                <Toggle checked={!!m.isActive} onChange={() => handleToggleStatus(m)} size="sm" disabled={actionLoading} />
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  disabled={actionLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-input border border-line-input bg-paper-card text-txt-muted transition hover:bg-paper-2 hover:text-ink-text disabled:opacity-50"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.modifierUuid)}
                  disabled={actionLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-input border border-line-input bg-paper-card text-txt-muted transition hover:border-danger/40 hover:bg-danger/[0.08] hover:text-danger-deep disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Add form / dashed add-option row */}
          {showAddRow ? (
            renderForm(addForm, setAddForm, {
              saveLabel: 'Add Option',
              onSave: handleAdd,
              onCancel: () => { setShowAddRow(false); setAddForm(emptyForm); },
              disabled: actionLoading || !addForm.name || !addForm.priceAdd,
            })
          ) : (
            <button
              type="button"
              onClick={() => setShowAddRow(true)}
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-tile border border-dashed border-line-input bg-paper-2/50 px-4 py-3 text-sm font-medium text-txt-muted transition hover:border-marigold hover:text-ink-text disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ModifierManager;
