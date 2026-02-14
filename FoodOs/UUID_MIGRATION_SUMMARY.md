# UUID Migration Summary - Order APIs

## Overview
Successfully migrated all Order Management APIs from using database IDs (Long) to using UUIDs (String) for `restaurantId` and `tableId` parameters.

## Changes Made

### 1. OrderController.java
Updated all API endpoints to accept UUID parameters instead of database IDs:

#### Restaurant UUID Changes:
- `GET /api/v1/orders/restaurant/{restaurantUuid}` - List orders by restaurant
- `GET /api/v1/orders/restaurant/{restaurantUuid}/active` - Get active orders
- `GET /api/v1/orders/restaurant/{restaurantUuid}/kitchen` - Get kitchen orders
- `GET /api/v1/orders/restaurant/{restaurantUuid}/date/{date}` - Get orders by date
- `GET /api/v1/orders/restaurant/{restaurantUuid}/pending-payments` - Get orders with pending payments
- `GET /api/v1/orders/restaurant/{restaurantUuid}/stats/count` - Get total orders count
- `GET /api/v1/orders/restaurant/{restaurantUuid}/stats/sales` - Get total sales
- `GET /api/v1/orders/restaurant/{restaurantUuid}/stats/average` - Get average order value
- `GET /api/v1/orders/search?restaurantUuid={uuid}&searchTerm={term}` - Search orders

#### Table UUID Changes:
- `GET /api/v1/orders/table/{tableUuid}/active` - Get active order by table

### 2. OrderService.java
Updated interface method signatures:

```java
// Query Operations
Page<OrderResponse> getOrdersByRestaurant(String restaurantUuid, Pageable pageable);
Page<OrderResponse> getOrdersByRestaurantAndStatus(String restaurantUuid, OrderStatus status, Pageable pageable);
List<OrderResponse> getOrdersByRestaurantAndDate(String restaurantUuid, LocalDate orderDate);
List<OrderResponse> getOrdersByRestaurantDateAndType(String restaurantUuid, LocalDate orderDate, OrderType orderType);
Page<OrderResponse> searchOrders(String restaurantUuid, String searchTerm, Pageable pageable);
List<OrderResponse> getActiveOrders(String restaurantUuid);
List<OrderResponse> getKitchenOrders(String restaurantUuid);
List<OrderResponse> getOrdersWithPendingPayments(String restaurantUuid);
OrderResponse getActiveOrderByTable(String tableUuid);

// Statistics
Long getTotalOrdersCount(String restaurantUuid, LocalDate orderDate);
BigDecimal getTotalSales(String restaurantUuid, LocalDate orderDate);
BigDecimal getAverageOrderValue(String restaurantUuid, LocalDate orderDate);
```

### 3. OrderServiceImpl.java
Updated all implementation methods to use new UUID-based repository methods:

- `getOrdersByRestaurant()` - Now uses `findByRestaurantUuid()`
- `getOrdersByRestaurantAndStatus()` - Now uses `findByRestaurantUuidAndStatusIn()`
- `getActiveOrders()` - Now uses `findActiveOrdersByRestaurantUuid()`
- `getOrdersByRestaurantAndDate()` - Now uses `findByRestaurantUuidAndOrderDate()`
- `getOrdersByRestaurantDateAndType()` - Now uses `findByRestaurantUuidAndOrderTypeAndOrderDate()`
- `searchOrders()` - Now uses `searchOrdersByRestaurantUuid()`
- `getKitchenOrders()` - Now uses `findKitchenOrdersByRestaurantUuid()`
- `getOrdersWithPendingPayments()` - Now uses `findOrdersWithPendingPaymentsByRestaurantUuid()`
- `getActiveOrderByTable()` - Now uses `findActiveOrderByTableUuid()`
- `getTotalOrdersCount()` - Now uses `countOrdersByRestaurantUuidAndDate()`
- `getTotalSales()` - Now uses `calculateTotalSalesByRestaurantUuidAndDate()`
- `getAverageOrderValue()` - Now uses `calculateAverageOrderValueByRestaurantUuid()`

### 4. OrderRepository.java
Added new UUID-based query methods (kept old ID-based methods for backward compatibility):

