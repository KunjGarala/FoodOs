# Complete Order Management System - Production Grade

## Overview
This is a production-grade, scalable order management system for restaurant POS applications built with Spring Boot 3.x, Java 21, and PostgreSQL.

## Architecture

### Key Design Patterns
1. **Aggregate Root Pattern** - Order is the aggregate root managing OrderItems, Payments, and KOTs
2. **Domain-Driven Design** - Rich domain models with business logic
3. **Optimistic Locking** - Using @Version for concurrent access control
4. **Soft Delete** - All entities support soft deletion
5. **Repository Pattern** - Spring Data JPA repositories with custom queries
6. **DTO Pattern** - Separate request/response DTOs for API layer
7. **Service Layer** - Business logic encapsulation
8. **Mapper Pattern** - Clean entity-DTO conversion

### Technology Stack
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 21
- **Database**: PostgreSQL
- **ORM**: Hibernate/JPA
- **Validation**: Jakarta Validation
- **Documentation**: Swagger/OpenAPI
- **Build Tool**: Maven

## Entity Model

### Core Entities

#### 1. Order (Aggregate Root)
- **Purpose**: Main order entity managing the complete order lifecycle
- **Key Features**:
  - Optimistic locking with @Version
  - State machine for status transitions
  - Automatic total calculations
  - Cascade operations for child entities
  - Support for all order types (Dine-in, Takeaway, Delivery, Online)

#### 2. OrderItem
- **Purpose**: Individual items in an order
- **Key Features**:
  - KOT status tracking
  - Modifier support
  - Item-level discounts and taxes
  - Cancellation tracking
  - Complimentary item support

#### 3. OrderItemModifier
- **Purpose**: Modifiers applied to order items (e.g., Extra Cheese, No Onions)
- **Key Features**:
  - Snapshot of modifier details at order time
  - Price calculations

#### 4. KitchenOrderTicket (KOT)
- **Purpose**: Tickets sent to kitchen for order preparation
- **Key Features**:
  - Multiple KOT types (New, Running, Cancellation)
  - Printer routing support
  - Kitchen station assignment
  - Priority management
  - Status workflow

#### 5. KotItem
- **Purpose**: Individual items in a KOT
- **Key Features**:
  - Kitchen display information
  - Readiness tracking
  - Highlighted items for special attention

#### 6. Payment
- **Purpose**: Payment transactions for orders
- **Key Features**:
  - Multiple payment methods
  - Transaction tracking
  - Refund support (full and partial)
  - Digital payment details (UPI, Card, etc.)

### Enum Types

1. **OrderType**: DINE_IN, TAKEAWAY, DELIVERY, ONLINE
2. **OrderStatus**: DRAFT, OPEN, KOT_SENT, IN_PROGRESS, READY, SERVED, BILLED, PAID, COMPLETED, CANCELLED, VOID
3. **KotStatus**: PENDING, FIRED, ACKNOWLEDGED, COOKING, READY, SERVED, CANCELLED
4. **KotType**: NEW, RUNNING, CANCELLATION, REPRINT
5. **KotTicketStatus**: PENDING, SENT, ACKNOWLEDGED, IN_PROGRESS, READY, COMPLETED, CANCELLED
6. **PaymentMethod**: CASH, CARD, UPI, WALLET, CREDIT, BANK_TRANSFER, CHEQUE, ONLINE
7. **PaymentStatus**: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED

## Business Logic

### Order Lifecycle

```
DRAFT → OPEN → KOT_SENT → IN_PROGRESS → READY → SERVED → BILLED → PAID → COMPLETED
         ↓         ↓            ↓            ↓        ↓        ↓       ↓
      CANCELLED CANCELLED   CANCELLED    CANCELLED CANCELLED CANCELLED CANCELLED
```

### State Transitions
- **State Machine Validation**: Only valid transitions allowed
- **Automatic Timestamps**: Each status change updates relevant timestamp
- **Audit Trail**: Complete history of status changes

### Calculations

#### Order Total Calculation
```
Subtotal = Sum of all active order items
After Discount = Subtotal - Discount Amount
Tax = After Discount × Tax%
Service Charge = After Discount × Service Charge%
Total Before Round-off = After Discount + Tax + Service Charge + Delivery + Packing + Tip
Round-off = Round(Total Before Round-off) - Total Before Round-off
Final Total = Total Before Round-off + Round-off
Balance = Final Total - Paid Amount
```

#### Line Total Calculation (Order Item)
```
Base = (Unit Price + Modifiers Total) × Quantity
After Discount = Base - Discount
Tax = After Discount × Tax%
Line Total = After Discount + Tax
```

## Repository Layer

### Custom Queries
- **Performance Optimized**: JOIN FETCH to avoid N+1 problems
- **Pagination Support**: All list queries support pagination
- **Statistics Queries**: Aggregated data for reports
- **Search Queries**: Full-text search capabilities
- **Date Range Queries**: Efficient date-based filtering

### Key Repository Methods
1. **Order Number Generation**: Auto-increment per day
2. **Active Orders**: For dashboard display
3. **Kitchen Orders**: For KDS (Kitchen Display System)
4. **Payment Summaries**: By method, date, collector
5. **Sales Reports**: Total sales, average order value, etc.

## API Design (Controllers to be implemented)

### Order Controller Endpoints

