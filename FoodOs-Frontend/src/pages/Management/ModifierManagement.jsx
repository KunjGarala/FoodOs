import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 shrink-0" />
                <span className="truncate">Modifier Management</span>
              </h1>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                Manage modifier groups and their options
              </p>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="line-clamp-2">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="line-clamp-2">{success}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-4 sm:gap-6">
          {/* Modifier Groups */}
          <Card className="shadow-lg">
            <div className="p-3 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-700">Modifier Groups</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Create groups to organize modifiers (e.g., "Toppings", "Spice Level", "Add-ons")
                </p>
              </div>
              
              {activeRestaurantId ? (
                <ModifierGroupManager 
                  restaurantUuid={activeRestaurantId} 
                  onManageModifiers={handleManageModifiers}
                />
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No restaurant selected</p>
                </div>
              )}
            </div>
          </Card>
        </div>

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
    </div>
  );
};

export default ModifierManagement;
