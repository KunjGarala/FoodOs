package org.foodos.customer.repository;

import org.foodos.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Customer Repository
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // ===== BASIC FINDERS =====

    Optional<Customer> findByCustomerUuidAndIsDeletedFalse(String customerUuid);

    Optional<Customer> findByPhoneAndRestaurantIdAndIsDeletedFalse(String phone, Long restaurantId);

    Optional<Customer> findByPhoneAndRestaurant_RestaurantUuidAndIsDeletedFalse(String phone, String restaurantUuid);

    Optional<Customer> findByEmailIgnoreCaseAndRestaurantIdAndIsDeletedFalse(String email, Long restaurantId);

    // ===== RESTAURANT-SCOPED QUERIES =====

    @Query("SELECT c FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND c.isDeleted = false ORDER BY c.lastOrderDate DESC NULLS LAST")
    Page<Customer> findAllByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.restaurant.id = :restaurantId AND c.isDeleted = false ORDER BY c.lastOrderDate DESC NULLS LAST")
    Page<Customer> findAllByRestaurantId(@Param("restaurantId") Long restaurantId, Pageable pageable);

    // ===== SEARCH =====

    @Query("SELECT c FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.phone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "c.isDeleted = false ORDER BY c.lastOrderDate DESC NULLS LAST")
    Page<Customer> searchCustomers(@Param("restaurantUuid") String restaurantUuid,
                                   @Param("searchTerm") String searchTerm,
                                   Pageable pageable);

    // ===== STATISTICS =====

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND c.isDeleted = false")
    Long countByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND c.totalOrders > 1 AND c.isDeleted = false")
    Long countReturningCustomers(@Param("restaurantUuid") String restaurantUuid);

    // ===== TOP CUSTOMERS =====

    @Query("SELECT c FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND c.isDeleted = false ORDER BY c.totalSpent DESC")
    Page<Customer> findTopBySpending(@Param("restaurantUuid") String restaurantUuid, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.restaurant.restaurantUuid = :restaurantUuid AND c.isDeleted = false ORDER BY c.totalOrders DESC")
    Page<Customer> findTopByVisits(@Param("restaurantUuid") String restaurantUuid, Pageable pageable);

    boolean existsByPhoneAndRestaurantIdAndIsDeletedFalse(String phone, Long restaurantId);
}
