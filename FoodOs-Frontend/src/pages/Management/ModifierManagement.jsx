import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { PageHeader, Panel } from '../../components/ui/kit';
import ModifierGroupManager from '../../components/ModifierGroupManager';
import ModifierManagerModal from '../../components/ModifierManagerModal';
import {
  fetchModifierGroups,
  clearError,
  clearSuccess,
} from '../../store/modifierGroupSlice';

const ModifierManagement = () => {
  const dispatch = useDispatch();
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { error, success } = useSelector((state) => state.modifierGroups);

  const [selectedModifierGroup, setSelectedModifierGroup] = useState(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Fetch modifier groups on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchModifierGroups({ restaurantUuid: activeRestaurantId, includeInactive: true }));
    }
  }, [dispatch, activeRestaurantId]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleManageModifiers = (modifierGroup) => {
    setSelectedModifierGroup(modifierGroup);
    setIsModifierModalOpen(true);
  };

  const handleCloseModifierModal = () => {
    setIsModifierModalOpen(false);
    setSelectedModifierGroup(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Menu"
        title="Modifier Groups & Add-ons"
        subtitle="Build option groups like Toppings, Spice Level or Add-ons for your menu items."
      />

      {/* Global Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger/[0.08] px-4 py-3 text-sm text-danger-deep">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="line-clamp-2">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-input border border-success/30 bg-success/[0.10] px-4 py-3 text-sm text-success-deep">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="line-clamp-2">{success}</span>
        </div>
      )}

      {/* Main Content */}
      {activeRestaurantId ? (
        <ModifierGroupManager
          restaurantUuid={activeRestaurantId}
          onManageModifiers={handleManageModifiers}
        />
      ) : (
        <Panel className="p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-txt-faint" />
          <p className="text-sm text-txt-muted">No restaurant selected</p>
        </Panel>
      )}

      {/* Modifier Management Modal */}
      {selectedModifierGroup && (
        <ModifierManagerModal
          isOpen={isModifierModalOpen}
          onClose={handleCloseModifierModal}
          restaurantUuid={activeRestaurantId}
          modifierGroupUuid={selectedModifierGroup.modifierGroupUuid}
          modifierGroupName={selectedModifierGroup.name}
        />
      )}
    </div>
  );
};

export default ModifierManagement;
