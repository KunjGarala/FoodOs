import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Sparkles, X } from 'lucide-react';
import ModifierManager from './ModifierManager';
import BulkModifierManager from './BulkModifierManager';

const ModifierManagerModal = ({ isOpen, onClose, restaurantUuid, modifierGroupUuid, modifierGroupName }) => {
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const handleClose = () => {
    setShowBulkAdd(false);
    onClose();
  };

  const handleBulkComplete = () => {
    setShowBulkAdd(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="full"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>Manage Modifiers - {modifierGroupName}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Toggle button */}
        {!showBulkAdd && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowBulkAdd(true)}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-1" /> Add Multiple Modifiers
            </Button>
          </div>
        )}

        {/* Show either Bulk or Single Modifier Manager */}
        {showBulkAdd ? (
          <BulkModifierManager
            restaurantUuid={restaurantUuid}
            modifierGroupUuid={modifierGroupUuid}
            onComplete={handleBulkComplete}
          />
        ) : (
          <ModifierManager 
            restaurantUuid={restaurantUuid} 
            modifierGroupUuid={modifierGroupUuid} 
          />
        )}
      </div>
    </Modal>
  );
};

export default ModifierManagerModal;
