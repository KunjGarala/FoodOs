/**
 * Table Status Management Utilities
 * 
 * This file contains utilities for managing table status transitions
 * matching the backend validation rules.
 * 
 * Status Transition Rules (matching backend BusinessException validation):
 * - VACANT → OCCUPIED, RESERVED
 * - OCCUPIED → BILLED, VACANT
 * - BILLED → DIRTY, VACANT
 * - DIRTY → VACANT
 * - RESERVED → OCCUPIED, VACANT
 */

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

export const TABLE_STATUS = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  BILLED: 'BILLED',
  DIRTY: 'DIRTY',
  RESERVED: 'RESERVED',
};

export const VALID_STATUS_TRANSITIONS = {
  [TABLE_STATUS.VACANT]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.RESERVED],
  [TABLE_STATUS.OCCUPIED]: [TABLE_STATUS.BILLED, TABLE_STATUS.VACANT],
  [TABLE_STATUS.BILLED]: [TABLE_STATUS.DIRTY, TABLE_STATUS.VACANT],
  [TABLE_STATUS.DIRTY]: [TABLE_STATUS.VACANT],
  [TABLE_STATUS.RESERVED]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.VACANT],
};

// ─────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────

/**
 * Get valid next statuses for a given current status
 * @param {string} currentStatus - Current table status
 * @returns {Array<string>} Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if a status transition is valid
 * @param {string} currentStatus - Current table status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} Whether the transition is valid
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return validStatuses.includes(newStatus);
};

/**
 * Get human-readable status label
 * @param {string} status - Table status
 * @returns {string} Human-readable label
 */
export const getStatusLabel = (status) => {
  const labels = {
    [TABLE_STATUS.VACANT]: 'Available',
    [TABLE_STATUS.OCCUPIED]: 'Occupied',
    [TABLE_STATUS.BILLED]: 'Billed',
    [TABLE_STATUS.DIRTY]: 'Needs Cleaning',
    [TABLE_STATUS.RESERVED]: 'Reserved',
  };
  return labels[status] || status;
};

/**
 * Get status color classes for UI
 * @param {string} status - Table status
 * @returns {Object} Object with background, text, and border colors
 */
export const getStatusColors = (status) => {
  const colors = {
    [TABLE_STATUS.VACANT]: {
      bg: 'bg-white',
      text: 'text-slate-600',
      border: 'border-slate-300',
      badge: 'bg-slate-100 text-slate-700',
    },
    [TABLE_STATUS.OCCUPIED]: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-900',
      border: 'border-yellow-400',
      badge: 'bg-yellow-500 text-white',
    },
    [TABLE_STATUS.BILLED]: {
      bg: 'bg-green-100',
      text: 'text-green-900',
      border: 'border-green-400',
      badge: 'bg-green-500 text-white',
    },
    [TABLE_STATUS.DIRTY]: {
      bg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-400',
      badge: 'bg-red-500 text-white',
    },
    [TABLE_STATUS.RESERVED]: {
      bg: 'bg-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-400',
      badge: 'bg-blue-500 text-white',
    },
  };
  return colors[status] || colors[TABLE_STATUS.VACANT];
};

/**
 * Validate table status transition with detailed error message
 * @param {string} currentStatus - Current table status
 * @param {string} newStatus - Desired new status
 * @throws {Error} If transition is invalid
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    const validStatuses = getValidNextStatuses(currentStatus);
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions: ${validStatuses.join(', ') || 'None'}`
    );
  }
};

/**
 * Get status workflow description
 * @param {string} status - Table status
 * @returns {string} Description of what to do next
 */
export const getStatusWorkflowDescription = (status) => {
  const descriptions = {
    [TABLE_STATUS.VACANT]: 'Table is ready for guests. Mark as OCCUPIED when guests arrive or RESERVED for bookings.',
    [TABLE_STATUS.OCCUPIED]: 'Guests are seated. Process payment and mark as BILLED, or mark as VACANT if they leave.',
    [TABLE_STATUS.BILLED]: 'Payment processed. Mark as DIRTY if table needs cleaning, or VACANT if already clean.',
    [TABLE_STATUS.DIRTY]: 'Table needs cleaning. Mark as VACANT once cleaned.',
    [TABLE_STATUS.RESERVED]: 'Table is reserved. Mark as OCCUPIED when guests arrive or VACANT to cancel reservation.',
  };
  return descriptions[status] || '';
};

/**
 * Get all table statuses as array
 * @returns {Array<string>} All valid table statuses
 */
export const getAllStatuses = () => {
  return Object.values(TABLE_STATUS);
};

/**
 * Check if status requires additional fields
 * @param {string} status - Table status
 * @returns {Object} Required fields configuration
 */
export const getRequiredFieldsForStatus = (status) => {
  return {
    [TABLE_STATUS.VACANT]: {
      currentPax: false,
      waiterUuid: false,
      currentOrderId: false,
    },
    [TABLE_STATUS.OCCUPIED]: {
      currentPax: true,
      waiterUuid: true,
      currentOrderId: false,
    },
    [TABLE_STATUS.BILLED]: {
      currentPax: false,
      waiterUuid: false,
      currentOrderId: true,
    },
    [TABLE_STATUS.DIRTY]: {
      currentPax: false,
      waiterUuid: false,
      currentOrderId: false,
    },
    [TABLE_STATUS.RESERVED]: {
      currentPax: true,
      waiterUuid: false,
      currentOrderId: false,
    },
  }[status] || { currentPax: false, waiterUuid: false, currentOrderId: false };
};
