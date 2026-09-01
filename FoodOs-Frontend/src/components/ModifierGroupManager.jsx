import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Trash2 } from 'lucide-react';
import { Panel, Toggle, BtnPrimary, BtnGhost } from './ui/kit';
import { cn } from '../utils/cn';
import ModifierManager from './ModifierManager';
import {
  fetchModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
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

const NEW_KEY = '__new__';

const groupMeta = (mg) => {
  const min = mg.minSelection ?? 0;
  const max = mg.maxSelection ?? 1;
  const required = mg.isRequired ? 'Required' : 'Optional';
  const pick = min >= 1 ? 'pick 1' : 'pick any';
  const count = mg.modifierCount ?? (Array.isArray(mg.modifiers) ? mg.modifiers.length : null);
  const parts = [required, pick, `max ${max}`];
  if (count != null) parts.push(`${count} option${count === 1 ? '' : 's'}`);
  return parts.join(' · ');
};

/**
 * Two-pane inline builder for modifier groups.
 *  Left: list of groups (selectable). Right: builder for the selected/new group,
 *  with its options edited inline (ModifierManager) once the group exists.
 */
const ModifierGroupManager = ({ restaurantUuid, newSignal }) => {
  const dispatch = useDispatch();
  const { modifierGroups, loading, actionLoading, error, success } = useSelector(s => s.modifierGroups);

  // selectedUuid: a real group uuid, NEW_KEY for a blank builder, or null.
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [form, setForm] = useState(emptyForm);

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

  const isNew = selectedUuid === NEW_KEY;
  const selectedGroup = !isNew ? modifierGroups.find(g => g.modifierGroupUuid === selectedUuid) : null;

  // Keep the builder form in sync with the selected group.
  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
    } else if (selectedGroup) {
      setForm({
        name: selectedGroup.name || '',
        description: selectedGroup.description || '',
        minSelection: selectedGroup.minSelection ?? 0,
        maxSelection: selectedGroup.maxSelection ?? 1,
        isRequired: selectedGroup.isRequired || false,
        isActive: selectedGroup.isActive !== false,
        sortOrder: selectedGroup.sortOrder ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUuid, selectedGroup?.modifierGroupUuid]);

  // The parent header's "+ New group" button bumps `newSignal` to start a blank builder.
  useEffect(() => {
    if (newSignal) setSelectedUuid(NEW_KEY);
  }, [newSignal]);

  // ── Handlers (preserve existing redux logic) ────────────
  const handleSave = async () => {
    if (!form.name) return;
    if (isNew) {
      try {
        const created = await dispatch(createModifierGroup({
          restaurantUuid,
          data: {
            name: form.name,
            description: form.description || undefined,
            minSelection: parseInt(form.minSelection) || 0,
            maxSelection: parseInt(form.maxSelection) || 1,
            isRequired: form.isRequired,
            isActive: form.isActive,
            sortOrder: parseInt(form.sortOrder) || 0,
          },
        })).unwrap();
        if (created?.modifierGroupUuid) setSelectedUuid(created.modifierGroupUuid);
      } catch { /* error is in redux */ }
    } else {
      try {
        await dispatch(updateModifierGroup({
          restaurantUuid,
          modifierGroupUuid: selectedUuid,
          data: {
            name: form.name || undefined,
            description: form.description || undefined,
            minSelection: form.minSelection !== '' ? parseInt(form.minSelection) : undefined,
            maxSelection: form.maxSelection !== '' ? parseInt(form.maxSelection) : undefined,
            isRequired: form.isRequired,
            isActive: form.isActive,
            sortOrder: form.sortOrder !== '' ? parseInt(form.sortOrder) : undefined,
          },
        })).unwrap();
      } catch { /* error is in redux */ }
    }
  };

  const handleDelete = async () => {
    if (isNew) { setSelectedUuid(null); return; }
    if (!selectedUuid) return;
    if (!window.confirm('Delete this modifier group? All its modifiers will also be deleted.')) return;
    try {
      await dispatch(deleteModifierGroup({ restaurantUuid, modifierGroupUuid: selectedUuid })).unwrap();
      setSelectedUuid(null);
    } catch { /* error is in redux */ }
  };

  // ── Shared styles ───────────────────────────────────────
  const input = 'h-10 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold';
  const smallNum = 'h-9 w-16 px-2 rounded-input bg-paper-2 border border-line-input text-sm text-center font-mono text-ink-text focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold';
  const fieldLabel = 'eyebrow text-[10px] text-txt-faint block mb-1';

  const builderOpen = isNew || !!selectedGroup;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* ── LEFT: groups list ───────────────────────────── */}
      <div className="space-y-3">
        <p className="eyebrow text-[11px] text-txt-faint">
          Groups · <span className="font-mono normal-case tracking-normal">{modifierGroups.length}</span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-txt-faint" />
          </div>
        ) : modifierGroups.length === 0 ? (
          <Panel className="px-4 py-8 text-center">
            <p className="text-sm text-txt-muted">No modifier groups yet.</p>
            <p className="text-xs text-txt-faint mt-1">Click “+ New group” to create one.</p>
          </Panel>
        ) : (
          <div className="space-y-2.5">
            {modifierGroups.map((mg) => {
              const active = mg.modifierGroupUuid === selectedUuid;
              return (
                <button
                  key={mg.modifierGroupUuid}
                  type="button"
                  onClick={() => setSelectedUuid(mg.modifierGroupUuid)}
                  className={cn(
                    'w-full text-left rounded-card bg-paper-card p-3.5 transition',
                    active
                      ? 'border-2 border-marigold'
                      : 'border border-line-light hover:border-line-input',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-[15px] text-ink-text truncate">{mg.name}</h3>
                      <p className="mt-1 text-xs text-txt-muted truncate">{groupMeta(mg)}</p>
                    </div>
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        mg.isActive !== false ? 'bg-success' : 'bg-line-input',
                      )}
                      title={mg.isActive !== false ? 'Active' : 'Inactive'}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT: builder ──────────────────────────────── */}
      {builderOpen ? (
        <Panel className="p-4 sm:p-6">
          <h2 className="font-display font-semibold text-[17px] text-ink-text mb-5">
            {isNew ? 'New Modifier Group' : `Edit group · ${selectedGroup?.name || ''}`}
          </h2>

          <div className="space-y-4">
            {/* Name + Sort order */}
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div>
                <label className={fieldLabel}>Group name</label>
                <input className={input} placeholder="e.g. Toppings" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className={fieldLabel}>Sort order</label>
                <input className={input} type="number" min="0" value={form.sortOrder}
                  onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={fieldLabel}>Description</label>
              <input className={input} placeholder="Optional description" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            {/* Selection + toggles */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
              <div>
                <label className={fieldLabel}>Selection</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-txt-muted">Min</span>
                    <input className={smallNum} type="number" min="0" value={form.minSelection}
                      onChange={e => setForm(p => ({ ...p, minSelection: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-txt-muted">Max</span>
                    <input className={smallNum} type="number" min="1" value={form.maxSelection}
                      onChange={e => setForm(p => ({ ...p, maxSelection: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="eyebrow text-[10px] text-txt-faint">Required</span>
                <Toggle checked={form.isRequired} onChange={(v) => setForm(p => ({ ...p, isRequired: v }))} />
              </div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-[10px] text-txt-faint">Active</span>
                <Toggle checked={form.isActive} onChange={(v) => setForm(p => ({ ...p, isActive: v }))} />
              </div>
            </div>

            {/* Options — only when the group exists */}
            {!isNew && selectedGroup && (
              <div className="border-t border-line-light pt-4 mt-1">
                <ModifierManager
                  key={selectedGroup.modifierGroupUuid}
                  restaurantUuid={restaurantUuid}
                  modifierGroupUuid={selectedGroup.modifierGroupUuid}
                  groupName={selectedGroup.name}
                />
              </div>
            )}
            {isNew && (
              <div className="border-t border-line-light pt-4 mt-1">
                <p className="rounded-input border border-dashed border-line-input bg-paper-2 px-4 py-5 text-center text-sm text-txt-muted">
                  Save the group to start adding options.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-line-light pt-4">
              <BtnGhost
                onClick={handleDelete}
                disabled={actionLoading}
                className="border-danger/30 text-danger-deep hover:bg-danger/[0.08] hover:border-danger/40"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={actionLoading || !form.name}>
                Save group
              </BtnPrimary>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-sm text-txt-muted">Select a group to edit, or create a new one.</p>
          <p className="text-xs text-txt-faint mt-1">Pick a group on the left to manage its options.</p>
        </Panel>
      )}
    </div>
  );
};

export default ModifierGroupManager;
