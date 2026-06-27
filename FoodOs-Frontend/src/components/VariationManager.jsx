import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GripVertical, Plus, Loader2, X } from 'lucide-react';
import { BtnPrimary, BtnGhost } from './ui/kit';
import { cn } from '../utils/cn';
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

// Presentational-only selects (no matching backend fields — local UI to match the mockup)
const OPTION_TYPES = ['Size', 'Version', 'Portion', 'Style'];
const GUEST_SELECTS = ['Exactly 1', 'At least 1', 'Any number'];

const inputCls =
  'h-10 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold';

const VariationManager = ({ restaurantUuid, productUuid, productName, onClose }) => {
  const dispatch = useDispatch();
  const { variations, loading, actionLoading, error, success } = useSelector(s => s.variations);

  const [addForm, setAddForm] = useState(emptyForm);
  const [editingUuid, setEditingUuid] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Presentational-only top selects (no backend fields)
  const [optionType, setOptionType] = useState(OPTION_TYPES[0]);
  const [guestSelects, setGuestSelects] = useState(GUEST_SELECTS[0]);

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

  // ── Handlers (logic preserved) ──────────────────────────
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

  // eslint-disable-next-line no-unused-vars
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

  // Inline save of an editing row's name/price as the user types is committed on blur.
  const commitEdit = () => {
    if (editingUuid) handleUpdate();
  };

  // ── Derived ─────────────────────────────────────────────
  const defaultVariation = variations.find(v => v.isDefault);
  const defaultName = defaultVariation ? defaultVariation.name : 'None';

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-[20px] tracking-[-0.01em] text-ink-text">Variations</h3>
        <p className="text-sm text-txt-muted mt-0.5">
          Sizes or versions of {productName || 'this item'}
        </p>
      </div>

      {/* Notification inline */}
      {(error || success) && (
        <div
          className={cn(
            'mb-4 px-3 py-2 rounded-input text-sm font-medium border',
            error
              ? 'bg-danger/[0.08] text-danger-deep border-danger/30'
              : 'bg-success/[0.08] text-success-deep border-success/30',
          )}
        >
          {error || success}
        </div>
      )}

      {/* Top selects (presentational UI to match mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div>
          <label className="eyebrow text-[11px] text-txt-faint mb-1.5 block">Option Type</label>
          <select
            value={optionType}
            onChange={e => setOptionType(e.target.value)}
            className={inputCls}
          >
            {OPTION_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow text-[11px] text-txt-faint mb-1.5 block">Guest Selects</label>
          <select
            value={guestSelects}
            onChange={e => setGuestSelects(e.target.value)}
            className={inputCls}
          >
            {GUEST_SELECTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-txt-faint" />
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-1 pb-2">
            <span className="w-5 shrink-0" />
            <span className="eyebrow text-[11px] text-txt-faint flex-1">Variation</span>
            <span className="eyebrow text-[11px] text-txt-faint w-28 shrink-0">Price</span>
            <span className="eyebrow text-[11px] text-txt-faint w-16 shrink-0 text-center">Default</span>
            <span className="w-7 shrink-0" />
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {variations.length === 0 && (
              <div className="rounded-input border border-dashed border-line-input py-8 text-center text-sm text-txt-faint">
                No variations yet. Use the row below to add one.
              </div>
            )}

            {variations.map((v) => {
              const isEditing = editingUuid === v.variationUuid;
              const name = isEditing ? editForm.name : v.name;
              const price = isEditing ? editForm.price : v.price;
              return (
                <div key={v.variationUuid} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 flex justify-center text-txt-faint cursor-grab" aria-hidden="true">
                    <GripVertical className="h-4 w-4" />
                  </span>

                  {/* Variation name */}
                  <input
                    className={cn(inputCls, 'flex-1')}
                    value={name}
                    onFocus={() => { if (!isEditing) startEdit(v); }}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    onBlur={commitEdit}
                    disabled={actionLoading}
                  />

                  {/* Price */}
                  <div className="relative w-28 shrink-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-txt-faint">₹</span>
                    <input
                      className={cn(inputCls, 'pl-7 text-right')}
                      type="number"
                      step="0.01"
                      value={price}
                      onFocus={() => { if (!isEditing) startEdit(v); }}
                      onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                      onBlur={commitEdit}
                      disabled={actionLoading}
                    />
                  </div>

                  {/* Default radio */}
                  <div className="w-16 shrink-0 flex justify-center">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!!v.isDefault}
                      onClick={() => handleSetDefault(v.variationUuid)}
                      disabled={actionLoading || v.isDefault}
                      title={v.isDefault ? 'Default variation' : 'Set as default'}
                      className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors disabled:cursor-default',
                        v.isDefault ? 'border-marigold' : 'border-line-input hover:border-marigold/60',
                      )}
                    >
                      {v.isDefault && <span className="h-2.5 w-2.5 rounded-full bg-marigold" />}
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(v.variationUuid)}
                    disabled={actionLoading}
                    title="Delete variation"
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded-input text-txt-faint hover:text-danger hover:bg-danger/[0.08] transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Add row (dashed) */}
            <div className="flex items-center gap-3 rounded-input border border-dashed border-line-input p-2 mt-3">
              <span className="w-5 shrink-0" />
              <input
                className={cn(inputCls, 'flex-1')}
                placeholder="New variation name…"
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                disabled={actionLoading}
              />
              <div className="relative w-28 shrink-0">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-txt-faint">₹</span>
                <input
                  className={cn(inputCls, 'pl-7 text-right')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.price}
                  onChange={e => setAddForm(p => ({ ...p, price: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                  disabled={actionLoading}
                />
              </div>
              <div className="w-16 shrink-0 flex justify-center">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={actionLoading || !addForm.name || !addForm.price}
                  title="Add variation"
                  className="h-8 w-8 flex items-center justify-center rounded-input bg-marigold text-ink hover:brightness-105 active:brightness-95 transition disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="w-7 shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-line-light">
        <p className="text-xs text-txt-muted">
          {variations.length} variation{variations.length === 1 ? '' : 's'} · {defaultName} is default
        </p>
        <div className="flex items-center gap-2 justify-end">
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary onClick={onClose} disabled={actionLoading}>Save variations</BtnPrimary>
        </div>
      </div>
    </div>
  );
};

export default VariationManager;
