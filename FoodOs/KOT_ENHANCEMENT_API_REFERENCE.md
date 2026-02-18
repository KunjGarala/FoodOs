# KOT Enhancement - API Quick Reference

## New Fields Overview

| Entity | Field | Type | Max Length | Description |
|--------|-------|------|------------|-------------|
| KitchenOrderTicket | spicyLevel | Enum | - | Overall spicy level for KOT |
| KitchenOrderTicket | totalQuantity | Decimal | - | Auto-calculated total of all items |
| KitchenOrderTicket | kitchenNotes | Text | 1000 | Kitchen-specific instructions |
| KitchenOrderTicket | orderNotes | Text | 1000 | General order notes |
| KotItem | spicyLevel | Enum | - | Item-specific spicy level |
| KotItem | kitchenNotes | Text | 1000 | Kitchen notes for item |
| KotItem | orderNotes | Text | 1000 | Order notes for item |
| OrderItem | spicyLevel | Enum | - | Customer's spicy preference |
| OrderItem | kitchenNotes | Text | 1000 | Preparation instructions |
| OrderItem | orderNotes | Text | 1000 | General item notes |

## Spicy Level Enum Values

```java
public enum SpicyLevel {
    NONE,        // No spice
    MILD,        // Slightly spicy
    MEDIUM,      // Moderately spicy
    HOT,         // Very spicy
    EXTRA_HOT    // Extremely spicy
}
```

## API Endpoints

### 1. Create Order with Spicy Level

**POST** `/api/v1/orders`

**New Fields in Request**:
```json
{
  "items": [
    {
      "productUuid": "string",
      "quantity": 0,
      "spicyLevel": "NONE|MILD|MEDIUM|HOT|EXTRA_HOT",  // NEW
      "kitchenNotes": "string",                          // NEW
      "orderNotes": "string"                             // NEW
    }
  ]
}
```

**Example**:
```json
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
      "kitchenNotes": "Well done, customer preference",
      "orderNotes": "VIP customer - special attention"
    }
  ]
}
```

---

### 2. Send KOT with Notes

**POST** `/api/v1/orders/{orderUuid}/kot`

**New Fields in Request**:
```json
{
  "orderItemUuids": ["string"],
  "printerTarget": "string",
  "kitchenStation": "string",
  "specialInstructions": "string",
  "spicyLevel": "NONE|MILD|MEDIUM|HOT|EXTRA_HOT",  // NEW
  "totalQuantity": 0,                                // NEW (optional, auto-calculated)
  "kitchenNotes": "string",                          // NEW
  "orderNotes": "string",                            // NEW
  "isUrgent": false,
  "priority": 0
}
```

**Example**:
```json
{
  "orderItemUuids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ],
  "spicyLevel": "HOT",
  "kitchenNotes": "Rush order - customer waiting",
  "orderNotes": "Birthday celebration - complimentary dessert",
  "printerTarget": "KITCHEN_MAIN",
  "kitchenStation": "HOT_KITCHEN",
  "isUrgent": true,
  "priority": 5
}
```

---

### 3. Get Order Response

**GET** `/api/v1/orders/{orderUuid}`

**New Fields in Response**:
```json
{
  "orderUuid": "string",
  "items": [
    {
      "orderItemUuid": "string",
      "productName": "string",
      "quantity": 0,
      "spicyLevel": "MEDIUM",           // NEW
      "kitchenNotes": "string",         // NEW
      "orderNotes": "string"            // NEW
    }
  ]
}
```

---

### 4. Get KOT Response

**GET** `/api/v1/orders/{orderUuid}/kots`

**New Fields in Response**:
```json
{
  "kotUuid": "string",
  "kotNumber": "string",
  "spicyLevel": "HOT",                   // NEW
  "totalQuantity": 5.0,                   // NEW
  "kitchenNotes": "string",              // NEW
  "orderNotes": "string",                // NEW
  "kotItems": [
    {
      "kotItemUuid": "string",
      "productName": "string",
      "quantity": 2.0,
      "spicyLevel": "MEDIUM",            // NEW
      "kitchenNotes": "string",          // NEW
      "orderNotes": "string"             // NEW
    }
  ]
}
```

