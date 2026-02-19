package org.foodos.order.repository;

import org.foodos.order.entity.KitchenOrderTicket;
import org.foodos.order.entity.enums.KotTicketStatus;
import org.foodos.order.entity.enums.KotType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Kitchen Order Ticket Repository
 */
@Repository
public interface KitchenOrderTicketRepository extends JpaRepository<KitchenOrderTicket, Long> {

    Optional<KitchenOrderTicket> findByKotUuidAndIsDeletedFalse(String kotUuid);

    Optional<KitchenOrderTicket> findByKotNumberAndIsDeletedFalse(String kotNumber);

    @Query("SELECT kot FROM KitchenOrderTicket kot WHERE kot.order.id = :orderId AND kot.isDeleted = false ORDER BY kot.kotTime DESC")
    List<KitchenOrderTicket> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT kot FROM KitchenOrderTicket kot WHERE kot.restaurant.id = :restaurantId AND kot.kotDate = :kotDate AND kot.isDeleted = false ORDER BY kot.kotTime DESC")
    List<KitchenOrderTicket> findByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("kotDate") LocalDate kotDate);

    @Query("SELECT kot FROM KitchenOrderTicket kot WHERE kot.restaurant.restaurantUuid = :restaurantUUid AND kot.status IN :statuses AND kot.isDeleted = false ORDER BY kot.priority DESC, kot.kotTime ASC")
    List<KitchenOrderTicket> findByRestaurantAndStatusIn(@Param("restaurantUUid") String restaurantUUid, @Param("statuses") List<KotTicketStatus> statuses);

    @Query("SELECT kot FROM KitchenOrderTicket kot WHERE kot.restaurant.id = :restaurantId AND kot.printerTarget = :printerTarget AND kot.status IN :statuses AND kot.isDeleted = false ORDER BY kot.priority DESC, kot.kotTime ASC")
    List<KitchenOrderTicket> findByRestaurantAndPrinterTargetAndStatusIn(@Param("restaurantId") Long restaurantId,
                                                                           @Param("printerTarget") String printerTarget,
                                                                           @Param("statuses") List<KotTicketStatus> statuses);

    @Query("SELECT kot FROM KitchenOrderTicket kot WHERE kot.restaurant.id = :restaurantId AND kot.kotDate = :kotDate AND kot.kotType = :kotType AND kot.isDeleted = false")
    List<KitchenOrderTicket> findByRestaurantAndDateAndType(@Param("restaurantId") Long restaurantId,
                                                              @Param("kotDate") LocalDate kotDate,
                                                              @Param("kotType") KotType kotType);

    @Query("SELECT MAX(CAST(SUBSTRING(kot.kotNumber, LENGTH(:prefix) + 1) AS integer)) FROM KitchenOrderTicket kot WHERE kot.restaurant.id = :restaurantId AND kot.kotNumber LIKE CONCAT(:prefix, '%') AND kot.kotDate = :kotDate")
    Optional<Integer> findMaxKotNumberForDate(@Param("restaurantId") Long restaurantId, @Param("prefix") String prefix, @Param("kotDate") LocalDate kotDate);

    @Query("SELECT COUNT(kot) FROM KitchenOrderTicket kot WHERE kot.restaurant.id = :restaurantId AND kot.kotDate = :kotDate AND kot.isDeleted = false")
    Long countByRestaurantAndDate(@Param("restaurantId") Long restaurantId, @Param("kotDate") LocalDate kotDate);

    boolean existsByKotNumberAndIsDeletedFalse(String kotNumber);
}

