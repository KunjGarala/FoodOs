# Quick Reference: Order API UUID Changes

## Updated API Endpoints

### Query Operations

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/api/v1/orders/restaurant/{restaurantUuid}` | GET | `restaurantUuid` (String), `Pageable` | List all orders for restaurant |
| `/api/v1/orders/restaurant/{restaurantUuid}/active` | GET | `restaurantUuid` (String) | Get active orders |
| `/api/v1/orders/restaurant/{restaurantUuid}/kitchen` | GET | `restaurantUuid` (String) | Get kitchen orders (KDS) |
| `/api/v1/orders/restaurant/{restaurantUuid}/date/{date}` | GET | `restaurantUuid` (String), `date` (LocalDate) | Get orders by date |
| `/api/v1/orders/restaurant/{restaurantUuid}/pending-payments` | GET | `restaurantUuid` (String) | Get orders with pending payments |
| `/api/v1/orders/search` | GET | `restaurantUuid` (param), `searchTerm` (param) | Search orders |
| `/api/v1/orders/table/{tableUuid}/active` | GET | `tableUuid` (String) | Get active order for table |

### Statistics Operations

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/api/v1/orders/restaurant/{restaurantUuid}/stats/count` | GET | `restaurantUuid` (String), `date` (param) | Total orders count |
| `/api/v1/orders/restaurant/{restaurantUuid}/stats/sales` | GET | `restaurantUuid` (String), `date` (param) | Total sales amount |
| `/api/v1/orders/restaurant/{restaurantUuid}/stats/average` | GET | `restaurantUuid` (String), `date` (param) | Average order value |

## Example API Calls

### Get Active Orders
```bash
curl -X GET "http://localhost:8080/api/v1/orders/restaurant/550e8400-e29b-41d4-a716-446655440000/active" \
  -H "Authorization: Bearer {token}"
```

### Get Active Order by Table
```bash
curl -X GET "http://localhost:8080/api/v1/orders/table/660e8400-e29b-41d4-a716-446655440001/active" \
  -H "Authorization: Bearer {token}"
```

### Search Orders
```bash
curl -X GET "http://localhost:8080/api/v1/orders/search?restaurantUuid=550e8400-e29b-41d4-a716-446655440000&searchTerm=pizza" \
  -H "Authorization: Bearer {token}"
```

### Get Statistics
```bash
# Order count
curl -X GET "http://localhost:8080/api/v1/orders/restaurant/550e8400-e29b-41d4-a716-446655440000/stats/count?date=2024-01-15" \
  -H "Authorization: Bearer {token}"

# Total sales
curl -X GET "http://localhost:8080/api/v1/orders/restaurant/550e8400-e29b-41d4-a716-446655440000/stats/sales?date=2024-01-15" \
  -H "Authorization: Bearer {token}"

# Average order value
curl -X GET "http://localhost:8080/api/v1/orders/restaurant/550e8400-e29b-41d4-a716-446655440000/stats/average?date=2024-01-15" \
  -H "Authorization: Bearer {token}"
```

## Migration Checklist for Frontend/API Consumers

- [ ] Update all API calls to use `restaurantUuid` instead of `restaurantId`
- [ ] Update all API calls to use `tableUuid` instead of `tableId`
- [ ] Update request parameter names in search endpoints
- [ ] Verify UUID format validation in your client code
- [ ] Update API documentation/Swagger
- [ ] Update Postman collections
- [ ] Test all updated endpoints
- [ ] Update any hardcoded IDs to UUIDs in test data

## Common Issues & Solutions

### Issue: "Restaurant not found"
**Solution**: Ensure you're passing the `restaurantUuid` (e.g., `550e8400-e29b-41d4-a716-446655440000`) not the database ID (e.g., `123`)

### Issue: "Table not found" 
**Solution**: Ensure you're passing the `tableUuid` (e.g., `660e8400-e29b-41d4-a716-446655440001`) not the database ID (e.g., `456`)

### Issue: "Invalid UUID format"
**Solution**: Verify the UUID follows the standard format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Notes for Developers

- UUIDs are case-insensitive but conventionally lowercase
- All UUIDs should be 36 characters (including hyphens)
- Old ID-based repository methods still exist for internal use
- The database schema remains unchanged - only the API layer uses UUIDs

