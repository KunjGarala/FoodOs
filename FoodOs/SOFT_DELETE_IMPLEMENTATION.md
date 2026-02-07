# Soft Delete Implementation - Database Refactoring

## Overview
This document describes the implementation of a base entity class with soft delete functionality across all database entities in the FoodOs application.

## Base Entity Class

### Location
`org.foodos.common.entity.BaseSoftDeleteEntity`

### Features
- **Soft Delete Support**: All entities inherit `isDeleted` flag
- **Audit Timestamps**: Automatic `createdAt`, `updatedAt`, and `deletedAt` tracking
- **Hibernate Filter**: Pre-configured `deletedFilter` for filtering deleted records
- **Lifecycle Callbacks**: Automatic timestamp management via `@PrePersist` and `@PreUpdate`

### Code Structure
```java
@MappedSuperclass
@Getter
@Setter
@FilterDef(
    name = "deletedFilter",
    parameters = @ParamDef(
        name = "isDeleted",
        type = Boolean.class
    )
)
public abstract class BaseSoftDeleteEntity {
    protected Boolean isDeleted = false;
    protected LocalDateTime createdAt;
    protected LocalDateTime updatedAt;
    protected LocalDateTime deletedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isDeleted == null) {
            isDeleted = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

## Refactored Entities

All entities have been updated to extend `BaseSoftDeleteEntity` and follow industry best practices:

### 1. Restaurant Module
- **Restaurant** (`org.foodos.restaurant.entity.Restaurant`)
- **RestaurantTable** (`org.foodos.restaurant.entity.RestaurantTable`)
- **Reservation** (`org.foodos.restaurant.entity.Reservation`)

### 2. Product Module
- **Category** (`org.foodos.product.entity.Category`)
- **Product** (`org.foodos.product.entity.Product`)
- **ProductVariation** (`org.foodos.product.entity.ProductVariation`)
- **ModifierGroup** (`org.foodos.product.entity.ModifierGroup`)
- **Modifier** (`org.foodos.product.entity.Modifier`)

### 3. Authentication Module
- **UserAuthEntity** (`org.foodos.auth.entity.UserAuthEntity`)

## Changes Made to Each Entity

### Common Changes
1. **Inheritance**: Changed from standalone entity to extend `BaseSoftDeleteEntity`
2. **Builder Pattern**: Changed `@Builder` to `@SuperBuilder` for proper inheritance support
3. **Removed Duplicate Fields**:
   - `isDeleted` (now in base class)
   - `createdAt` (now in base class)
   - `updatedAt` (now in base class)
   - `deletedAt` (already in base class for some entities)
4. **Updated Lifecycle Methods**:
   - `@PrePersist` methods now call `super.onCreate()` before entity-specific logic
   - Removed redundant `@PreUpdate` methods (handled by base class)
5. **Removed Duplicate Annotations**:
   - `@FilterDef` removed (now in base class)
   - Kept `@Filter` and `@SQLDelete` on each entity (entity-specific)

### Specific Entity Notes

#### Restaurant
- Maintains custom UUID generation logic
- Keeps `isActive` flag (business logic requirement)
- Complex relationships preserved

#### RestaurantTable
- UUID generation for table tracking
- Status management preserved
- Merge functionality intact

#### Reservation
- UUID generation for reservation tracking
- Status workflow preserved

#### Category
- Hierarchical structure maintained
- Visibility flags preserved
- UUID generation intact

#### Product
- Complex product management preserved
- Multiple pricing tiers maintained
- Inventory tracking preserved
- UUID generation intact

#### ProductVariation
- Variation-specific logic preserved
- Default variation handling maintained

#### ModifierGroup
- Selection type logic preserved
- Min/Max selection rules maintained

#### Modifier
- Price addition logic preserved
- Default modifier handling maintained

#### UserAuthEntity
- UserDetails interface implementation preserved
- Security features intact (locking, failed attempts)
- Role-based access control maintained
- Multi-tenant support preserved

## Industry Best Practices Applied

### 1. DRY Principle (Don't Repeat Yourself)
- Eliminated duplicate timestamp fields across all entities
- Centralized soft delete logic in base class
- Reusable lifecycle callbacks

### 2. Inheritance
- Proper use of `@MappedSuperclass` for entity inheritance
- `@SuperBuilder` for builder pattern with inheritance
- Protected fields for proper encapsulation

### 3. Separation of Concerns
- Base entity handles audit and soft delete concerns
- Specific entities focus on business logic
- Clean separation of technical vs business fields

### 4. Consistency
- All entities follow same pattern for soft delete
- Consistent naming conventions
- Uniform filter configuration

### 5. Maintainability
- Single point of change for audit fields
- Easier to add new audit features
- Simplified entity code

## Database Impact

### Schema Compatibility
- **No database migration required** - all fields already exist
- Column names remain unchanged
- Constraints preserved

### Existing Data
- All existing records will work without changes
- `isDeleted = false` default ensures backward compatibility
- Timestamps already tracked in most entities

## Usage Examples

### Creating New Entities
```java
Restaurant restaurant = Restaurant.builder()
    .name("Test Restaurant")
    .email("test@restaurant.com")
    // No need to set createdAt, updatedAt, isDeleted
    .build();
