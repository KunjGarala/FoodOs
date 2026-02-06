# 📋 Table Management API Documentation

## Overview
Production-grade RESTful API for comprehensive restaurant table management including CRUD operations, status lifecycle management, floor plan visualization, table merging, order transfers, and analytics.

## 🎯 Features
- ✅ **13 Production APIs** with full validation
- ✅ **Comprehensive Logging** using SLF4J
- ✅ **Swagger/OpenAPI Documentation** 
- ✅ **Role-based Access Control** (OWNER, MANAGER, WAITER)
- ✅ **Soft Delete** support
- ✅ **Status Lifecycle Management** with validation
- ✅ **Real-time Floor Plan** with position tracking
- ✅ **Multi-outlet Support** (Franchise/Chain)
- ✅ **Table Merging** for large parties
- ✅ **Order Transfer** between tables
- ✅ **Analytics Dashboard** data

---

## 📚 API Endpoints

### Base URL: `/api/v1/tables`

---

## 1️⃣ Create Table

**POST** `/api/v1/tables`

Creates a new table for a restaurant.

**Access Level:** `MANAGER` and above

**Request Body:**
```json
{
  "restaurantId": 1,
  "sectionName": "AC Hall",
  "tableNumber": "T12",
  "capacity": 6,
  "minCapacity": 2,
  "shape": "RECTANGLE",
  "posX": 420,
  "posY": 180,
  "isActive": true
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `tableNumber` | Unique per restaurant, Required |
| `capacity` | > 0, Required |
| `sectionName` | Required |
| `restaurantId` | Must exist, Required |
| `shape` | One of: RECTANGLE, CIRCLE, SQUARE, OVAL |

**Response - 201 Created:**
```json
{
  "id": 45,
  "tableUuid": "550e8400-e29b-41d4-a716-446655440000",
  "tableNumber": "T12",
  "sectionName": "AC Hall",
  "capacity": 6,
  "minCapacity": 2,
  "status": "VACANT",
  "restaurantId": 1,
  "restaurantName": "FoodOs - Ahmedabad",
  "posX": 420,
  "posY": 180,
  "shape": "RECTANGLE",
  "isActive": true,
  "isMerged": false,
  "createdAt": "2026-02-04T11:30:00"
}
```

**Logs:**
```
INFO  - Creating new table. Request: CreateTableRequestDto(...), User: admin@foodos.com
INFO  - Table created successfully. ID: 45, Number: T12, Restaurant: FoodOs - Ahmedabad
```

---

## 2️⃣ Update Table

**PUT** `/api/v1/tables/{tableId}`

Updates table configuration (not status).

**Access Level:** `MANAGER` and above

**Request Body:**
```json
{
  "sectionName": "VIP Area",
  "capacity": 8,
  "minCapacity": 3,
  "posX": 460,
  "posY": 220,
  "shape": "OVAL",
  "isActive": true
}
```

**Response - 200 OK:**
```json
{
  "id": 45,
  "tableNumber": "T12",
  "sectionName": "VIP Area",
  "capacity": 8,
  "status": "VACANT",
  "posX": 460,
  "posY": 220,
  "shape": "OVAL",
  "updatedAt": "2026-02-04T11:45:10"
}
```

**Logs:**
```
INFO  - Updating table 45. Request: UpdateTableRequestDto(...), User: manager@foodos.com
INFO  - Table updated successfully. ID: 45, Number: T12
```

---

## 3️⃣ Update Table Status

**PATCH** `/api/v1/tables/{tableId}/status`

Changes table lifecycle status.

**Access Level:** `WAITER` and above

**Status Transition Rules:**
| From | To | Notes |
|------|----|----|
| `VACANT` | `OCCUPIED` | Requires `currentOrderId` |
| `VACANT` | `RESERVED` | For reservations |
| `OCCUPIED` | `BILLED` | Payment completed |
| `BILLED` | `DIRTY` | Guests left |
| `DIRTY` | `VACANT` | Cleaned and ready |
| `RESERVED` | `OCCUPIED` | Guests arrived |
| `RESERVED` | `VACANT` | Reservation cancelled |

**Request Body:**
```json
{
  "status": "OCCUPIED",
  "currentOrderId": "550e8400-e29b-41d4-a716-446655440000",
  "waiterId": 12,
  "currentPax": 4
}
```

**Response - 200 OK:**
```json
{
  "tableId": 45,
  "tableUuid": "550e8400-e29b-41d4-a716-446655440000",
  "tableNumber": "T12",
  "status": "OCCUPIED",
  "currentOrderId": "550e8400-e29b-41d4-a716-446655440000",
  "occupiedSince": "2026-02-04T12:00:00",
  "waiterId": 12,
  "waiterName": "John Doe"
}
```

**Logs:**
```
INFO  - Updating table status. TableId: 45, NewStatus: OCCUPIED, User: waiter@foodos.com
INFO  - Table T12 marked as OCCUPIED. Order: 550e8400-..., Waiter: 12
INFO  - Table status updated successfully. ID: 45, Status: VACANT -> OCCUPIED
```

---

## 4️⃣ Get Table by ID

**GET** `/api/v1/tables/{tableId}`

Fetches single table with live status.

**Access Level:** `WAITER` and above

**Response - 200 OK:**
```json
{
  "id": 45,
  "tableUuid": "550e8400-e29b-41d4-a716-446655440000",
  "tableNumber": "T12",
  "sectionName": "VIP Area",
  "capacity": 8,
  "status": "OCCUPIED",
  "restaurantId": 1,
  "restaurantName": "FoodOs - Ahmedabad",
  "currentOrder": {
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "totalAmount": 1250.00,
    "elapsedMinutes": 42
  },
  "currentWaiterId": 12,
  "currentWaiterName": "John Doe",
  "currentPax": 4,
  "seatedAt": "2026-02-04T12:00:00",
  "posX": 460,
  "posY": 220,
  "shape": "OVAL",
  "isActive": true,
  "createdAt": "2026-02-04T11:30:00",
  "updatedAt": "2026-02-04T12:00:00"
}
```

---

## 5️⃣ Get All Tables (Paginated)

**GET** `/api/v1/tables`

Fetches all tables with optional status filter.

**Access Level:** `MANAGER` and above

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 0 | Page number (0-based) |
| `size` | int | 20 | Page size |
| `status` | enum | null | Filter by status (VACANT, OCCUPIED, BILLED, DIRTY, RESERVED) |

**Example:** `GET /api/v1/tables?page=0&size=20&status=VACANT`

**Response - 200 OK:**
```json
{
  "content": [
    {
      "id": 45,
      "tableNumber": "T12",
      "sectionName": "VIP Area",
      "status": "VACANT",
      "capacity": 8,
      "restaurantId": 1,
      "restaurantName": "FoodOs - Ahmedabad"
    }
  ],
  "totalElements": 18,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

## 6️⃣ Get Tables by Restaurant (Floor Plan)

**GET** `/api/v1/tables/restaurant/{restaurantId}`

Fetches tables for POS floor plan view with position coordinates.

**Access Level:** `WAITER` and above

**Response - 200 OK:**
```json
[
  {
    "id": 1,
    "tableUuid": "550e8400-e29b-41d4-a716-446655440001",
    "tableNumber": "T1",
    "sectionName": "AC Hall",
    "status": "OCCUPIED",
    "capacity": 4,
    "posX": 120,
    "posY": 80,
    "shape": "RECTANGLE",
    "isMerged": false,
    "currentWaiterName": "John Doe"
  },
  {
    "id": 2,
    "tableUuid": "550e8400-e29b-41d4-a716-446655440002",
    "tableNumber": "T2",
    "sectionName": "Outdoor",
    "status": "VACANT",
    "capacity": 6,
    "posX": 300,
    "posY": 160,
    "shape": "CIRCLE",
    "isMerged": false
  }
]
```

**Use Case:** Real-time floor plan visualization in POS systems

---

## 7️⃣ Get Tables by Restaurant Chain

**GET** `/api/v1/tables/chain/{parentRestaurantId}`

Fetches table summaries for all outlets in a franchise.

**Access Level:** `OWNER` only

**Response - 200 OK:**
```json
[
  {
    "restaurantId": 1,
    "restaurantUuid": "550e8400-e29b-41d4-a716-446655440010",
    "restaurantName": "FoodOs – Ahmedabad",
    "totalTables": 22,
    "occupied": 10,
    "vacant": 9,
    "billed": 3,
    "dirty": 0,
    "reserved": 0
  },
  {
    "restaurantId": 2,
    "restaurantUuid": "550e8400-e29b-41d4-a716-446655440011",
    "restaurantName": "FoodOs – Surat",
    "totalTables": 18,
    "occupied": 7,
    "vacant": 8,
    "billed": 3,
    "dirty": 0,
    "reserved": 0
  }
]
```

**Use Case:** Multi-outlet dashboard for franchise head office

---

## 8️⃣ Delete Table (Soft Delete)

**DELETE** `/api/v1/tables/{tableId}`

Soft deletes a table (marks as inactive).

**Access Level:** `MANAGER` and above

**Business Rules:**
- ❌ Cannot delete if status is `OCCUPIED`
- ✅ Sets `isActive = false` and `isDeleted = true`

**Response - 204 No Content**

**Logs:**
```
INFO  - Deleting table 45. User: manager@foodos.com
INFO  - Table soft-deleted successfully. ID: 45, Number: T12
```

---

## 9️⃣ Merge Tables

**POST** `/api/v1/tables/merge`

Combines multiple tables for large party seating.

**Access Level:** `WAITER` and above

**Request Body:**
```json
{
  "parentTableId": 10,
  "childTableIds": [11, 12]
}
```

**Validation Rules:**
- All tables must be `VACANT`
- All tables must be in the same restaurant
- Parent table becomes the primary table

**Response - 200 OK:**
```json
{
  "mergedTableId": 10,
  "mergedTableNumber": "T10",
  "mergedTables": ["T11", "T12"],
  "totalCapacity": 16,
  "status": "OCCUPIED",
  "mergedAt": "2026-02-04T13:00:00"
}
```

**Logs:**
```
INFO  - Merging tables. Parent: 10, Children: [11, 12], User: waiter@foodos.com
INFO  - Tables merged successfully. Parent: T10, Children: [T11, T12], Total capacity: 16
```

---

## 🔟 Transfer Table Order

**POST** `/api/v1/tables/transfer`

Moves guests and order from one table to another.

**Access Level:** `WAITER` and above

**Request Body:**
```json
{
  "fromTableId": 10,
  "toTableId": 15
}
```

**Validation Rules:**
- Source table must be `OCCUPIED`
- Destination table must be `VACANT`
- Both tables must be in the same restaurant

**Response - 200 OK:**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "fromTable": "T10",
  "toTable": "T15",
  "fromTableId": 10,
  "toTableId": 15,
  "transferredAt": "2026-02-04T13:10:00"
}
```

**Logs:**
```
INFO  - Transferring table. From: 10, To: 15, User: waiter@foodos.com
INFO  - Table transfer completed successfully. From: T10 -> To: T15
```

---

## 1️⃣1️⃣ Get Table Analytics

**GET** `/api/v1/tables/analytics/{restaurantId}`

Fetches table utilization analytics.

**Access Level:** `MANAGER` and above

**Response - 200 OK:**
```json
{
  "averageTurnTimeMinutes": 54.5,
  "occupancyRate": 72.5,
  "mostUsedTable": "T5",
  "totalOrdersToday": 45,
  "peakHour": 19,
  "averageGuestsPerTable": 3.5
}
```

**Metrics Explained:**
- `averageTurnTimeMinutes`: Average time guests spend at tables
- `occupancyRate`: Percentage of tables currently occupied
- `mostUsedTable`: Table with most frequent usage
- `totalOrdersToday`: Number of orders served today
- `peakHour`: Busiest hour of the day (24-hour format)
- `averageGuestsPerTable`: Average party size

---

## 🔐 Access Control

| Role | Permissions |
|------|-------------|
| **OWNER** | All operations + Chain analytics |
| **MANAGER** | Create, Update, Delete tables + Analytics |
| **WAITER** | View tables, Update status, Merge, Transfer |

---

## 📊 Database Schema

**Table:** `restaurant_tables`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT |
| `table_uuid` | VARCHAR(36) | UNIQUE, NOT NULL |
| `restaurant_id` | BIGINT | FOREIGN KEY, NOT NULL |
| `table_number` | VARCHAR(20) | NOT NULL |
| `section_name` | VARCHAR(50) | NOT NULL |
| `capacity` | INT | NOT NULL, > 0 |
| `min_capacity` | INT | DEFAULT 1 |
| `status` | ENUM | NOT NULL, DEFAULT 'VACANT' |
| `current_waiter_id` | BIGINT | FOREIGN KEY, NULLABLE |
| `current_pax` | INT | NULLABLE |
| `seated_at` | TIMESTAMP | NULLABLE |
| `position_x` | INT | NULLABLE |
| `position_y` | INT | NULLABLE |
| `table_shape` | VARCHAR(20) | DEFAULT 'RECTANGLE' |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false |
| `is_merged` | BOOLEAN | NOT NULL, DEFAULT false |
| `merged_with_table_ids` | TEXT | NULLABLE |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

**Indexes:**
- `idx_section` on `section_name`
- `idx_status` on `status`

**Unique Constraint:** (`restaurant_id`, `table_number`) for non-deleted records

---

## 🛠️ Technology Stack

- **Framework:** Spring Boot 3.5.7
- **Java:** 21
- **Database:** PostgreSQL
- **ORM:** Hibernate/JPA
- **Validation:** Jakarta Bean Validation
- **Mapping:** MapStruct
- **Documentation:** Swagger/OpenAPI 3
- **Logging:** SLF4J + Logback
- **Security:** Spring Security with JWT

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "status": 400,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Table number T12 already exists in this restaurant"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Table not found with ID: 45"
}
```

