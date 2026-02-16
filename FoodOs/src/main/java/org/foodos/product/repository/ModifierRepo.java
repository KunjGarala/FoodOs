package org.foodos.product.repository;

import org.foodos.product.entity.Modifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModifierRepo extends JpaRepository<Modifier, Long> {

    Optional<Modifier> findByModifierUuidAndIsDeletedFalse(String modifierUuid);

    List<Modifier> findByModifierGroup_ModifierGroupUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(
            String modifierGroupUuid);

    List<Modifier> findByModifierGroup_ModifierGroupUuidAndIsDeletedFalseOrderBySortOrderAsc(
            String modifierGroupUuid);

    boolean existsBySku(String sku);

    boolean existsBySkuAndModifierUuidNot(String sku, String modifierUuid);

    @Query("SELECT m FROM Modifier m WHERE m.modifierGroup.modifierGroupUuid = :modifierGroupUuid " +
           "AND m.isDefault = true AND m.isDeleted = false")
    List<Modifier> findDefaultModifiers(@Param("modifierGroupUuid") String modifierGroupUuid);

    @Query("SELECT COUNT(m) FROM Modifier m WHERE m.modifierGroup.modifierGroupUuid = :modifierGroupUuid " +
           "AND m.isDeleted = false")
    long countByModifierGroupUuid(@Param("modifierGroupUuid") String modifierGroupUuid);
}
