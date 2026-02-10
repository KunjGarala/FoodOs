# 🚀 Quick Start Guide - Order Management System

## Prerequisites Checklist
- ✅ Java 21 installed
- ✅ PostgreSQL database running
- ✅ Maven installed
- ✅ IDE (IntelliJ IDEA recommended)

## Step 1: Database Setup

### Create Database
```sql
CREATE DATABASE foodos;
CREATE USER foodos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE foodos TO foodos_user;
```

### Configure application.properties
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/foodos
spring.datasource.username=foodos_user
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JPA/Hibernate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true
```

## Step 2: Build the Project

```bash
cd D:\SGP 4\Code\FoodOs
mvn clean install -DskipTests
```

## Step 3: Create Missing Repositories (If Needed)

The service implementation expects these repositories. Create them if they don't exist:

### RestaurantRepository
```java
// src/main/java/org/foodos/restaurant/repository/RestaurantRepository.java
@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByRestaurantUuidAndIsDeletedFalse(String uuid);
}
```

### RestaurantTableRepository  
```java
// src/main/java/org/foodos/restaurant/repository/RestaurantTableRepository.java
@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByIdAndIsDeletedFalse(Long id);
}
```

### ProductRepository
```java
// src/main/java/org/foodos/product/repository/ProductRepository.java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByIdAndIsDeletedFalse(Long id);
}
```

### ProductVariationRepository
```java
// src/main/java/org/foodos/product/repository/ProductVariationRepository.java
@Repository
public interface ProductVariationRepository extends JpaRepository<ProductVariation, Long> {
    Optional<ProductVariation> findByIdAndIsDeletedFalse(Long id);
}
```

### ModifierRepository
```java
// src/main/java/org/foodos/product/repository/ModifierRepository.java
@Repository
public interface ModifierRepository extends JpaRepository<Modifier, Long> {
    Optional<Modifier> findByIdAndIsDeletedFalse(Long id);
}
```

### UserRepository (in auth package)
```java
// src/main/java/org/foodos/auth/repository/UserRepository.java
@Repository
public interface UserRepository extends JpaRepository<UserAuthEntity, Long> {
    Optional<UserAuthEntity> findByIdAndIsDeletedFalse(Long id);
}
```

## Step 4: Run the Application

```bash
mvn spring-boot:run
```

Or run from IDE:
- Open `FoodOsApplication.java`
- Right-click → Run

## Step 5: Test the APIs

### Using Swagger UI
Navigate to: `http://localhost:8080/swagger-ui.html`

### Using Postman

#### 1. Create an Order
```http
POST http://localhost:8080/api/v1/orders
Content-Type: application/json

{
  "restaurantId": 1,
  "orderType": "DINE_IN",
  "numberOfGuests": 4,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "modifiers": [
        {
          "modifierId": 1,
          "quantity": 1
        }
      ]
    }
  ],
  "taxPercentage": 5.0,
  "serviceChargePercentage": 10.0,
  "sendKotImmediately": true
}
```

#### 2. Get Order
```http
GET http://localhost:8080/api/v1/orders/{orderUuid}
```

#### 3. Send KOT
```http
POST http://localhost:8080/api/v1/orders/{orderUuid}/kot
Content-Type: application/json

{
  "orderItemUuids": ["item-uuid-1", "item-uuid-2"],
  "printerTarget": "KITCHEN_MAIN"
}
```

#### 4. Add Payment
```http
POST http://localhost:8080/api/v1/orders/{orderUuid}/payments
Content-Type: application/json

{
  "paymentMethod": "CASH",
  "amount": 1000.00
}
```

#### 5. Generate Bill
```http
POST http://localhost:8080/api/v1/orders/{orderUuid}/bill
```

## Step 6: Common Issues & Solutions

### Issue 1: Missing Repositories
**Solution**: Create the missing repository interfaces as shown in Step 3.

### Issue 2: Database Connection Failed
**Solution**: 
- Check PostgreSQL is running: `pg_ctl status`
- Verify credentials in application.properties
- Check firewall settings

### Issue 3: Port Already in Use
**Solution**: Change port in application.properties:
```properties
server.port=8081
```

### Issue 4: Authentication Required
**Solution**: If Spring Security is configured, you need to:
1. Login to get JWT token
2. Add header: `Authorization: Bearer <token>`

### Issue 5: Validation Errors
**Solution**: Check request body matches DTO validation rules:
- Required fields must be present
- Values must be within valid ranges
- Format must match (email, phone, etc.)

