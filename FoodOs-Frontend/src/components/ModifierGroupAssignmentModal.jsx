import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { BtnPrimary, BtnGhost } from './ui/kit';
import { cn } from '../utils/cn';
import {
  Plus, Loader2, CheckCircle, AlertCircle, Search, Package, Check,
} from 'lucide-react';
import { productModifierGroupAPI } from '../services/api';
import { fetchModifierGroups } from '../store/modifierGroupSlice';

const inputClass =
  'h-10 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold';

const ModifierGroupAssignmentModal = ({
  isOpen,
  onClose,
  restaurantUuid,
  productUuid,
  productName,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { modifierGroups } = useSelector((state) => state.modifierGroups);

  const [loading, setLoading] = useState(false);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selected, setSelected] = useState([]); // uuids of unassigned groups to assign

  // Fetch assigned modifier groups when modal opens
  useEffect(() => {
    if (isOpen && restaurantUuid && productUuid) {
      fetchAssignedGroups();
      // Fetch all modifier groups for the restaurant
      dispatch(fetchModifierGroups({ restaurantUuid, includeInactive: false }));
    }
  }, [isOpen, restaurantUuid, productUuid, dispatch]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchAssignedGroups = async () => {
    try {
      setLoading(true);
      const response = await productModifierGroupAPI.getAll(restaurantUuid, productUuid);
      setAssignedGroups(response.data || []);
    } catch (err) {
      console.error('Error fetching assigned modifier groups:', err);
      setError(err.response?.data?.message || 'Failed to fetch assigned modifier groups');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroup = async (modifierGroupUuid) => {
    if (!window.confirm('Are you sure you want to remove this modifier group from the product?')) {
      return;
    }

    try {
      setActionLoading(modifierGroupUuid);
      setError(null);
      await productModifierGroupAPI.remove(restaurantUuid, productUuid, modifierGroupUuid);
      setSuccess('Modifier group removed successfully');
      await fetchAssignedGroups();
    } catch (err) {
      console.error('Error removing modifier group:', err);
      setError(err.response?.data?.message || 'Failed to remove modifier group');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (modifierGroupUuid) => {
    setSelected((prev) =>
      prev.includes(modifierGroupUuid)
        ? prev.filter((id) => id !== modifierGroupUuid)
        : [...prev, modifierGroupUuid]
    );
  };

  const handleAssignSelected = async () => {
    if (selected.length === 0) return;
    try {
      setActionLoading('assign');
      setError(null);
      await Promise.all(
        selected.map((uuid) =>
          productModifierGroupAPI.assign(restaurantUuid, productUuid, uuid)
        )
      );
      setSuccess('Modifier groups assigned successfully');
      setSelected([]);
      await fetchAssignedGroups();
      onClose();
    } catch (err) {
      console.error('Error assigning modifier groups:', err);
      setError(err.response?.data?.message || 'Failed to assign modifier groups');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelected([]);
    setError(null);
    setSuccess(null);
    onClose();
  };

  // Filter modifier groups based on search term
  const filteredGroups = modifierGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set of already-assigned modifier group uuids
  const assignedGroupUuids = new Set(assignedGroups.map((g) => g.modifierGroupUuid));

  const metaLine = (group) => {
    const requirement = group.isRequired ? 'Required' : 'Optional';
    const pick = group.selectionType === 'SINGLE' ? 'pick 1' : 'pick any';
    const max = `max ${group.maxSelection}`;
    const options = `${group.modifiers?.length || 0} options`;
    return `${requirement} · ${pick} · ${max} · ${options}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Assign modifier groups"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate('/app/modifiers');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-marigold hover:brightness-95 transition"
          >
            <Plus className="h-4 w-4" /> Create new group
          </button>
          <div className="flex items-center gap-2">
            <BtnGhost onClick={handleClose}>Cancel</BtnGhost>
            <BtnPrimary
              onClick={handleAssignSelected}
              disabled={selected.length === 0 || actionLoading === 'assign'}
            >
              {actionLoading === 'assign' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Assign {selected.length} group{selected.length === 1 ? '' : 's'}
            </BtnPrimary>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Subtitle */}
        <p className="text-sm text-txt-muted -mt-1">
          Add groups to <span className="font-medium text-ink-text">{productName}</span>
          {' · '}
          {assignedGroups.length} already assigned
        </p>

        {/* Messages */}
        {error && (
          <div className="bg-danger/[0.08] border border-danger/30 text-danger-deep px-4 py-3 rounded-input flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-success/[0.10] border border-success/30 text-success-deep px-4 py-3 rounded-input flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Search modifier groups…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(inputClass, 'pl-9')}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-marigold" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 bg-paper-2 rounded-input border border-dashed border-line-light">
            <Package className="h-10 w-10 text-txt-faint mx-auto mb-2" />
            <p className="text-sm text-txt-muted">
              {searchTerm ? 'No modifier groups found' : 'No modifier groups available'}
            </p>
            {searchTerm && (
              <p className="eyebrow text-[10px] text-txt-faint mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="max-h-[42vh] overflow-y-auto pr-0.5">
            {filteredGroups.map((group) => {
              const isAssigned = assignedGroupUuids.has(group.modifierGroupUuid);
              const isSelected = selected.includes(group.modifierGroupUuid);
              const busy = actionLoading === group.modifierGroupUuid;

              if (isAssigned) {
                return (
                  <button
                    key={group.modifierGroupUuid}
                    type="button"
                    onClick={() => handleRemoveGroup(group.modifierGroupUuid)}
                    disabled={busy}
                    className="w-full text-left flex items-center gap-3 rounded-input p-3 mb-2 bg-paper-2 border border-line-light disabled:opacity-60"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-success text-white">
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-text truncate">{group.name}</p>
                      <p className="text-xs text-txt-muted truncate">{metaLine(group)}</p>
                    </div>
                    <span className="eyebrow text-[10px] text-success-deep shrink-0">Assigned</span>
                  </button>
                );
              }

              return (
                <button
                  key={group.modifierGroupUuid}
                  type="button"
                  onClick={() => toggleSelect(group.modifierGroupUuid)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 rounded-input p-3 mb-2 transition-colors',
                    isSelected
                      ? 'border-2 border-marigold bg-marigold/[0.06]'
                      : 'border border-line-light hover:bg-paper-2'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border',
                      isSelected
                        ? 'bg-marigold border-marigold text-ink'
                        : 'bg-paper-card border-line-input'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-text truncate">{group.name}</p>
                    <p className="text-xs text-txt-muted truncate">{metaLine(group)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModifierGroupAssignmentModal;
