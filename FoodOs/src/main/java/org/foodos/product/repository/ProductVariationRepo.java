package org.foodos.product.repository;

import org.foodos.product.entity.ProductVariation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariationRepo extends JpaRepository<ProductVariation, Long> {

    Optional<ProductVariation> findByVariationUuid(String variationUuid);

    List<ProductVariation> findByProduct_ProductUuidAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(String productUuid);

    List<ProductVariation> findByProduct_ProductUuidAndIsDeletedFalseOrderBySortOrderAsc(String productUuid);

    boolean existsBySku(String sku);

    boolean existsBySkuAndVariationUuidNot(String sku, String variationUuid);

    @Query("SELECT v FROM ProductVariation v WHERE v.product.productUuid = :productUuid AND v.isDefault = true AND v.isDeleted = false")
    Optional<ProductVariation> findDefaultVariation(@Param("productUuid") String productUuid);

    @Query("SELECT COUNT(v) FROM ProductVariation v WHERE v.product.productUuid = :productUuid AND v.isDeleted = false")
    long countByProductUuid(@Param("productUuid") String productUuid);
}