```

### Soft Delete
```java
// Automatic via @SQLDelete annotation
restaurantRepository.delete(restaurant);
// SQL: UPDATE restaurants SET is_deleted = true, deleted_at = now() WHERE id = ?
```

### Filtering Deleted Records
```java
// Enable filter in service/repository
@PreFilter(value = "filterObject.isDeleted = false")
// Or use Hibernate filter programmatically
entityManager.unwrap(Session.class)
    .enableFilter("deletedFilter")
    .setParameter("isDeleted", false);
```

### Accessing Audit Fields
```java
LocalDateTime created = entity.getCreatedAt();
LocalDateTime updated = entity.getUpdatedAt();
Boolean deleted = entity.getIsDeleted();
LocalDateTime deletedTime = entity.getDeletedAt();
```

## Testing Considerations

### Unit Tests
- Test entity creation sets timestamps correctly
- Test update operations update `updatedAt`
- Test soft delete sets `isDeleted` and `deletedAt`

### Integration Tests
- Verify filter excludes soft-deleted records
- Test cascade delete behavior
- Verify audit trail accuracy

## Migration Checklist

✅ Created `BaseSoftDeleteEntity` base class
✅ Updated Restaurant entity
✅ Updated RestaurantTable entity
✅ Updated Reservation entity
✅ Updated Category entity
✅ Updated Product entity
✅ Updated ProductVariation entity
✅ Updated ModifierGroup entity
✅ Updated Modifier entity
✅ Updated UserAuthEntity entity
✅ Maintained all business logic
✅ Preserved all relationships
✅ Maintained UUID generation
✅ No breaking changes to API
✅ Documentation created

## Future Enhancements

### Potential Additions to Base Class
1. **Created By / Updated By Tracking**
   ```java
   @ManyToOne
   protected UserAuthEntity createdBy;
   
   @ManyToOne
   protected UserAuthEntity updatedBy;
   ```

2. **Version Control**
   ```java
   @Version
   protected Long version;
   ```

3. **Tenant Isolation**
   ```java
   @Column(name = "tenant_id")
   protected Long tenantId;
   ```

4. **Soft Delete Reason**
   ```java
   @Column(name = "delete_reason")
   protected String deleteReason;
   ```

## Conclusion

The refactoring successfully:
- Centralizes common entity concerns
- Eliminates code duplication
- Follows industry best practices
- Maintains backward compatibility
- Improves code maintainability
- Sets foundation for future enhancements

All entities now benefit from consistent soft delete and audit functionality while maintaining their specific business logic intact.
