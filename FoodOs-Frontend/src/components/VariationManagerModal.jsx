import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Package, X } from 'lucide-react';
import VariationManager from './VariationManager';
import BulkVariationManager from './BulkVariationManager';

const VariationManagerModal = ({ isOpen, onClose, restaurantUuid, productUuid, productName }) => {
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
          <Package className="h-5 w-5 text-indigo-500" />
          <span>Manage Variations - {productName}</span>
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
              <Package className="h-4 w-4 mr-1" /> Add Multiple Variations
            </Button>
          </div>
        )}

        {/* Show either Bulk or Single Variation Manager */}
        {showBulkAdd ? (
          <BulkVariationManager
            restaurantUuid={restaurantUuid}
            productUuid={productUuid}
            onComplete={handleBulkComplete}
          />
        ) : (
          <VariationManager 
            restaurantUuid={restaurantUuid} 
            productUuid={productUuid} 
          />
        )}
      </div>
    </Modal>
  );
};

export default VariationManagerModal;
