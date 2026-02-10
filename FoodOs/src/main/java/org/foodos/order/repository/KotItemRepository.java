package org.foodos.order.repository;

import org.foodos.order.entity.KotItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * KOT Item Repository
 */
@Repository
public interface KotItemRepository extends JpaRepository<KotItem, Long> {

    Optional<KotItem> findByKotItemUuid(String kotItemUuid);

    @Query("SELECT ki FROM KotItem ki WHERE ki.kitchenOrderTicket.id = :kotId ORDER BY ki.sortOrder ASC")
    List<KotItem> findByKotId(@Param("kotId") Long kotId);

    @Query("SELECT ki FROM KotItem ki WHERE ki.orderItem.id = :orderItemId")
    List<KotItem> findByOrderItemId(@Param("orderItemId") Long orderItemId);

    @Query("SELECT ki FROM KotItem ki WHERE ki.kitchenOrderTicket.id = :kotId AND ki.isCancelled = false ORDER BY ki.sortOrder ASC")
    List<KotItem> findActiveItemsByKotId(@Param("kotId") Long kotId);
}

