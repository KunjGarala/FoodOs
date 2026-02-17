# Product Modifier Group Endpoints - Quick Reference

## 🚀 Endpoints at a Glance

### 1. Assign Modifier Group to Product
```
POST /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}
```
**Permission:** MANAGER  
**Response:** 204 No Content

---

### 2. Remove Modifier Group from Product
```
DELETE /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}
```
**Permission:** MANAGER  
**Response:** 204 No Content

---

### 3. Get Product's Modifier Groups
```
GET /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups
```
**Permission:** GUEST  
**Response:** 200 OK (Array of ModifierGroupResponseDto)

---

## 📝 Quick Test with cURL

### Variables Setup
```bash
export BASE_URL="http://localhost:8080"
export TOKEN="your_jwt_token"
export RESTAURANT_UUID="your_restaurant_uuid"
export PRODUCT_UUID="your_product_uuid"
export MODIFIER_GROUP_UUID="your_modifier_group_uuid"
```

### Test Commands

#### 1. Get Current Modifier Groups (should be empty initially)
```bash
curl -X GET \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2. Assign Modifier Group
```bash
curl -X POST \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

#### 3. Verify Assignment
```bash
curl -X GET \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Remove Modifier Group
```bash
curl -X DELETE \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

---

## 🎯 Common Use Cases

### Use Case: Pizza Product
```bash
# Assign "Extra Toppings" modifier group
POST /api/restaurants/{uuid}/products/{pizza-uuid}/modifier-groups/{toppings-uuid}

# Assign "Size" modifier group
POST /api/restaurants/{uuid}/products/{pizza-uuid}/modifier-groups/{size-uuid}

# Verify both are assigned
GET /api/restaurants/{uuid}/products/{pizza-uuid}/modifier-groups
```

### Use Case: Coffee Product
```bash
# Assign "Size" (Small, Medium, Large)
POST /api/restaurants/{uuid}/products/{coffee-uuid}/modifier-groups/{size-uuid}

# Assign "Add-ons" (Extra Shot, Whipped Cream, etc.)
POST /api/restaurants/{uuid}/products/{coffee-uuid}/modifier-groups/{addons-uuid}
```

---

## ⚠️ Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 400 | "Modifier group is already assigned to this product" | Trying to assign duplicate |
| 400 | "Modifier group is not assigned to this product" | Trying to remove non-existent |
| 400 | "Product does not belong to this restaurant" | Wrong restaurant UUID |
| 404 | "Product not found with UUID: ..." | Invalid product UUID |
| 404 | "Modifier group not found with UUID: ..." | Invalid modifier group UUID |
| 403 | "Access denied" | Insufficient permissions |

---

## 📦 Response Format (GET)

```json
[
  {
    "modifierGroupUuid": "mg-123",
    "name": "Extra Toppings",
    "selectionType": "MULTIPLE",
    "minSelection": 0,
    "maxSelection": 5,
    "isRequired": false,
    "isActive": true,
    "sortOrder": 1,
    "modifiers": [
      {
        "modifierUuid": "mod-001",
        "name": "Extra Cheese",
        "price": 2.50,
        "isDefault": false,
        "isActive": true
      }
    ],
    "createdAt": "2026-02-10T08:00:00",
    "updatedAt": "2026-02-15T14:30:00"
  }
]
```

---

## 🔑 Authentication

All endpoints require JWT authentication:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📚 Documentation Files

- **Full Documentation:** `PRODUCT_MODIFIER_GROUP_MANAGEMENT.md`
- **Implementation Summary:** `PRODUCT_MODIFIER_GROUP_IMPLEMENTATION_SUMMARY.md`
- **Postman Collection:** `Product_Modifier_Group_Assignment_Postman_Collection.json`

---

## ✅ Implementation Checklist

- [x] Service methods created in ProductService.java
- [x] Controller endpoints added to ProductController.java
- [x] Swagger/OpenAPI documentation
- [x] Error handling and validation
- [x] Restaurant-level isolation
- [x] Permission-based access control
- [x] Postman collection created
- [x] Documentation created
- [x] Code compiled successfully

---

**Status:** ✅ Ready for Testing  
**Date:** February 17, 2026