#### Restaurant UUID Queries:
```java
@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.isDeleted = false")
Page<Order> findByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid, Pageable pageable);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.status IN :statuses AND o.isDeleted = false ORDER BY o.orderTime DESC")
Page<Order> findByRestaurantUuidAndStatusIn(@Param("restaurantUuid") String restaurantUuid, @Param("statuses") List<OrderStatus> statuses, Pageable pageable);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.orderDate = :orderDate AND o.isDeleted = false ORDER BY o.orderTime DESC")
List<Order> findByRestaurantUuidAndOrderDate(@Param("restaurantUuid") String restaurantUuid, @Param("orderDate") LocalDate orderDate);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.orderType = :orderType AND o.orderDate = :orderDate AND o.isDeleted = false")
List<Order> findByRestaurantUuidAndOrderTypeAndOrderDate(@Param("restaurantUuid") String restaurantUuid, @Param("orderType") OrderType orderType, @Param("orderDate") LocalDate orderDate);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND " +
       "(LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
       "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
       "LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
       "o.isDeleted = false ORDER BY o.orderTime DESC")
Page<Order> searchOrdersByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid, @Param("searchTerm") String searchTerm, Pageable pageable);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.balanceAmount > 0 AND o.status NOT IN ('CANCELLED', 'VOID') AND o.isDeleted = false ORDER BY o.orderTime DESC")
List<Order> findOrdersWithPendingPaymentsByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.status IN ('OPEN', 'KOT_SENT', 'IN_PROGRESS', 'READY', 'SERVED', 'BILLED') AND o.isDeleted = false ORDER BY o.orderTime ASC")
List<Order> findActiveOrdersByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);

@Query("SELECT o FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.status IN ('KOT_SENT', 'IN_PROGRESS', 'READY') AND o.isDeleted = false ORDER BY o.orderTime ASC")
List<Order> findKitchenOrdersByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);
```

#### Statistics Queries:
```java
@Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.orderDate = :orderDate AND o.status <> 'CANCELLED' AND o.isDeleted = false")
Long countOrdersByRestaurantUuidAndDate(@Param("restaurantUuid") String restaurantUuid, @Param("orderDate") LocalDate orderDate);

@Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.orderDate = :orderDate AND o.status IN ('PAID', 'COMPLETED') AND o.isDeleted = false")
BigDecimal calculateTotalSalesByRestaurantUuidAndDate(@Param("restaurantUuid") String restaurantUuid, @Param("orderDate") LocalDate orderDate);

@Query("SELECT AVG(o.totalAmount) FROM Order o WHERE o.restaurant.restaurantUuid = :restaurantUuid AND o.orderDate = :orderDate AND o.status IN ('PAID', 'COMPLETED') AND o.isDeleted = false")
BigDecimal calculateAverageOrderValueByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid, @Param("orderDate") LocalDate orderDate);
```

#### Table UUID Queries:
```java
@Query("SELECT o FROM Order o WHERE o.table.tableUuid = :tableUuid AND o.status NOT IN :excludeStatuses AND o.isDeleted = false")
Optional<Order> findActiveOrderByTableUuid(@Param("tableUuid") String tableUuid, @Param("excludeStatuses") List<OrderStatus> excludeStatuses);
```

## API Endpoint Examples

### Before (using IDs):
```
GET /api/v1/orders/restaurant/123/active
GET /api/v1/orders/table/456/active
GET /api/v1/orders/search?restaurantId=123&searchTerm=pizza
```

### After (using UUIDs):
```
GET /api/v1/orders/restaurant/550e8400-e29b-41d4-a716-446655440000/active
GET /api/v1/orders/table/660e8400-e29b-41d4-a716-446655440001/active
GET /api/v1/orders/search?restaurantUuid=550e8400-e29b-41d4-a716-446655440000&searchTerm=pizza
```

## Benefits

1. **Consistency**: All APIs now consistently use UUIDs across the system
2. **Security**: UUIDs don't expose internal database structure
3. **Decoupling**: Less dependency on database implementation details
4. **Scalability**: Better for distributed systems and microservices
5. **API Stability**: UUIDs remain constant even if data is migrated

## Backward Compatibility

The old ID-based repository methods have been **retained** to maintain backward compatibility with any internal services that might still use them. However, all public-facing APIs now exclusively use UUIDs.

## Testing Recommendations

1. Test all modified endpoints with valid UUIDs
2. Verify error handling for invalid UUID formats
3. Test pagination with UUID-based queries
4. Verify statistics endpoints return correct data
5. Test search functionality with restaurant UUIDs

## Notes

- All changes maintain the existing authorization and permission requirements
- No changes were made to the data model or database schema
- The Order entity still maintains internal relationships using database IDs
- Only the API layer now uses UUIDs for external communication

