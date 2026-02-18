# KOT Enhancement Testing Guide

## Prerequisites
1. Run the database migration: `database_migration_kot_enhancement.sql`
2. Restart the application to load new entity mappings
3. Have Postman or similar API testing tool ready

## Test Scenarios

### Test 1: Create Order with Spicy Level and Notes

**Endpoint**: `POST /api/v1/orders`

**Request Body**:
```json
{
  "restaurantUuid": "YOUR_RESTAURANT_UUID",
  "orderType": "DINE_IN",
  "tableUuid": "YOUR_TABLE_UUID",
  "items": [
    {
      "productUuid": "YOUR_PRODUCT_UUID",
      "quantity": 2,
      "spicyLevel": "MEDIUM",
      "itemNotes": "Extra sauce on the side",
      "kitchenNotes": "Customer allergic to peanuts - avoid cross contamination",
      "orderNotes": "First-time customer"
    },
    {
      "productUuid": "YOUR_PRODUCT_UUID_2",
      "quantity": 1,
      "spicyLevel": "HOT",
      "kitchenNotes": "Make extra crispy",
      "orderNotes": "Regular customer preference"
    }
  ]
}
```

**Expected Result**:
- Order created successfully
- Response includes spicy level for each item
- Notes are saved and returned in response

**Verify**:
```json
{
  "orderUuid": "...",
  "items": [
    {
      "spicyLevel": "MEDIUM",
      "itemNotes": "Extra sauce on the side",
      "kitchenNotes": "Customer allergic to peanuts - avoid cross contamination",
      "orderNotes": "First-time customer"
    }
  ]
}
```

---

### Test 2: Send KOT with Spicy Level and Notes

**Endpoint**: `POST /api/v1/orders/{orderUuid}/kot`

**Request Body**:
```json
{
  "orderItemUuids": [
    "ORDER_ITEM_UUID_1",
    "ORDER_ITEM_UUID_2"
  ],
  "spicyLevel": "HOT",
  "kitchenNotes": "Rush order for table 5 - birthday celebration",
  "orderNotes": "Customer is celebrating 50th birthday",
  "printerTarget": "KITCHEN_MAIN",
  "kitchenStation": "HOT_KITCHEN",
  "isUrgent": true,
  "priority": 5
}
```

**Expected Result**:
- KOT created successfully
- Total quantity automatically calculated
- All notes are included in KOT

**Verify**:
```json
{
  "kotUuid": "...",
  "kotNumber": "KOT-001",
  "spicyLevel": "HOT",
  "totalQuantity": 3.0,
  "kitchenNotes": "Rush order for table 5 - birthday celebration",
  "orderNotes": "Customer is celebrating 50th birthday",
  "kotItems": [
    {
      "productName": "Chicken Curry",
      "quantity": 2.0,
      "spicyLevel": "MEDIUM",
      "kitchenNotes": "Customer allergic to peanuts - avoid cross contamination"
    },
    {
      "productName": "Fried Rice",
      "quantity": 1.0,
      "spicyLevel": "HOT",
      "kitchenNotes": "Make extra crispy"
    }
  ]
}
```

---

### Test 3: Retrieve Order with New Fields

**Endpoint**: `GET /api/v1/orders/{orderUuid}`

**Expected Result**:
- All order items include spicy level and notes
- Data is consistent with what was submitted

**Verify**:
- Check each item has correct `spicyLevel`
- Check `kitchenNotes` and `orderNotes` are present
- Verify null values for items without these fields (backward compatibility)

---

### Test 4: Retrieve KOT with New Fields

**Endpoint**: `GET /api/v1/orders/{orderUuid}/kots`

**Expected Result**:
- KOT includes `spicyLevel`, `totalQuantity`, `kitchenNotes`, `orderNotes`
- Each KOT item includes item-specific spicy level and notes

---

### Test 5: Backward Compatibility Test

**Endpoint**: `POST /api/v1/orders`

**Request Body** (without new fields):
```json
{
  "restaurantUuid": "YOUR_RESTAURANT_UUID",
  "orderType": "DINE_IN",
  "tableUuid": "YOUR_TABLE_UUID",
  "items": [
    {
      "productUuid": "YOUR_PRODUCT_UUID",
      "quantity": 2
    }
  ]
}
```

**Expected Result**:
- Order created successfully
- New fields are null/empty in response
- No errors or validation issues

---

### Test 6: Spicy Level Variations

Test all spicy level values:

```json
{
  "items": [
    {"productUuid": "...", "quantity": 1, "spicyLevel": "NONE"},
    {"productUuid": "...", "quantity": 1, "spicyLevel": "MILD"},
    {"productUuid": "...", "quantity": 1, "spicyLevel": "MEDIUM"},
    {"productUuid": "...", "quantity": 1, "spicyLevel": "HOT"},
    {"productUuid": "...", "quantity": 1, "spicyLevel": "EXTRA_HOT"}
  ]
}
```

**Expected Result**:
- All spicy levels are accepted and saved correctly
- Invalid spicy level returns validation error

---

### Test 7: Total Quantity Calculation

Create a KOT with multiple items of varying quantities:

**Request**:
```json
{
  "orderItemUuids": ["ITEM_1", "ITEM_2", "ITEM_3"]
}
```

Where:
- ITEM_1 has quantity: 2.5
- ITEM_2 has quantity: 3.0
- ITEM_3 has quantity: 1.5

**Expected Result**:
- `totalQuantity` = 7.0 (2.5 + 3.0 + 1.5)

---

### Test 8: Notes Length Validation

Test maximum length constraints:

**Kitchen Notes**: Max 1000 characters
**Order Notes**: Max 1000 characters
**Item Notes**: Max 500 characters

**Test with exceeding length**:
```json
{
  "items": [
    {
      "productUuid": "...",
      "quantity": 1,
      "kitchenNotes": "A".repeat(1001)
    }
  ]
}
```

**Expected Result**:
- Validation error with message about character limit

---

### Test 9: Multiple KOTs with Different Spicy Levels

1. Create an order with 4 items (2 mild, 2 hot)
2. Send first KOT with 2 mild items, spicyLevel: "MILD"
3. Send second KOT with 2 hot items, spicyLevel: "HOT"

**Expected Result**:
- Each KOT has correct spicy level
- Item-level spicy levels are preserved
- Total quantities are calculated correctly for each KOT

---

### Test 10: Update/Cancel Flows

Test that new fields don't break existing flows:

1. Create order with spicy level and notes
2. Send KOT
3. Cancel an item
4. Update order status
5. Complete order

**Expected Result**:
- All operations work normally
- Spicy level and notes remain intact throughout lifecycle

---

## Database Verification

### Check kitchen_order_tickets
```sql
SELECT 
    kot_number,
    spicy_level,
    total_quantity,
    LEFT(kitchen_notes, 50) as kitchen_notes_preview,
    LEFT(order_notes, 50) as order_notes_preview
FROM kitchen_order_tickets
ORDER BY created_at DESC
LIMIT 10;
```

### Check kot_items
```sql
SELECT 
    ki.product_name,
    ki.quantity,
    ki.spicy_level,
    LEFT(ki.kitchen_notes, 50) as kitchen_notes_preview,
    kot.kot_number
FROM kot_items ki
JOIN kitchen_order_tickets kot ON ki.kot_id = kot.id
ORDER BY ki.created_at DESC
LIMIT 10;
```

### Check order_items
```sql
SELECT 
    oi.product_name,
    oi.quantity,
    oi.spicy_level,
    LEFT(oi.kitchen_notes, 50) as kitchen_notes_preview,
    o.order_number
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
ORDER BY oi.created_at DESC
LIMIT 10;
```

---

## Edge Cases to Test

1. **Null spicy level**: Should be allowed
2. **Empty notes**: Should be allowed
3. **Unicode characters in notes**: Should be supported
4. **Special characters**: Test with emojis, symbols
5. **Very long product names with notes**: Ensure no truncation issues
6. **Zero quantity items**: Verify totalQuantity calculation
7. **Decimal quantities**: Test with 0.5, 1.25, etc.
8. **Concurrent KOT creation**: Multiple waiters creating KOTs simultaneously

---

## Success Criteria

- [ ] All test scenarios pass
- [ ] No database errors
- [ ] API responses include all new fields
- [ ] Backward compatibility maintained
- [ ] Validation works correctly
- [ ] Total quantity calculation is accurate
- [ ] Notes are saved and retrieved correctly
- [ ] All spicy levels work properly
- [ ] No performance degradation
- [ ] Mappers work without errors

---

## Troubleshooting

### Issue: Fields returning null
**Solution**: Verify database migration ran successfully

### Issue: Mapper errors
**Solution**: Rebuild project with `mvn clean compile`

### Issue: Validation errors
**Solution**: Check field length constraints and enum values

### Issue: Total quantity incorrect
**Solution**: Verify all items have non-null quantity values

### Issue: Spicy level not saving
**Solution**: Check enum name spelling (exact case match required)

