# 🚀 Quick Start Guide - Table Management Module

## Prerequisites
- Java 21
- PostgreSQL database
- Maven
- Spring Boot 3.5.7
- IDE (IntelliJ IDEA recommended)

## 📦 Project Structure

```
src/main/java/org/foodos/restaurant/
├── controller/
│   └── RestaurantTableController.java      # 11 REST endpoints
├── service/
│   └── RestaurantTableService.java         # Business logic + logging
├── repository/
│   └── RestaurantTableRepository.java      # Data access layer
├── mapper/
│   └── RestaurantTableMapper.java          # DTO ↔ Entity mapping
├── entity/
│   ├── RestaurantTable.java                # Updated with currentOrderUuid
│   └── enums/
│       └── TableStatus.java                # VACANT, OCCUPIED, BILLED, DIRTY, RESERVED
└── dto/
    ├── request/
    │   ├── CreateTableRequestDto.java
    │   ├── UpdateTableRequestDto.java
    │   ├── UpdateTableStatusRequestDto.java
    │   ├── MergeTablesRequestDto.java
    │   └── TransferTableRequestDto.java
    └── response/
        ├── TableResponseDto.java
        ├── TableFloorPlanDto.java
        ├── TableStatusResponseDto.java
        ├── MergeTablesResponseDto.java
        ├── TransferTableResponseDto.java
        ├── RestaurantChainTablesSummaryDto.java
        └── TableAnalyticsDto.java
```

## 🗄️ Database Setup

### 1. The RestaurantTable entity will auto-create this table structure:

```sql
-- Table will be created automatically by Hibernate
-- But here's the schema for reference:

CREATE TABLE restaurant_tables (
    id BIGSERIAL PRIMARY KEY,
    table_uuid VARCHAR(36) UNIQUE NOT NULL,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id),
    table_number VARCHAR(20) NOT NULL,
    section_name VARCHAR(50),
    capacity INTEGER NOT NULL DEFAULT 4,
    min_capacity INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'VACANT',
    current_order_uuid VARCHAR(36),
    current_waiter_id BIGINT REFERENCES user_auth(id),
    current_pax INTEGER,
    seated_at TIMESTAMP,
    position_x INTEGER,
    position_y INTEGER,
    table_shape VARCHAR(20) DEFAULT 'RECTANGLE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_merged BOOLEAN NOT NULL DEFAULT false,
    merged_with_table_ids TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_restaurant_table UNIQUE (restaurant_id, table_number)
);

-- Indexes (auto-created by JPA)
CREATE INDEX idx_section ON restaurant_tables(section_name);
CREATE INDEX idx_status ON restaurant_tables(status);
```

### 2. Update application.properties

```properties
# Already configured in your project
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

## 🎯 First Time Setup

### Step 1: Compile the Project

```bash
cd "D:\SGP 4\Code\FoodOs"
mvn clean compile
```

### Step 2: Run the Application

```bash
mvn spring-boot:run
```

Or run from IDE: `FoodOsApplication.java`

### Step 3: Access Swagger UI

Open browser: `http://localhost:8080/swagger-ui.html`

Navigate to: **Table Management APIs** section

## 🧪 Testing the APIs

### Method 1: Using Swagger UI

1. Go to `http://localhost:8080/swagger-ui.html`
2. Find "Table Management APIs" section
3. Authenticate first (get JWT token from login)
4. Click "Authorize" button and paste token
5. Test each endpoint

### Method 2: Using Postman

1. Import the collection: `Table_Management_Postman_Collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:8080`
   - `access_token`: Your JWT token
   - `restaurant_id`: Your restaurant ID
   - `table_id`: Created table ID
3. Run requests in order

### Method 3: Using cURL

#### Create Table
```bash
curl -X POST "http://localhost:8080/api/v1/tables" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "sectionName": "AC Hall",
    "tableNumber": "T1",
    "capacity": 4,
    "shape": "RECTANGLE",
    "posX": 100,
    "posY": 100,
    "isActive": true
  }'
```

#### Get Floor Plan
```bash
curl -X GET "http://localhost:8080/api/v1/tables/restaurant/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Status to OCCUPIED
```bash
curl -X PATCH "http://localhost:8080/api/v1/tables/1/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "OCCUPIED",
    "currentOrderId": "550e8400-e29b-41d4-a716-446655440000",
    "waiterId": 2,
    "currentPax": 4
  }'
```

## 🔑 Authentication & Authorization

### Get JWT Token

```bash
# Login first
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_email@example.com",
    "password": "your_password"
  }'