---

## Field Validation Rules

### Spicy Level
- **Type**: String (Enum)
- **Values**: `NONE`, `MILD`, `MEDIUM`, `HOT`, `EXTRA_HOT`
- **Required**: No (Optional)
- **Default**: null
- **Case Sensitive**: Yes (must be uppercase)

### Kitchen Notes
- **Type**: String (Text)
- **Max Length**: 1000 characters
- **Required**: No (Optional)
- **Validation**: `@Size(max = 1000)`
- **Example**: "Customer allergic to nuts - avoid cross contamination"

### Order Notes
- **Type**: String (Text)
- **Max Length**: 1000 characters
- **Required**: No (Optional)
- **Validation**: `@Size(max = 1000)`
- **Example**: "Regular customer - knows preference"

### Total Quantity
- **Type**: BigDecimal
- **Precision**: 10,3 (10 digits total, 3 after decimal)
- **Required**: No (Auto-calculated)
- **Calculation**: Sum of all KOT item quantities
- **Example**: 7.500

---

## Complete Request Examples

### Example 1: Simple Order with Spicy Level
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
      "spicyLevel": "MILD"
    }
  ]
}
```

### Example 2: Order with All New Fields
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
      "spicyLevel": "HOT",
      "itemNotes": "Extra crispy",
      "kitchenNotes": "Customer prefers well-done. Previous order was undercooked.",
      "orderNotes": "Regular customer - Table 5 preference"
    },
    {
      "productUuid": "550e8400-e29b-41d4-a716-446655440004",
      "quantity": 1,
      "spicyLevel": "MEDIUM",
      "kitchenNotes": "Add extra vegetables",
      "orderNotes": "Health-conscious customer"
    }
  ]
}
```

### Example 3: KOT with Mixed Spicy Levels
```json
POST /api/v1/orders/{orderUuid}/kot
{
  "orderItemUuids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012"
  ],
  "spicyLevel": "MEDIUM",
  "kitchenNotes": "Table 7 - Serving together. Items have individual spice levels.",
  "orderNotes": "Anniversary dinner - ensure presentation",
  "printerTarget": "KITCHEN_MAIN",
  "kitchenStation": "HOT_KITCHEN",
  "isUrgent": false,
  "priority": 3
}
```

### Example 4: Backward Compatible Request (No New Fields)
```json
POST /api/v1/orders
{
  "restaurantUuid": "550e8400-e29b-41d4-a716-446655440000",
  "orderType": "DINE_IN",
  "tableUuid": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "productUuid": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 2
    }
  ]
}
```
*Note: This will work exactly as before - new fields will be null*

---

## Response Examples

### Example 1: Order Response with New Fields
```json
{
  "orderUuid": "550e8400-e29b-41d4-a716-446655440020",
  "orderNumber": "ORD-001",
  "orderType": "DINE_IN",
  "status": "OPEN",
  "tableNumber": "T-05",
  "items": [
    {
      "orderItemUuid": "550e8400-e29b-41d4-a716-446655440021",
      "productUuid": "550e8400-e29b-41d4-a716-446655440003",
      "productName": "Chicken Curry",
      "quantity": 2.0,
      "unitPrice": 250.00,
      "lineTotal": 500.00,
      "spicyLevel": "HOT",
      "itemNotes": "Extra crispy",
      "kitchenNotes": "Customer prefers well-done",
      "orderNotes": "Regular customer",
      "kotStatus": "PENDING"
    }
  ]
}
```

