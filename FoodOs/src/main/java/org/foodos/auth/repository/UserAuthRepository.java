package org.foodos.auth.repository;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserAuthRepository extends JpaRepository<UserAuthEntity, Long> {

    /* ================= AUTH ================= */

    Optional<UserAuthEntity> findByUsername(String username);

    Optional<UserAuthEntity> findByEmail(String email);

    Optional<UserAuthEntity> findByEmailVerificationCode(String code);

    /* ================= EXISTS (FIXED) ================= */

    boolean existsByUsernameAndIsDeletedFalse(String username);

    boolean existsByEmailAndIsDeletedFalse(String email);

    /* ================= ROLE + RESTAURANT ================= */

    List<UserAuthEntity> findByRoleAndRestaurants_IdAndIsActiveTrueAndIsDeletedFalse(
            UserRole requestedRole,
            Long restaurantId
    );

    List<UserAuthEntity> findByRoleAndRestaurants_IdInAndIsActiveTrueAndIsDeletedFalse(
            UserRole requestedRole,
            Set<Long> restaurantIds
    );

    /* ================= ADMIN / REPORTING ================= */

    List<UserAuthEntity> findByRole(UserRole requestedRole);
}