```
POST   /api/orders                          - Create order
GET    /api/orders/{orderUuid}              - Get order
PUT    /api/orders/{orderUuid}              - Update order
DELETE /api/orders/{orderUuid}              - Delete order
PATCH  /api/orders/{orderUuid}/status       - Change status
POST   /api/orders/{orderUuid}/cancel       - Cancel order
POST   /api/orders/{orderUuid}/complete     - Complete order

POST   /api/orders/{orderUuid}/items        - Add items
DELETE /api/orders/{orderUuid}/items/{itemUuid} - Remove item
POST   /api/orders/{orderUuid}/items/{itemUuid}/cancel - Cancel item

POST   /api/orders/{orderUuid}/kot          - Send KOT
POST   /api/orders/{orderUuid}/kot/all      - Send all pending items

POST   /api/orders/{orderUuid}/payments     - Add payment
POST   /api/orders/{orderUuid}/bill         - Generate bill

GET    /api/orders/restaurant/{restaurantId} - List orders
GET    /api/orders/restaurant/{restaurantId}/active - Active orders
GET    /api/orders/restaurant/{restaurantId}/kitchen - Kitchen orders
GET    /api/orders/search                   - Search orders
```

### KOT Controller Endpoints

```
GET    /api/kots/{kotUuid}                  - Get KOT
GET    /api/kots/order/{orderUuid}          - Get KOTs for order
GET    /api/kots/restaurant/{restaurantId}  - List KOTs
PATCH  /api/kots/{kotUuid}/acknowledge      - Acknowledge KOT
PATCH  /api/kots/{kotUuid}/start            - Start preparation
PATCH  /api/kots/{kotUuid}/ready            - Mark ready
PATCH  /api/kots/{kotUuid}/complete         - Complete KOT
```

### Payment Controller Endpoints

```
GET    /api/payments/{paymentUuid}          - Get payment
GET    /api/payments/order/{orderUuid}      - Get payments for order
POST   /api/payments/{paymentUuid}/refund   - Process refund
GET    /api/payments/restaurant/{restaurantId}/summary - Payment summary
```

## Service Layer Implementation Guide

### OrderService Key Methods

1. **createOrder()**
   - Validate request
   - Check table availability (for dine-in)
   - Create order entity
   - Add order items with modifiers
   - Calculate totals
   - Update table status
   - Send KOT if requested
   - Generate order number

2. **updateOrder()**
   - Validate order can be modified
   - Add new items
   - Remove items (with KOT cancellation if needed)
   - Recalculate totals
   - Update order details

3. **sendKot()**
   - Validate items exist
   - Generate KOT number
   - Create KOT entity with items
   - Update order item statuses
   - Route to correct printer/station
   - Return KOT details

4. **addPayment()**
   - Validate payment amount
   - Create payment entity
   - Update order paid amount
   - Check if fully paid
   - Update order status if fully paid
   - Return updated order

5. **generateBill()**
   - Validate all items served
   - Calculate final totals
   - Update order status to BILLED
   - Generate bill number
   - Return bill details

## Database Schema

### Key Indexes
- UUID columns (for external references)
- Foreign keys
- Status columns (for filtering)
- Date columns (for date-range queries)
- Phone numbers (for customer lookup)
- Order numbers, KOT numbers

### Performance Considerations
1. **Composite Indexes**: restaurant_id + order_date for common queries
2. **Partial Indexes**: Consider for is_deleted = false
3. **Connection Pooling**: HikariCP configuration
4. **Query Optimization**: EXPLAIN ANALYZE for slow queries

## Security Considerations

1. **Role-Based Access**: Different permissions for different users
2. **Row-Level Security**: Users can only access their restaurant's data
3. **Audit Trail**: Track who created/modified orders
4. **Input Validation**: All DTOs have validation annotations
5. **SQL Injection Prevention**: Parameterized queries

## Error Handling

### Custom Exceptions (to be created)
- OrderNotFoundException
- OrderNotModifiableException
- InvalidOrderStateException
- InsufficientPaymentException
- DuplicateOrderNumberException
- TableOccupiedException

### Global Exception Handler
- Consistent error response format
- HTTP status code mapping
- Error logging
- Client-friendly messages

## Testing Strategy

### Unit Tests
- Entity business logic methods
- Service layer methods
- Calculation logic
- State transition validation

### Integration Tests
- Repository queries
- Transaction management
- Cascade operations
- Concurrent access (optimistic locking)

### Performance Tests
- Load testing for peak hours
- Query performance
- Bulk operations

## Scalability Features

1. **Horizontal Scaling**: Stateless services
2. **Database Read Replicas**: For reporting queries
3. **Caching**: Redis for frequently accessed data
4. **Async Processing**: For KOT printing, notifications
5. **Event-Driven**: Domain events for loose coupling

## Monitoring & Observability

1. **Metrics**: Order creation rate, average order value, KOT processing time
2. **Logging**: Structured logging with correlation IDs
3. **Tracing**: Distributed tracing for microservices
4. **Alerts**: For failed payments, long pending orders

## Next Steps for Implementation

1. ✅ **Entities**: Created
2. ✅ **Enums**: Created
3. ✅ **Repositories**: Created
4. ✅ **DTOs**: Created
5. ✅ **Mapper**: Created
6. ✅ **Service Interface**: Created
7. ⏳ **Service Implementation**: To be completed
8. ⏳ **Controllers**: To be created
9. ⏳ **Exception Handling**: To be created
10. ⏳ **Validation**: To be created
11. ⏳ **Tests**: To be created

## Configuration

### application.properties
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/foodos
spring.datasource.username=postgres
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JPA
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.use_sql_comments=true

# Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# Validation
spring.jpa.properties.hibernate.check_nullability=true
```

## Conclusion

This order management system is built with production-grade practices including:
- Proper separation of concerns
- Rich domain models
- Comprehensive business logic
- Performance optimizations
- Scalability features
- Security best practices
- Complete audit trails

The system is ready for the service layer and controller implementation to complete the full-stack solution.

