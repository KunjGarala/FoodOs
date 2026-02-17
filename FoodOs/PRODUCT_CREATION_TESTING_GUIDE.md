# Product Creation - Testing Guide

## Issue Fixed ✅
**Problem:** Validation errors when creating products - `categoryUuid` and `dietaryType` were null  
**Solution:** Added `contentType: application/json` to the product JSON part in multipart requests

## Prerequisites
Before creating a product, you need:
1. ✅ Valid authentication token
2. ✅ Valid restaurant UUID
3. ✅ Valid category UUID (create a category first)

## Quick Test Steps

### Step 1: Login and Get Token
```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
    "username": "your-username",
    "password": "your-password"
}
```

Copy the JWT token from the response.

### Step 2: Create a Category (if you don't have one)
```
POST http://localhost:8081/api/restaurants/{restaurantUuid}/categories/create
Authorization: Bearer {your-token}
Content-Type: application/json

{
    "name": "Burgers",
    "description": "Delicious burgers",
    "isActive": true
}
```

Copy the `categoryUuid` from the response.

### Step 3: Create a Product (FIXED!)

#### In Postman:
1. Import the updated `Product_Management_Postman_Collection.json`
2. Set your environment variables:
   - `baseUrl`: `http://localhost:8081`
   - `restaurantUuid`: Your restaurant UUID
   - `categoryUuid`: The category UUID from Step 2
3. Select "Create Product" request
4. The JSON in the `product` field already has `contentType: application/json` set ✅
5. Click "Send"

#### Using cURL:
```bash
curl -X POST "http://localhost:8081/api/restaurants/{restaurantUuid}/products/create" \
  -H "Authorization: Bearer {your-token}" \
  -F 'product={"name":"Classic Burger","description":"A delicious burger","categoryUuid":"{categoryUuid}","sku":"BURGER-001","basePrice":9.99,"dietaryType":"NON_VEG"};type=application/json'
```

#### Using cURL with Image:
```bash
curl -X POST "http://localhost:8081/api/restaurants/{restaurantUuid}/products/create" \
  -H "Authorization: Bearer {your-token}" \
  -F 'product={"name":"Classic Burger","description":"A delicious burger","categoryUuid":"{categoryUuid}","sku":"BURGER-001","basePrice":9.99,"dietaryType":"NON_VEG"};type=application/json' \
  -F 'image=@/path/to/burger.jpg'
```

## Expected Response (201 Created)
```json
{
    "productUuid": "xxx-xxx-xxx-xxx",
    "name": "Classic Burger",
    "description": "A delicious burger",
    "categoryUuid": "xxx-xxx-xxx-xxx",
    "categoryName": "Burgers",
    "sku": "BURGER-001",
    "basePrice": 9.99,
    "dietaryType": "NON_VEG",
    "isActive": true,
    "isFeatured": false,
    "isBestseller": false,
    "createdAt": "2026-02-16T12:45:52.000+00:00",
    "updatedAt": "2026-02-16T12:45:52.000+00:00"
}
```

## Minimal Valid Request
The absolute minimum fields required:
```json
{
    "name": "Product Name",
    "categoryUuid": "valid-category-uuid",
    "basePrice": 9.99,
    "dietaryType": "NON_VEG"
}
```

## Complete Example with All Fields
```json
{
    "name": "Classic Burger",
    "description": "A delicious classic burger with fresh ingredients",
    "categoryUuid": "{{categoryUuid}}",
    "sku": "BURGER-001",
    "foodCode": "FB001",
    "basePrice": 9.99,
    "costPrice": 5.00,
    "takeawayPrice": 10.99,
    "deliveryPrice": 11.99,
    "dietaryType": "NON_VEG",
    "preparationTime": 15,
    "spiceLevel": 2,
    "isActive": true,
    "isFeatured": true,
    "isBestseller": false,
    "isOpenPrice": false,
    "trackInventory": true,
    "sortOrder": 0,
    "availableFrom": "09:00",
    "availableTo": "22:00",
    "availableDays": "MON,TUE,WED,THU,FRI,SAT,SUN"
}
```

## Dietary Type Options
- `VEG` - Vegetarian
- `NON_VEG` - Non-vegetarian  
- `VEGAN` - Vegan
- `GLUTEN_FREE` - Gluten-free
- `DAIRY_FREE` - Dairy-free

## Common Error Messages & Solutions

### ❌ "Dietary type is required"
**Cause:** Missing `dietaryType` field  
**Fix:** Add `"dietaryType": "NON_VEG"` (or other valid value)

### ❌ "Category UUID is required"
**Cause:** Missing `categoryUuid` field  
**Fix:** Add `"categoryUuid": "valid-uuid"` 

### ❌ "Base price is required"
**Cause:** Missing `basePrice` field  
**Fix:** Add `"basePrice": 9.99`

### ❌ "Category not found with UUID: xxx"
**Cause:** Invalid or non-existent category UUID  
**Fix:** Create a category first or use an existing valid UUID

### ❌ "Category does not belong to this restaurant"
**Cause:** Category belongs to a different restaurant  
**Fix:** Use a category that was created for the same restaurant

### ❌ "Product with SKU 'xxx' already exists"
**Cause:** Duplicate SKU  
**Fix:** Use a unique SKU or omit the SKU field

## Validation Rules
- ✅ `name`: Required, max 200 characters
- ✅ `categoryUuid`: Required, must be valid UUID
- ✅ `basePrice`: Required, must be > 0
- ✅ `dietaryType`: Required, must be valid enum value
- ✅ `sku`: Optional, max 50 characters, must be unique
- ✅ `foodCode`: Optional, max 20 characters
- ✅ `costPrice`: Optional, must be > 0 if provided
- ✅ `preparationTime`: Optional, must be >= 0
- ✅ `spiceLevel`: Optional, must be 1-5
- ✅ `availableDays`: Optional, must match pattern (e.g., "MON,TUE,WED")

## Testing Checklist
- [ ] Can create product with minimum fields
- [ ] Can create product with all fields
- [ ] Can create product with image (when S3 is configured)
- [ ] Validation errors show proper messages
- [ ] Category UUID is validated
- [ ] SKU uniqueness is enforced
- [ ] Dietary type enum is validated
- [ ] Product appears in GET requests after creation
- [ ] Created product has proper timestamps
- [ ] Product UUID is generated automatically

## Files Updated
1. ✅ `Product_Management_Postman_Collection.json` - Added `contentType: application/json`
2. ✅ `ProductController.java` - Added optional `image` parameter
3. ✅ `ProductService.java` - Updated method signature
4. ✅ `PRODUCT_API_MULTIPART_GUIDE.md` - Detailed documentation

## Next Steps
After successfully creating products, you can:
1. Create product variations (sizes, options)
2. Add modifiers to products
3. Upload product images (when S3 is configured)
4. Update product details
5. Toggle product active/inactive status
6. Create orders with these products