### 403 Forbidden
```json
{
  "status": 403,
  "code": "ACCESS_DENIED",
  "message": "You do not have permission to access this resource"
}
```

---

## 🧪 Testing

Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

### Sample Test Flow:

1. **Create Table** (MANAGER)
2. **Update Status to OCCUPIED** (WAITER)
3. **View Floor Plan** (WAITER)
4. **Transfer Table** (WAITER)
5. **Update Status to BILLED** (WAITER)
6. **Update Status to DIRTY** (WAITER)
7. **Update Status to VACANT** (WAITER)
8. **View Analytics** (MANAGER)

---

## 📈 Logging Levels

All operations are logged with appropriate levels:

- **INFO:** Successful operations, status changes
- **ERROR:** Failures, validation errors, not found errors
- **DEBUG:** (Optional) Detailed request/response data

**Example Logs:**
```
2026-02-04 12:00:00 INFO  RestaurantTableService - Creating new table. Request: {...}, User: admin@foodos.com
2026-02-04 12:00:01 INFO  RestaurantTableService - Table created successfully. ID: 45, Number: T12, Restaurant: FoodOs
2026-02-04 12:05:00 ERROR RestaurantTableService - Table not found with ID: 999
2026-02-04 12:10:00 INFO  RestaurantTableService - Table T12 marked as OCCUPIED. Order: 550e8400-...
```

---

## 🚀 Future Enhancements

- [ ] Real-time WebSocket updates for table status changes
- [ ] QR code generation for tables
- [ ] Table reservation integration
- [ ] Heatmap visualization for table usage
- [ ] Predictive analytics for peak times
- [ ] Integration with Order Management module
- [ ] Mobile waiter app support

---

## 📞 Support

For issues or questions, contact the development team or create a ticket in the project management system.

---

**Version:** 1.0.0  
**Last Updated:** February 5, 2026  
**Module:** Table Management  
**Status:** ✅ Production Ready
