import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { 
  Grid, Plus, X, Loader2, CheckCircle, AlertCircle, 
  Search, Package, Info, Trash2
} from 'lucide-react';
import { productModifierGroupAPI, modifierGroupAPI } from '../services/api';
import { fetchModifierGroups } from '../store/modifierGroupSlice';

const ModifierGroupAssignmentModal = ({ 
  isOpen, 
  onClose, 
  restaurantUuid, 
  productUuid, 
  productName 
}) => {
  const dispatch = useDispatch();
  const { modifierGroups } = useSelector((state) => state.modifierGroups);
  
  const [loading, setLoading] = useState(false);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleAssignGroup = async (modifierGroupUuid) => {
    try {
      setActionLoading(modifierGroupUuid);
      setError(null);
      await productModifierGroupAPI.assign(restaurantUuid, productUuid, modifierGroupUuid);
      setSuccess('Modifier group assigned successfully');
      await fetchAssignedGroups();
    } catch (err) {
      console.error('Error assigning modifier group:', err);
      setError(err.response?.data?.message || 'Failed to assign modifier group');
    } finally {
      setActionLoading(null);
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

  const handleClose = () => {
    setSearchTerm('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  // Filter modifier groups based on search term
  const filteredGroups = modifierGroups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate assigned and available groups
  const assignedGroupUuids = new Set(assignedGroups.map(g => g.modifierGroupUuid));
  const availableGroups = filteredGroups.filter(g => !assignedGroupUuids.has(g.modifierGroupUuid));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-indigo-500" />
          <span>Manage Modifier Groups - {productName}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Modifier Groups</p>
              <p>Assign modifier groups to this product to allow customers to customize their order (e.g., toppings, sizes, add-ons). You can assign multiple modifier groups to a single product.</p>
            </div>
          </div>
        </div>

        {/* Assigned Modifier Groups Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Assigned Modifier Groups ({assignedGroups.length})
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : assignedGroups.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No modifier groups assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Search and add modifier groups from below</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedGroups.map((group) => (
                <div 
                  key={group.modifierGroupUuid}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800">{group.name}</h5>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant={group.isRequired ? 'warning' : 'info'} className="text-xs">
                          {group.isRequired ? 'Required' : 'Optional'}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {group.selectionType === 'SINGLE' ? 'Single Select' : 'Multiple Select'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveGroup(group.modifierGroupUuid)}
                      disabled={actionLoading === group.modifierGroupUuid}
                    >
                      {actionLoading === group.modifierGroupUuid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Selection: Min {group.minSelection} / Max {group.maxSelection}</p>
                    {group.modifiers && group.modifiers.length > 0 && (
                      <p className="text-slate-500">{group.modifiers.length} modifiers available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Modifier Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              Available Modifier Groups ({availableGroups.length})
            </h4>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search modifier groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Groups List */}
          {availableGroups.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {searchTerm ? 'No modifier groups found' : 'All modifier groups are already assigned'}
              </p>
              {searchTerm && (
                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
              <div className="divide-y divide-slate-100">
                {availableGroups.map((group) => (
                  <div 
                    key={group.modifierGroupUuid}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-800 mb-1">{group.name}</h5>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant={group.isRequired ? 'warning' : 'info'} className="text-xs">
                            {group.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            {group.selectionType === 'SINGLE' ? 'Single Select' : 'Multiple Select'}
                          </Badge>
                          <Badge variant={group.isActive ? 'success' : 'danger'} className="text-xs">
                            {group.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          Selection: Min {group.minSelection} / Max {group.maxSelection}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                        onClick={() => handleAssignGroup(group.modifierGroupUuid)}
                        disabled={actionLoading === group.modifierGroupUuid}
                      >
                        {actionLoading === group.modifierGroupUuid ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-1" /> Add</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <strong>Tip:</strong> You can create new modifier groups in the Modifier Management section, then come back here to assign them to products.
        </div>
      </div>
    </Modal>
  );
};

export default ModifierGroupAssignmentModal;
