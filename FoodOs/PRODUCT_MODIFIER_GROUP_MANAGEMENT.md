# Product Modifier Group Management API Documentation

## Overview
This document describes the new API endpoints for managing modifier group assignments to products in the FoodOs system. These endpoints allow restaurant managers to dynamically attach and detach modifier groups (like toppings, sizes, sides, etc.) to products.

---

## 📋 Table of Contents
- [Endpoints Summary](#endpoints-summary)
- [Endpoint Details](#endpoint-details)
- [Use Cases](#use-cases)
- [Error Handling](#error-handling)
- [Testing Guide](#testing-guide)
- [Database Schema](#database-schema)

---

## Endpoints Summary

| HTTP Method | Endpoint | Permission | Description |
|------------|----------|------------|-------------|
| **POST** | `/api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}` | MANAGER | Assign a modifier group to a product |
| **DELETE** | `/api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}` | MANAGER | Remove a modifier group from a product |
| **GET** | `/api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups` | GUEST | Get all modifier groups for a product |

---

## Endpoint Details

### 1. Assign Modifier Group to Product

**Endpoint:** `POST /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}`

**Description:** Assigns a modifier group to a product, allowing customers to customize the product with modifiers from that group.

**Path Parameters:**
- `restaurantUuid` (String, required): UUID of the restaurant
- `productUuid` (String, required): UUID of the product
- `modifierGroupUuid` (String, required): UUID of the modifier group to assign

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
- **Status:** `204 No Content` (Success)
- **Status:** `400 Bad Request` (Validation error)
- **Status:** `404 Not Found` (Resource not found)
- **Status:** `403 Forbidden` (Access denied)

**Business Rules:**
- Both product and modifier group must belong to the same restaurant
- The modifier group cannot already be assigned to the product
- Both product and modifier group must not be soft-deleted
- User must have MANAGER permission level or higher

**Example Request:**
```bash
POST http://localhost:8080/api/restaurants/rest-123/products/prod-456/modifier-groups/mg-789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**
```
HTTP/1.1 204 No Content
```

**Error Response (Already Assigned):**
```json
{
  "status": 400,
  "message": "Modifier group is already assigned to this product",
  "timestamp": "2026-02-17T10:30:00"
}
```

---

### 2. Remove Modifier Group from Product

**Endpoint:** `DELETE /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups/{modifierGroupUuid}`

**Description:** Removes a modifier group assignment from a product.

**Path Parameters:**
- `restaurantUuid` (String, required): UUID of the restaurant
- `productUuid` (String, required): UUID of the product
- `modifierGroupUuid` (String, required): UUID of the modifier group to remove

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
- **Status:** `204 No Content` (Success)
- **Status:** `400 Bad Request` (Validation error)
- **Status:** `404 Not Found` (Resource not found)
- **Status:** `403 Forbidden` (Access denied)

**Business Rules:**
- The modifier group must currently be assigned to the product
- Both product and modifier group must belong to the same restaurant
- User must have MANAGER permission level or higher

**Example Request:**
```bash
DELETE http://localhost:8080/api/restaurants/rest-123/products/prod-456/modifier-groups/mg-789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**
```
HTTP/1.1 204 No Content
```

**Error Response (Not Assigned):**
```json
{
  "status": 400,
  "message": "Modifier group is not assigned to this product",
  "timestamp": "2026-02-17T10:30:00"
}
```

---

### 3. Get Product's Modifier Groups

**Endpoint:** `GET /api/restaurants/{restaurantUuid}/products/{productUuid}/modifier-groups`

**Description:** Retrieves all modifier groups currently assigned to a product.

**Path Parameters:**
- `restaurantUuid` (String, required): UUID of the restaurant
- `productUuid` (String, required): UUID of the product

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
- **Status:** `200 OK` (Success)
- **Status:** `404 Not Found` (Resource not found)
- **Status:** `400 Bad Request` (Validation error)

**Business Rules:**
- Only returns active (non-deleted) modifier groups
- Only includes modifier groups with `isActive = true`
- Product must belong to the specified restaurant
- User must have GUEST permission level or higher

**Example Request:**
```bash
GET http://localhost:8080/api/restaurants/rest-123/products/prod-456/modifier-groups
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**
```json
[
  {
    "modifierGroupUuid": "mg-789",
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
        "isActive": true,
        "sortOrder": 1
      },
      {
        "modifierUuid": "mod-002",
        "name": "Pepperoni",
        "price": 3.00,
        "isDefault": false,
        "isActive": true,
        "sortOrder": 2
      }
    ],
    "createdAt": "2026-02-10T08:00:00",
    "updatedAt": "2026-02-15T14:30:00"
  },
  {
    "modifierGroupUuid": "mg-790",
    "name": "Size",
    "selectionType": "SINGLE",
    "minSelection": 1,
    "maxSelection": 1,
    "isRequired": true,
    "isActive": true,
    "sortOrder": 0,
    "modifiers": [
      {
        "modifierUuid": "mod-010",
        "name": "Small",
        "price": 0.00,
        "isDefault": true,
        "isActive": true,
        "sortOrder": 1
      },
      {
        "modifierUuid": "mod-011",
        "name": "Large",
        "price": 5.00,
        "isDefault": false,
        "isActive": true,
        "sortOrder": 2
      }
    ],
    "createdAt": "2026-02-10T08:00:00",
    "updatedAt": "2026-02-15T14:30:00"
  }
]
```

---

## Use Cases

### 🍕 Use Case 1: Pizza with Toppings
**Scenario:** A burger product needs customization options

```bash
# Step 1: Create modifier group "Extra Toppings"
POST /api/restaurants/rest-123/modifier-groups
# (Creates mg-toppings-001)

# Step 2: Add modifiers to the group (Extra Cheese, Pepperoni, etc.)
POST /api/restaurants/rest-123/modifier-groups/mg-toppings-001/modifiers
# (Multiple times for each topping)

# Step 3: Assign modifier group to Pepperoni Pizza product
POST /api/restaurants/rest-123/products/prod-pizza-001/modifier-groups/mg-toppings-001

# Step 4: Verify assignment
GET /api/restaurants/rest-123/products/prod-pizza-001/modifier-groups
```

### ☕ Use Case 2: Coffee with Sizes and Add-ons
**Scenario:** A coffee product needs both size options and add-ons

```bash
# Assign "Size" modifier group (Small, Medium, Large)
POST /api/restaurants/rest-123/products/prod-coffee-001/modifier-groups/mg-size-001

# Assign "Add-ons" modifier group (Extra Shot, Whipped Cream, etc.)
POST /api/restaurants/rest-123/products/prod-coffee-001/modifier-groups/mg-addons-001

# Get all modifier groups for the coffee
GET /api/restaurants/rest-123/products/prod-coffee-001/modifier-groups
```

### 🍔 Use Case 3: Removing Obsolete Customizations
**Scenario:** A product no longer needs a specific modifier group

```bash
# Remove "Seasonal Toppings" from burger product
DELETE /api/restaurants/rest-123/products/prod-burger-001/modifier-groups/mg-seasonal-001
```

---

## Error Handling

### Common Error Responses

#### 404 Not Found - Product
```json
{
  "status": 404,
  "message": "Product not found with UUID: prod-456",
  "timestamp": "2026-02-17T10:30:00"
}
```

#### 404 Not Found - Modifier Group
```json
{
  "status": 404,
  "message": "Modifier group not found with UUID: mg-789",
  "timestamp": "2026-02-17T10:30:00"
}
```

#### 400 Bad Request - Wrong Restaurant
```json
{
  "status": 400,
  "message": "Product does not belong to this restaurant",
  "timestamp": "2026-02-17T10:30:00"
}
```

#### 400 Bad Request - Already Assigned
```json
{
  "status": 400,
  "message": "Modifier group is already assigned to this product",
  "timestamp": "2026-02-17T10:30:00"
}
```

#### 400 Bad Request - Not Assigned
```json
{
  "status": 400,
  "message": "Modifier group is not assigned to this product",
  "timestamp": "2026-02-17T10:30:00"
}
```

#### 403 Forbidden
```json
{
  "status": 403,
  "message": "Access denied",
  "timestamp": "2026-02-17T10:30:00"
}
```

---

## Testing Guide

### Prerequisites
1. Have a valid JWT access token with MANAGER permissions
2. Have a restaurant UUID
3. Have at least one product created
4. Have at least one modifier group created

### Step-by-Step Testing

#### 1. **Setup Test Data**
```bash
# Variables
RESTAURANT_UUID="your-restaurant-uuid"
PRODUCT_UUID="your-product-uuid"
MODIFIER_GROUP_UUID="your-modifier-group-uuid"
ACCESS_TOKEN="your-jwt-token"
BASE_URL="http://localhost:8080"
```

#### 2. **Test GET - Initially Empty**
```bash
curl -X GET \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: Empty array []
```

#### 3. **Test POST - Assign Modifier Group**
```bash
curl -X POST \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: HTTP 204 No Content
```

#### 4. **Test GET - Verify Assignment**
```bash
curl -X GET \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: Array with the assigned modifier group
```

#### 5. **Test POST - Duplicate Assignment (Should Fail)**
```bash
curl -X POST \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: HTTP 400 "Modifier group is already assigned to this product"
```

#### 6. **Test DELETE - Remove Assignment**
```bash
curl -X DELETE \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: HTTP 204 No Content
```

#### 7. **Test GET - Verify Removal**
```bash
curl -X GET \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: Empty array []
```

#### 8. **Test DELETE - Remove Non-existent (Should Fail)**
```bash
curl -X DELETE \
  "$BASE_URL/api/restaurants/$RESTAURANT_UUID/products/$PRODUCT_UUID/modifier-groups/$MODIFIER_GROUP_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected: HTTP 400 "Modifier group is not assigned to this product"
```

---

## Database Schema

### Many-to-Many Relationship

The relationship between products and modifier groups is maintained through a join table:

**Table:** `product_modifier_groups`

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | BIGINT | Foreign key to `products.id` |
| `modifier_group_id` | BIGINT | Foreign key to `modifier_groups.id` |

**Primary Key:** Composite (`product_id`, `modifier_group_id`)

**Indexes:**
- Index on `product_id` (for fast lookup by product)
- Index on `modifier_group_id` (for fast lookup by modifier group)

### Entity Relationship

```
Product (1) ←→ (*) product_modifier_groups (*) ←→ (1) ModifierGroup
```

- One product can have multiple modifier groups
- One modifier group can be assigned to multiple products
- The relationship is managed through the `Product.modifierGroups` Set and `ModifierGroup.products` Set

---

## Implementation Details

### Service Layer Methods

**ProductService.java:**

```java
@Transactional
public void assignModifierGroupToProduct(String restaurantUuid, String productUuid, String modifierGroupUuid)

@Transactional
public void removeModifierGroupFromProduct(String restaurantUuid, String productUuid, String modifierGroupUuid)

@Transactional(readOnly = true)
public List<ModifierGroupResponseDto> getProductModifierGroups(String restaurantUuid, String productUuid)
```

### Controller Layer

**ProductController.java:**

```java
@PostMapping("/{productUuid}/modifier-groups/{modifierGroupUuid}")
@PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")

@DeleteMapping("/{productUuid}/modifier-groups/{modifierGroupUuid}")
@PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")

@GetMapping("/{productUuid}/modifier-groups")
@PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'GUEST')")
```

---

## Security Considerations

1. **Authentication Required:** All endpoints require a valid JWT token
2. **Authorization Levels:**
   - GET: GUEST or higher
   - POST/DELETE: MANAGER or higher
3. **Restaurant Validation:** All operations verify that resources belong to the specified restaurant
4. **Soft Delete Awareness:** Only non-deleted entities are considered

---

## Frontend Integration

### Example JavaScript/React Usage

```javascript
import api from './services/api';

// Get product's modifier groups
const fetchProductModifierGroups = async (restaurantUuid, productUuid) => {
  try {
    const response = await api.get(
      `/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching modifier groups:', error);
    throw error;
  }
};

// Assign modifier group to product
const assignModifierGroup = async (restaurantUuid, productUuid, modifierGroupUuid) => {
  try {
    await api.post(
      `/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups/${modifierGroupUuid}`
    );
    console.log('Modifier group assigned successfully');
  } catch (error) {
    console.error('Error assigning modifier group:', error);
    throw error;
  }
};

// Remove modifier group from product
const removeModifierGroup = async (restaurantUuid, productUuid, modifierGroupUuid) => {
  try {
    await api.delete(
      `/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups/${modifierGroupUuid}`
    );
    console.log('Modifier group removed successfully');
  } catch (error) {
    console.error('Error removing modifier group:', error);
    throw error;
  }
};
```

---

## Summary

✅ **Endpoints Implemented:**
- POST for assigning modifier groups to products
- DELETE for removing modifier groups from products
- GET for retrieving all modifier groups for a product

✅ **Features:**
- Full validation and error handling
- Restaurant-level isolation
- Soft delete awareness
- Permission-based access control
- Swagger/OpenAPI documentation

✅ **Files Modified:**
- `ProductService.java` - Added 3 new service methods
- `ProductController.java` - Added 3 new REST endpoints

✅ **Files Created:**
- `Product_Modifier_Group_Assignment_Postman_Collection.json`
- `PRODUCT_MODIFIER_GROUP_MANAGEMENT.md`

---

## Next Steps

1. **Test the endpoints** using the Postman collection
2. **Update frontend** to use these new endpoints
3. **Consider additional features:**
   - Bulk assign/remove modifier groups
   - Copy modifier group assignments from one product to another
   - Analytics on most-used modifier groups per product category

---

**Last Updated:** February 17, 2026  
**Version:** 1.0  
**Author:** FoodOs Development Team
