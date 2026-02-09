# Role-Based Access Control (RBAC) for Table Management

## Overview
Implemented role-based table fetching to match backend API permissions:
- **MANAGER/OWNER/ADMIN**: Access all tables across all restaurants with pagination
- **WAITER**: Access only tables from their assigned restaurant

## Backend API Endpoints

### 1. Get Table by UUID
```java
@PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
@GetMapping("/{tableUuid}")
```
- **Access**: WAITER, MANAGER, OWNER, ADMIN
- **Returns**: Single `TableResponseDto`
- **Use Case**: View specific table details

### 2. Get All Tables (Paginated)
```java
@PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
@GetMapping
```
- **Access**: MANAGER, OWNER, ADMIN only
- **Parameters**: `page`, `size`, `status` (optional)
- **Returns**: `Page<TableResponseDto>`
- **Use Case**: Admin dashboard, multi-restaurant management

## Frontend Implementation

### Files Modified

#### 1. **TableManagement.jsx** - Main Component

**Added**:
- `userRole` from Redux store
- `pagination` selector
- `hasManagerAccess` computed property
- Role-based table fetching logic
- Pagination controls for manager view
- Restaurant name display on table cards

**Role-Based Fetching**:
```javascript
useEffect(() => {
  if (hasManagerAccess) {
    // MANAGER/OWNER/ADMIN: Fetch all tables with pagination
    dispatch(getAllTables({ 
      page: pagination.page, 
      size: pagination.size, 
      status: filters.status 
    }));
  } else if (activeRestaurantId) {
    // WAITER: Fetch only restaurant-specific tables
    dispatch(getTablesByRestaurant(activeRestaurantId));
  }
}, [activeRestaurantId, dispatch, hasManagerAccess, pagination.page, pagination.size, filters.status]);
```

#### 2. **tableSlice.js** - Redux Slice

**Already Implemented**:
- ✅ `getAllTables` thunk for paginated table fetching
- ✅ `getTablesByRestaurant` thunk for restaurant-specific tables
- ✅ Pagination state management
- ✅ Proper UUID field handling (`tableUuid`)

## TableResponseDto Structure

```typescript
interface TableResponseDto {
  tableUuid: string;
  tableNumber: string;
  sectionName: string;
  capacity: number;
  minCapacity: number;
  status: 'VACANT' | 'OCCUPIED' | 'BILLED' | 'DIRTY' | 'RESERVED';
  restaurantUuid: string;
  restaurantName: string;  // ← Shows in manager view
  currentOrder?: {
    orderId: string;
    totalAmount: number;
    elapsedMinutes: number;
  };
  currentWaiterUuid?: string;
  currentWaiterName?: string;
  currentPax?: number;
  seatedAt?: string;
  posX: number;
  posY: number;
  shape: string;
  isActive: boolean;
  isMerged: boolean;
  mergedWithTableIds?: string;
  createdAt: string;
  updatedAt: string;
}
```

## UI Features

### Manager View (MANAGER/OWNER/ADMIN)
1. **Badge Indicator**: Shows role and "All Restaurants" label
2. **Restaurant Name**: Displays on each table card (bottom overlay)
3. **Pagination Controls**:
   - Previous/Next buttons
   - Page number buttons (showing 5 pages at a time)
   - Total count display
   - Disabled states during loading
4. **Global Filters**: Status filter works across all restaurants

### Waiter View
1. **Restaurant-Specific**: Only sees tables from assigned restaurant
2. **No Pagination**: All tables loaded at once
3. **Standard Filters**: Section and status filters work locally

## Pagination Logic

**Smart Page Display**:
```javascript
// Shows 5 page buttons, centered on current page
const pageNum = pagination.page < 3 ? i : 
               pagination.page >= pagination.totalPages - 3 ? 
               pagination.totalPages - 5 + i : 
               pagination.page - 2 + i;
```

**Page Info Display**:
```
Showing 1 to 20 of 156 tables
[Previous] [1] [2] [3] [4] [5] [Next]
```

## Security Considerations

### Frontend
- ✅ Role-based API selection
- ✅ Conditional UI rendering
- ✅ Proper state management per role
- ⚠️ Not a security boundary (backend validates)

### Backend
- ✅ `@PreAuthorize` annotations on endpoints
- ✅ Permission level validation
- ✅ Role-based data filtering

