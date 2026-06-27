import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Loader2 } from 'lucide-react';
import { Toggle } from './ui/kit';
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

const emptyAdd = { name: '', priceAdd: '' };

/**
 * Inline options editor for a single modifier group.
 * Renders the group's options as rows (name / +₹price / active toggle / delete)
 * plus a dashed "new option" add row — all wired to the existing modifier
 * fetch/create/update/delete/toggle redux thunks.
 */
const ModifierManager = ({ restaurantUuid, modifierGroupUuid, groupName }) => {
  const dispatch = useDispatch();
  const { modifiers, loading, actionLoading, error, success } = useSelector(s => s.modifiers);

  const [addForm, setAddForm] = useState(emptyAdd);

  // Fetch options for the selected group (reuses the modal's fetch logic).
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
    if (!addForm.name || addForm.priceAdd === '') return;
    try {
      await dispatch(createModifier({
        restaurantUuid,
        modifierGroupUuid,
        data: {
          name: addForm.name,
          priceAdd: parseFloat(addForm.priceAdd) || 0,
          isActive: true,
          sortOrder: 0,
        },
      })).unwrap();
      setAddForm(emptyAdd);
    } catch { /* error is in redux */ }
  };

  const handleUpdateName = async (m, name) => {
    if (!name || name === m.name) return;
    try {
      await dispatch(updateModifier({
        restaurantUuid,
        modifierGroupUuid,
        modifierUuid: m.modifierUuid,
        data: { name },
      })).unwrap();
    } catch { /* error is in redux */ }
  };

  const handleUpdatePrice = async (m, raw) => {
    if (raw === '') return;
    const price = parseFloat(raw);
    if (Number.isNaN(price) || price === m.priceAdd) return;
    try {
      await dispatch(updateModifier({
        restaurantUuid,
        modifierGroupUuid,
        modifierUuid: m.modifierUuid,
        data: { priceAdd: price },
      })).unwrap();
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
  const rowInput = 'h-9 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold';

  return (
    <div>
      {/* Section heading */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="eyebrow text-[11px] text-txt-faint truncate">
          Options · {groupName || 'group'}
          {modifiers.length > 0 && (
            <span className="ml-1.5 font-mono normal-case tracking-normal text-txt-faint">({modifiers.length})</span>
          )}
        </p>
        {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-txt-faint" />}
      </div>

      {/* Notification inline */}
      {(error || success) && (
        <div className={cn(
          'mb-3 rounded-input border px-3 py-2 text-sm font-medium',
          error
            ? 'border-danger/30 bg-danger/[0.08] text-danger-deep'
            : 'border-success/30 bg-success/[0.10] text-success-deep',
        )}>
          {error || success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-txt-faint" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {modifiers.length === 0 && (
            <div className="rounded-input border border-dashed border-line-input bg-paper-2 px-4 py-6 text-center">
              <p className="text-sm text-txt-muted">No options yet.</p>
              <p className="text-xs text-txt-faint mt-1">Add your first option below.</p>
            </div>
          )}

          {/* Option rows */}
          {modifiers.map((m) => (
            <div
              key={m.modifierUuid}
              className="flex items-center gap-3 rounded-input border border-line-light bg-paper-card p-3 transition hover:border-line-input"
            >
              {/* Name (editable inline) */}
              <input
                className={cn(rowInput, 'flex-1 min-w-0')}
                defaultValue={m.name}
                disabled={actionLoading}
                onBlur={(e) => handleUpdateName(m, e.target.value.trim())}
                title="Option name"
              />

              {/* Price */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-mono text-sm text-success-deep">+₹</span>
                <input
                  type="number"
                  step="0.01"
                  className={cn(rowInput, 'w-20 font-mono text-right')}
                  defaultValue={m.priceAdd}
                  disabled={actionLoading}
                  onBlur={(e) => handleUpdatePrice(m, e.target.value)}
                  title="Price add"
                />
              </div>

              {/* Active toggle */}
              <Toggle checked={!!m.isActive} onChange={() => handleToggleStatus(m)} size="sm" disabled={actionLoading} />

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(m.modifierUuid)}
                disabled={actionLoading}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-input border border-line-input bg-paper-card text-lg leading-none text-txt-muted transition hover:border-danger/40 hover:bg-danger/[0.08] hover:text-danger-deep disabled:opacity-50"
                title="Delete option"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Dashed new-option add row */}
          <div className="flex items-center gap-3 rounded-input border border-dashed border-line-input bg-paper-2/50 p-3">
            <input
              className={cn(rowInput, 'flex-1 min-w-0')}
              placeholder="New option, e.g. Extra Cheese"
              value={addForm.name}
              disabled={actionLoading}
              onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-mono text-sm text-success-deep">+₹</span>
              <input
                type="number"
                step="0.01"
                className={cn(rowInput, 'w-20 font-mono text-right')}
                placeholder="0.00"
                value={addForm.priceAdd}
                disabled={actionLoading}
                onChange={(e) => setAddForm(p => ({ ...p, priceAdd: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={actionLoading || !addForm.name || addForm.priceAdd === ''}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-marigold text-ink transition hover:brightness-105 active:brightness-95 disabled:opacity-50"
              title="Add option"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifierManager;