### Example 2: KOT Response with New Fields
```json
{
  "kotUuid": "550e8400-e29b-41d4-a716-446655440030",
  "kotNumber": "KOT-001",
  "orderNumber": "ORD-001",
  "tableNumber": "T-05",
  "kotDate": "2026-02-18",
  "kotTime": "2026-02-18 14:30:00",
  "kotType": "NEW",
  "status": "SENT",
  "spicyLevel": "MEDIUM",
  "totalQuantity": 5.0,
  "kitchenNotes": "Rush order - customer waiting",
  "orderNotes": "Birthday celebration",
  "kotItems": [
    {
      "kotItemUuid": "550e8400-e29b-41d4-a716-446655440031",
      "productName": "Chicken Curry",
      "variationName": "Large",
      "quantity": 2.0,
      "spicyLevel": "HOT",
      "modifiersText": "Extra Cheese, No Onions",
      "notes": "Extra crispy",
      "kitchenNotes": "Well done - customer preference",
      "orderNotes": "VIP customer",
      "isReady": false,
      "isCancelled": false
    },
    {
      "kotItemUuid": "550e8400-e29b-41d4-a716-446655440032",
      "productName": "Fried Rice",
      "quantity": 3.0,
      "spicyLevel": "MILD",
      "kitchenNotes": "Light oil, extra vegetables",
      "orderNotes": "Health conscious",
      "isReady": false,
      "isCancelled": false
    }
  ],
  "totalItemsCount": 2,
  "isUrgent": false,
  "priority": 0,
  "printedAt": "2026-02-18 14:30:05",
  "createdAt": "2026-02-18 14:30:00"
}
```

---

## Error Responses

### Invalid Spicy Level
```json
{
  "status": 400,
  "message": "Invalid spicy level. Allowed values: NONE, MILD, MEDIUM, HOT, EXTRA_HOT"
}
```

### Kitchen Notes Too Long
```json
{
  "status": 400,
  "message": "Kitchen notes cannot exceed 1000 characters"
}
```

### Order Notes Too Long
```json
{
  "status": 400,
  "message": "Order notes cannot exceed 1000 characters"
}
```

---

## Common Use Cases

### Use Case 1: Customer with Spice Preference
**Scenario**: Regular customer always orders medium spicy
```json
{
  "items": [{
    "productUuid": "...",
    "quantity": 1,
    "spicyLevel": "MEDIUM",
    "orderNotes": "Regular customer preference"
  }]
}
```

### Use Case 2: Dietary Restrictions
**Scenario**: Customer has nut allergy
```json
{
  "items": [{
    "productUuid": "...",
    "quantity": 1,
    "kitchenNotes": "ALLERGY ALERT: No nuts - risk of cross contamination",
    "orderNotes": "Customer has severe nut allergy"
  }]
}
```

### Use Case 3: Special Occasion
**Scenario**: Birthday celebration
```json
{
  "orderItemUuids": ["..."],
  "kitchenNotes": "Birthday order - add candle to dessert",
  "orderNotes": "50th birthday celebration - VIP service"
}
```

### Use Case 4: Rush Order
**Scenario**: Customer in a hurry
```json
{
  "orderItemUuids": ["..."],
  "kitchenNotes": "RUSH ORDER - Customer needs food in 15 minutes",
  "isUrgent": true,
  "priority": 10
}
```

### Use Case 5: Custom Preparation
**Scenario**: Specific cooking requirements
```json
{
  "items": [{
    "productUuid": "...",
    "quantity": 1,
    "spicyLevel": "HOT",
    "kitchenNotes": "Extra crispy, less oil, well-done",
    "orderNotes": "Customer very particular about doneness"
  }]
}
```

---

## Integration Notes

1. **All fields are optional** - Existing integrations will continue to work
2. **Null handling** - Fields can be null, ensure UI handles gracefully
3. **Enum validation** - Spicy level must match exact enum value (uppercase)
4. **Character limits** - Validate on client side before submission
5. **Auto-calculation** - totalQuantity is calculated server-side, don't need to send it
6. **Inheritance** - Item-level spicy level can differ from KOT-level spicy level

---

## Tips for Frontend Integration

1. **Dropdown for Spicy Level**: Provide enum values as options
2. **Text Areas for Notes**: Use multi-line input fields
3. **Character Counter**: Show remaining characters for notes fields
4. **Default Values**: Don't send fields if user doesn't fill them
5. **Display Logic**: Show spicy level icons (🌶️) based on enum value
6. **Validation**: Client-side validation before API call
7. **Tooltips**: Help text explaining kitchen notes vs order notes

---

## Migration Impact

- **Database**: New columns added (nullable)
- **Existing Data**: No impact - existing records work as-is
- **API**: Backward compatible - optional fields
- **Client**: Update optional - works without changes