## Step 7: Development Workflow

### Creating a New Order (Complete Flow)
```
1. POST /api/v1/orders (Create order)
   ↓
2. Order Status: OPEN
   ↓
3. POST /api/v1/orders/{uuid}/kot (Send to kitchen)
   ↓
4. Order Status: KOT_SENT
   ↓
5. Kitchen prepares items
   ↓
6. Order Status: READY → SERVED
   ↓
7. POST /api/v1/orders/{uuid}/bill (Generate bill)
   ↓
8. Order Status: BILLED
   ↓
9. POST /api/v1/orders/{uuid}/payments (Add payment)
   ↓
10. Order Status: PAID → COMPLETED
```

## Step 8: Sample Data Setup

### Create Test Data SQL
```sql
-- Insert Restaurant
INSERT INTO restaurants (restaurant_uuid, name, is_deleted, created_at, updated_at)
VALUES ('rest-001', 'Test Restaurant', false, NOW(), NOW());

-- Insert Product
INSERT INTO products (product_uuid, restaurant_id, name, price, sku, is_deleted, created_at, updated_at)
VALUES ('prod-001', 1, 'Margherita Pizza', 350.00, 'PIZZA-001', false, NOW(), NOW());

-- Insert Table
INSERT INTO restaurant_tables (table_number, restaurant_id, capacity, status, is_deleted, created_at, updated_at)
VALUES ('T1', 1, 4, 'VACANT', false, NOW(), NOW());
```

## Step 9: Testing with cURL

```bash
# Create Order
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "orderType": "DINE_IN",
    "items": [{
      "productId": 1,
      "quantity": 2
    }]
  }'

# Get Order
curl -X GET http://localhost:8080/api/v1/orders/{orderUuid}

# Add Payment
curl -X POST http://localhost:8080/api/v1/orders/{orderUuid}/payments \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "CASH",
    "amount": 700.00
  }'
```

## Step 10: Monitoring & Logs

### Check Application Logs
```bash
tail -f logs/spring-boot-application.log
```

### Check Database
```sql
-- View orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- View order items
SELECT * FROM order_items WHERE order_id = 1;

-- View payments
SELECT * FROM payments WHERE order_id = 1;

-- Check KOTs
SELECT * FROM kitchen_order_tickets ORDER BY created_at DESC;
```

## Step 11: Performance Tuning

### Enable Connection Pooling
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

### Enable Query Cache
```properties
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.cache.use_query_cache=true
spring.jpa.properties.hibernate.cache.region.factory_class=org.hibernate.cache.jcache.JCacheRegionFactory
```

## Step 12: Production Deployment

### Build Production JAR
```bash
mvn clean package -Pprod -DskipTests
```

### Run Production
```bash
java -jar target/FoodOs-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --server.port=8080
```

### With Docker
```dockerfile
FROM openjdk:21-jdk-slim
COPY target/FoodOs-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
docker build -t foodos:latest .
docker run -p 8080:8080 foodos:latest
```

## 📚 Next Steps

1. **Security**: Implement JWT authentication
2. **Testing**: Write unit and integration tests
3. **Monitoring**: Add Actuator endpoints
4. **Logging**: Configure structured logging
5. **Documentation**: Generate API docs
6. **CI/CD**: Setup automated deployment

## 🆘 Getting Help

- Check `ORDER_SYSTEM_DOCUMENTATION.md` for detailed info
- Check `DELIVERY_SUMMARY.md` for feature overview
- Check entity comments for business logic
- Check repository methods for query examples

## ✅ Verification Checklist

After setup, verify:
- [ ] Application starts without errors
- [ ] Database tables are created
- [ ] Swagger UI is accessible
- [ ] Can create an order via API
- [ ] Can retrieve order details
- [ ] Can send KOT
- [ ] Can add payment
- [ ] Can generate bill

## 🎉 Success!

If all checks pass, your Order Management System is ready to use!

---

**Quick Reference:**
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 Console (if enabled): `http://localhost:8080/h2-console`
- Actuator: `http://localhost:8080/actuator`
- API Base: `http://localhost:8080/api/v1`

**Key Endpoints:**
- Orders: `/api/v1/orders`
- KOT: `/api/v1/orders/{uuid}/kot`
- Payments: `/api/v1/orders/{uuid}/payments`
- Search: `/api/v1/orders/search`
- Stats: `/api/v1/orders/restaurant/{id}/stats`

---

Happy Coding! 🚀

