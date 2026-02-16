# Product API - Multipart Form Data Guide

## Issue Resolved
**Problem:** Validation errors when creating products - `categoryUuid` and `dietaryType` fields were coming as `null`.

**Root Cause:** When sending JSON as part of `multipart/form-data`, the Content-Type for that specific part must be set to `application/json`. Without this, Spring Boot's `@RequestPart` annotation cannot properly deserialize the JSON data, resulting in null values.

## Solution

### In Postman
When creating or updating products, you must:

1. Set the request's main Content-Type to `multipart/form-data`
2. For the JSON part (`product`), add a `Content-Type` header as `application/json`

### Postman Configuration

#### Create Product Request
```
POST {{baseUrl}}/api/restaurants/{restaurantUuid}/products/create
Content-Type: multipart/form-data

Body (form-data):
- Key: product
  Value: {JSON string}
  Type: text
  Content-Type: application/json  ← IMPORTANT!
  
- Key: image (optional)
  Type: file
  Value: {select image file}
```

#### Sample JSON for Create Product
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
    "sortOrder": 0
}
```

### Required Fields
- `name` - Product name (max 200 characters)
- `categoryUuid` - Valid category UUID
- `basePrice` - Base price (must be > 0)
- `dietaryType` - One of: `VEG`, `NON_VEG`, `VEGAN`, `GLUTEN_FREE`, `DAIRY_FREE`

### Optional Fields
- `description` - Product description
- `sku` - Stock keeping unit (must be unique)
- `foodCode` - Food code (max 20 characters)
- `costPrice` - Cost price
- `takeawayPrice` - Takeaway price
- `deliveryPrice` - Delivery price
- `preparationTime` - Preparation time in minutes
- `spiceLevel` - Spice level (1-5)
- `isActive` - Active status (default: true)
- `isFeatured` - Featured status (default: false)
- `isBestseller` - Bestseller status (default: false)
- `isOpenPrice` - Open price status (default: false)
- `trackInventory` - Track inventory (default: true)
- `sortOrder` - Sort order (default: 0)
- `availableFrom` - Available from time (HH:mm format)
- `availableTo` - Available to time (HH:mm format)
- `availableDays` - Comma-separated day codes (e.g., "MON,TUE,WED")

### Dietary Types
- `VEG` - Vegetarian
- `NON_VEG` - Non-vegetarian
- `VEGAN` - Vegan
- `GLUTEN_FREE` - Gluten-free
- `DAIRY_FREE` - Dairy-free

## Using cURL

### Create Product with JSON Only
```bash
curl -X POST "http://localhost:8081/api/restaurants/{restaurantUuid}/products/create" \
  -H "Authorization: Bearer {token}" \
  -F 'product={"name":"Classic Burger","categoryUuid":"xxx","basePrice":9.99,"dietaryType":"NON_VEG"};type=application/json'
```

### Create Product with JSON and Image
```bash
curl -X POST "http://localhost:8081/api/restaurants/{restaurantUuid}/products/create" \
  -H "Authorization: Bearer {token}" \
  -F 'product={"name":"Classic Burger","categoryUuid":"xxx","basePrice":9.99,"dietaryType":"NON_VEG"};type=application/json' \
  -F 'image=@/path/to/image.jpg'
```

## Using JavaScript/Fetch API

```javascript
const formData = new FormData();

// Create a Blob with the correct content type for JSON
const productData = {
    name: "Classic Burger",
    categoryUuid: "xxx-xxx-xxx",
    basePrice: 9.99,
    dietaryType: "NON_VEG"
};

const blob = new Blob([JSON.stringify(productData)], {
    type: 'application/json'
});

formData.append('product', blob);

// Optionally add an image
// formData.append('image', imageFile);

fetch('http://localhost:8081/api/restaurants/{restaurantUuid}/products/create', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Using Axios

```javascript
const axios = require('axios');
const FormData = require('form-data');

const formData = new FormData();

const productData = {
    name: "Classic Burger",
    categoryUuid: "xxx-xxx-xxx",
    basePrice: 9.99,
    dietaryType: "NON_VEG"
};

// Append JSON with content type
formData.append('product', JSON.stringify(productData), {
    contentType: 'application/json'
});

// Optionally add image
// formData.append('image', fs.createReadStream('/path/to/image.jpg'));

axios.post('http://localhost:8081/api/restaurants/{restaurantUuid}/products/create', formData, {
    headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer ' + token
    }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## Common Errors

### Error: "Dietary type is required"
- **Cause:** Missing `dietaryType` field or incorrect JSON deserialization
- **Fix:** Ensure `dietaryType` is included and the JSON part has `Content-Type: application/json`

### Error: "Category UUID is required"
- **Cause:** Missing `categoryUuid` field or incorrect JSON deserialization
- **Fix:** Ensure `categoryUuid` is included and the JSON part has `Content-Type: application/json`

### Error: "Base price is required"
- **Cause:** Missing `basePrice` field
- **Fix:** Add `basePrice` with a value greater than 0

### Error: "Category not found"
- **Cause:** Invalid category UUID
- **Fix:** Use a valid category UUID from the category creation response

### Error: "Category does not belong to this restaurant"
- **Cause:** Category UUID belongs to a different restaurant
- **Fix:** Create a category for the current restaurant or use an existing valid category

## Updated Postman Collection

The Postman collection (`Product_Management_Postman_Collection.json`) has been updated with:
1. Proper `contentType: application/json` for all JSON parts
2. Complete field examples including all required fields
3. Proper field names (`basePrice` instead of `price`)

Import the updated collection to use the corrected requests.

## Technical Details

### Controller Annotation
```java
@PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ProductResponseDto> createProduct(
    @PathVariable String restaurantUuid,
    @Valid @RequestPart("product") CreateProductRequest request,
    @RequestPart(value = "image", required = false) MultipartFile image
)
```

The `@RequestPart("product")` annotation expects:
- A part named "product" in the multipart request
- That part to have Content-Type: application/json for proper deserialization
- The JSON to match the `CreateProductRequest` DTO structure

### Why This Matters
Without the proper Content-Type on the JSON part:
1. Spring sees it as plain text
2. Jackson cannot deserialize the JSON properly
3. All fields become null
4. Validation fails for required fields

With the proper Content-Type:
1. Spring recognizes it as JSON
2. Jackson deserializes it correctly
3. All fields are populated
4. Validation works as expected