## Testing Checklist

### Manager/Owner/Admin Users
- [ ] Can access TableManagement page
- [ ] See "MANAGER/OWNER/ADMIN View - All Restaurants" badge
- [ ] Tables from all restaurants are visible
- [ ] Restaurant name shows on each table card
- [ ] Pagination controls appear when > 20 tables
- [ ] Page navigation works correctly
- [ ] Status filter triggers re-fetch
- [ ] Can see total table count
- [ ] Previous/Next buttons enabled/disabled correctly

### Waiter Users
- [ ] Can access TableManagement page
- [ ] Only see tables from assigned restaurant
- [ ] No role badge displayed
- [ ] No restaurant name on cards (redundant)
- [ ] No pagination controls
- [ ] All tables load at once
- [ ] Status and section filters work
- [ ] Can perform allowed operations (status update)

### API Integration
- [ ] `getAllTables` called for MANAGER/OWNER/ADMIN
- [ ] `getTablesByRestaurant` called for WAITER
- [ ] Pagination parameters passed correctly
- [ ] Status filter parameter included
- [ ] Response properly handled in Redux store
- [ ] Table cards render with correct data
- [ ] Restaurant name from DTO displayed correctly

### Edge Cases
- [ ] User with no role defaults to WAITER behavior
- [ ] Empty result set handled gracefully
- [ ] Single page of results (no pagination controls)
- [ ] Network errors show error message
- [ ] Loading states prevent double-fetching
- [ ] Status transitions still validated

## API Call Examples

### Manager Fetching All Tables
```javascript
// Request
GET /api/v1/tables?page=0&size=20&status=OCCUPIED

// Redux Dispatch
dispatch(getAllTables({ page: 0, size: 20, status: 'OCCUPIED' }))

// Response (Page<TableResponseDto>)
{
  "content": [
    {
      "tableUuid": "...",
      "tableNumber": "T12",
      "restaurantName": "FoodOs - Ahmedabad",  // ← Important for manager view
      "status": "OCCUPIED",
      ...
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 156,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

### Waiter Fetching Restaurant Tables
```javascript
// Request
GET /api/v1/tables/restaurant/{restaurantUuid}

// Redux Dispatch
dispatch(getTablesByRestaurant(activeRestaurantId))

// Response (Array<TableResponseDto>)
[
  {
    "tableUuid": "...",
    "tableNumber": "T12",
    "restaurantName": "FoodOs - Ahmedabad",
    "status": "OCCUPIED",
    ...
  }
]
```

## Performance Considerations

### Manager View
- **Lazy Loading**: Tables fetched page by page (20 per page)
- **On-Demand**: Only current page data in memory
- **Filter Optimization**: Re-fetches when filter changes
- **Scalability**: Handles 1000+ tables efficiently

### Waiter View
- **Single Request**: All restaurant tables loaded once
- **Client-Side Filtering**: Fast filtering without API calls
- **Typical Size**: 10-50 tables per restaurant
- **Instant Response**: No pagination delays

## Future Enhancements

1. **Search Functionality**: Search by table number, section, or restaurant
2. **Sorting**: Sort by status, capacity, table number
3. **Export**: Download table data as CSV/Excel
4. **Real-Time Updates**: WebSocket for live status changes
5. **Bulk Operations**: Apply actions to multiple tables
6. **Advanced Filters**: Date ranges, waiter assignment, occupancy duration
7. **Restaurant Selector**: Manager can focus on specific restaurant
8. **Analytics Dashboard**: Per-restaurant utilization metrics

## Migration Notes

**Backward Compatibility**: 
- Existing waiter workflows unchanged
- No breaking changes to API contracts
- Redux state structure remains the same
- All existing features preserved

**Database Impact**: None (read-only operations)

**Rollback Plan**: 
1. Remove `hasManagerAccess` conditional
2. Revert to `getTablesByRestaurant` for all users
3. Hide pagination controls

## Documentation References

- Backend API: `/api/v1/tables` (TableController)
- Permission Evaluator: `@permissionEvaluator.hasPermissionLevel`
- Frontend Redux: `src/store/tableSlice.js`
- UI Component: `src/pages/POS/TableManagement.jsx`
- Auth Utils: `src/store/authSlice.js`
