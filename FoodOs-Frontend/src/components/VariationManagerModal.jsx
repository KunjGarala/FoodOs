import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { BtnGhost } from './ui/kit';
import { Layers } from 'lucide-react';
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
      size="xl"
      title={
        <span className="eyebrow text-[11px] text-txt-faint">Item Editor ▸ Variations</span>
      }
    >
      <div className="space-y-4">
        {/* Toggle button */}
        {!showBulkAdd && (
          <div className="flex justify-end">
            <BtnGhost
              type="button"
              onClick={() => setShowBulkAdd(true)}
              className="h-9 px-3 text-sm"
            >
              <Layers className="h-4 w-4" /> Add Multiple
            </BtnGhost>
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
            productName={productName}
            onClose={handleClose}
          />
        )}
      </div>
    </Modal>
  );
};

export default VariationManagerModal;
