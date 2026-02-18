# KOT and Order Item Enhancement - Spicy Level, Notes, and Quantity

## Summary
Enhanced the Kitchen Order Ticket (KOT) and Order Item entities with new fields for better kitchen management:
- **Spicy Level**: Track spiciness preferences (NONE, MILD, MEDIUM, HOT, EXTRA_HOT)
- **Kitchen Notes**: Special instructions specifically for the kitchen
- **Order Notes**: General order-level notes
- **Total Quantity**: Automatic calculation of total items in KOT

## Changes Made

### 1. New Enum Created
**File**: `SpicyLevel.java`
```
- NONE
- MILD
- MEDIUM
- HOT
- EXTRA_HOT
```

### 2. Entity Updates

#### KitchenOrderTicket Entity
Added fields:
- `spicyLevel` (SpicyLevel enum)
- `totalQuantity` (BigDecimal) - Automatically calculated
- `kitchenNotes` (TEXT)
- `orderNotes` (TEXT)

#### KotItem Entity
Added fields:
- `spicyLevel` (SpicyLevel enum)
- `kitchenNotes` (TEXT)
- `orderNotes` (TEXT)

#### OrderItem Entity
Added fields:
- `spicyLevel` (SpicyLevel enum)
- `kitchenNotes` (TEXT)
- `orderNotes` (TEXT)

### 3. DTO Updates

#### Request DTOs

**SendKotRequest**
- `spicyLevel`: Spicy level for the entire KOT
- `totalQuantity`: Total quantity (optional, auto-calculated if not provided)
- `kitchenNotes`: Kitchen-specific instructions
- `orderNotes`: General order notes

**OrderItemRequest**
- `spicyLevel`: Item-level spicy preference
- `kitchenNotes`: Kitchen notes for specific item
- `orderNotes`: Order notes for specific item

#### Response DTOs

**KotResponse**
- `spicyLevel`: Display spicy level
- `totalQuantity`: Total quantity in KOT
- `kitchenNotes`: Kitchen notes
- `orderNotes`: Order notes

**KotItemResponse**
- `spicyLevel`: Item spicy level
- `kitchenNotes`: Item kitchen notes
- `orderNotes`: Item order notes

**OrderItemResponse**
- `spicyLevel`: Item spicy level
- `kitchenNotes`: Item kitchen notes
- `orderNotes`: Item order notes

### 4. Mapper Updates

**OrderMapper Interface**
Updated mappings:
- `toKitchenOrderTicket()`: Maps new fields from SendKotRequest
- `toKotItem()`: Maps spicy level and notes from OrderItem to KotItem
- `toOrderItem()`: Maps new fields from OrderItemRequest

### 5. Service Logic Updates

**OrderServiceImpl.sendKot()**
Added automatic calculation of `totalQuantity`:
```java
BigDecimal totalQuantity = kot.getKotItems().stream()
    .map(KotItem::getQuantity)
    .filter(Objects::nonNull)
    .reduce(BigDecimal.ZERO, BigDecimal::add);
kot.setTotalQuantity(totalQuantity);
```

## Database Migration Required

### SQL for MySQL/MariaDB:
```sql
-- Add columns to kitchen_order_tickets table
ALTER TABLE kitchen_order_tickets 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN total_quantity DECIMAL(10,3),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;

-- Add columns to kot_items table
ALTER TABLE kot_items 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;

-- Add columns to order_items table
ALTER TABLE order_items 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;
```

### SQL for PostgreSQL:
```sql
-- Add columns to kitchen_order_tickets table
ALTER TABLE kitchen_order_tickets 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN total_quantity NUMERIC(10,3),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;

-- Add columns to kot_items table
ALTER TABLE kot_items 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;

-- Add columns to order_items table
ALTER TABLE order_items 
ADD COLUMN spicy_level VARCHAR(20),
ADD COLUMN kitchen_notes TEXT,
ADD COLUMN order_notes TEXT;
```

## API Usage Examples

### 1. Creating Order with Spicy Level
```json
POST /api/v1/orders
{
  "restaurantUuid": "550e8400-e29b-41d4-a716-446655440000",
  "orderType": "DINE_IN",
  "tableUuid": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "productUuid": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 2,
      "spicyLevel": "MEDIUM",
      "itemNotes": "Extra sauce",
      "kitchenNotes": "Customer prefers well-done",
      "orderNotes": "VIP customer"
    }
  ]
}
```

### 2. Sending KOT with Notes
```json
POST /api/v1/orders/{orderUuid}/kot
{
  "orderItemUuids": [
    "550e8400-e29b-41d4-a716-446655440010"
  ],
  "spicyLevel": "HOT",
  "kitchenNotes": "Rush order - prepare immediately",
  "orderNotes": "Birthday celebration",
  "printerTarget": "KITCHEN_MAIN",
  "isUrgent": true,
  "priority": 5
}
```

### 3. Response Example
```json
{
  "kotUuid": "550e8400-e29b-41d4-a716-446655440020",
  "kotNumber": "KOT-001",
  "orderNumber": "ORD-001",
  "spicyLevel": "HOT",
  "totalQuantity": 5.0,
  "kitchenNotes": "Rush order - prepare immediately",
  "orderNotes": "Birthday celebration",
  "kotItems": [
    {
      "kotItemUuid": "550e8400-e29b-41d4-a716-446655440021",
      "productName": "Chicken Curry",
      "quantity": 2.0,
      "spicyLevel": "MEDIUM",
      "kitchenNotes": "Customer prefers well-done",
      "orderNotes": "VIP customer"
    }
  ]
}
```

## Benefits

1. **Better Kitchen Communication**: Kitchen notes provide specific cooking instructions
2. **Customer Preferences**: Spicy level tracking ensures consistent preparation
3. **Order Management**: Order notes help track special circumstances
4. **Quantity Tracking**: Automatic total quantity calculation for inventory management
5. **Flexibility**: Fields are optional, backward compatible with existing orders

## Testing Checklist

- [ ] Create order with spicy level
- [ ] Create order with kitchen notes
- [ ] Create order with order notes
- [ ] Send KOT with spicy level
- [ ] Send KOT with notes
- [ ] Verify totalQuantity is calculated correctly
- [ ] Test KOT with multiple items having different spicy levels
- [ ] Verify response DTOs include all new fields
- [ ] Test null/empty values for optional fields
- [ ] Verify database columns are created properly

## Notes

- All new fields are **optional** to maintain backward compatibility
- `totalQuantity` in KOT is **auto-calculated** based on item quantities
- Spicy level can be set at **both order item level and KOT level**
- Kitchen notes are limited to **1000 characters**
- Order notes are limited to **1000 characters**
- Item notes remain at **500 characters** limit

## Files Modified

### Entities (3 files)
1. `org/foodos/order/entity/KitchenOrderTicket.java`
2. `org/foodos/order/entity/KotItem.java`
3. `org/foodos/order/entity/OrderItem.java`

### DTOs (5 files)
4. `org/foodos/order/dto/request/SendKotRequest.java`
5. `org/foodos/order/dto/request/OrderItemRequest.java`
6. `org/foodos/order/dto/response/KotResponse.java`
7. `org/foodos/order/dto/response/KotItemResponse.java`
8. `org/foodos/order/dto/response/OrderItemResponse.java`

### Mappers (1 file)
9. `org/foodos/order/mapper/OrderMapper.java`

### Services (1 file)
10. `org/foodos/order/service/impl/OrderServiceImpl.java`

### Enums (1 file - NEW)
11. `org/foodos/order/entity/enums/SpicyLevel.java`

**Total: 11 files (10 modified, 1 new)**