```

Response will include `Authorization` header with JWT token.

### Role Requirements

| Role | Can Access |
|------|------------|
| `OWNER` | All APIs including chain summary |
| `MANAGER` | Create, Update, Delete tables + Analytics |
| `WAITER` | View, Status updates, Merge, Transfer |

## 📊 Sample Test Flow

### Complete Lifecycle Test

```bash
# 1. Create a table (MANAGER role)
POST /api/v1/tables
{
  "restaurantId": 1,
  "sectionName": "Main Hall",
  "tableNumber": "T1",
  "capacity": 4,
  "posX": 100,
  "posY": 100
}
# Response: {"id": 1, "status": "VACANT", ...}

# 2. View floor plan (WAITER role)
GET /api/v1/tables/restaurant/1
# Response: [{"id": 1, "tableNumber": "T1", "status": "VACANT", ...}]

# 3. Mark as OCCUPIED (WAITER role)
PATCH /api/v1/tables/1/status
{
  "status": "OCCUPIED",
  "currentOrderId": "order-uuid-123",
  "waiterId": 2,
  "currentPax": 3
}

# 4. Check table status
GET /api/v1/tables/1
# Response: {"id": 1, "status": "OCCUPIED", "currentOrder": {...}}

# 5. Mark as BILLED
PATCH /api/v1/tables/1/status
{"status": "BILLED"}

# 6. Mark as DIRTY
PATCH /api/v1/tables/1/status
{"status": "DIRTY"}

# 7. Mark as VACANT (clean and ready)
PATCH /api/v1/tables/1/status
{"status": "VACANT"}

# 8. View analytics (MANAGER role)
GET /api/v1/tables/analytics/1
# Response: {"occupancyRate": 45.5, "averageTurnTimeMinutes": 52, ...}
```

### Merge Tables Test

```bash
# 1. Create 3 tables
POST /api/v1/tables (T1, T2, T3)

# 2. Merge T2 and T3 into T1
POST /api/v1/tables/merge
{
  "parentTableId": 1,
  "childTableIds": [2, 3]
}
# Response: {"mergedTableId": 1, "totalCapacity": 12, ...}
```

### Transfer Table Test

```bash
# 1. T1 is OCCUPIED, T2 is VACANT
# 2. Transfer guests from T1 to T2
POST /api/v1/tables/transfer
{
  "fromTableId": 1,
  "toTableId": 2
}
# Response: {"fromTable": "T1", "toTable": "T2", ...}
```

## 📝 Logging

All operations are logged. Check console/logs:

```
INFO  RestaurantTableService - Creating new table. Request: {...}
INFO  RestaurantTableService - Table created successfully. ID: 1, Number: T1
INFO  RestaurantTableService - Table T1 marked as OCCUPIED. Order: order-uuid-123
```

## 🐛 Troubleshooting

### Issue: "Restaurant not found"
**Solution**: Ensure restaurant exists and ID is correct

### Issue: "Table number already exists"
**Solution**: Table numbers must be unique per restaurant

### Issue: "Invalid status transition"
**Solution**: Follow the status lifecycle:
- VACANT → OCCUPIED or RESERVED
- OCCUPIED → BILLED
- BILLED → DIRTY
- DIRTY → VACANT

### Issue: "Cannot delete occupied table"
**Solution**: Change status to VACANT first, then delete

### Issue: "Authentication required"
**Solution**: Include JWT token in Authorization header

## 📚 Documentation

- **Full API Docs**: `TABLE_MANAGEMENT_API.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Postman Collection**: `Table_Management_Postman_Collection.json`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`

## 🎓 Key Concepts

### Table Status Lifecycle
```
VACANT → OCCUPIED → BILLED → DIRTY → VACANT
   ↓         ↑
RESERVED → OCCUPIED
```

### Soft Delete
Tables are never hard-deleted. They're marked `isDeleted=true` and `isActive=false`.

### Floor Plan Coordinates
- `posX` and `posY` are used for visual representation in POS systems
- Coordinates are in pixels or arbitrary units
- Used by frontend to render interactive floor plans

### Table Merging
- Combines capacity of multiple tables
- Parent table becomes primary
- Child tables marked as merged and inactive
- Used for large parties/events

## 🚀 Next Steps

1. ✅ Test all 11 APIs via Swagger UI
2. ✅ Create test tables for your restaurant
3. ✅ Test status lifecycle transitions
4. ✅ Try merge and transfer operations
5. ✅ View analytics dashboard
6. ⏭️ Integrate with Order Management module (when available)
7. ⏭️ Integrate with Frontend POS system

## 💡 Tips

- Use Swagger UI for quick testing
- Check logs for detailed operation tracking
- Use Postman collection for automated testing
- Test with different user roles
- Create multiple tables to test floor plan view
- Test edge cases (merge same table, invalid transitions)

## 📞 Support

For issues:
1. Check logs for error messages
2. Review `TABLE_MANAGEMENT_API.md` for API details
3. Verify authentication and role permissions
4. Check database constraints

---

**Happy Coding! 🎉**

Module Status: ✅ Production Ready
