package org.foodos.auth.repository;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserAuthRepository extends JpaRepository<UserAuthEntity, Long> {

    Optional<UserAuthEntity> findByUsername(String username);
    Optional<UserAuthEntity> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    Optional<UserAuthEntity> findByUsernameAndDeletedAtIsNull(String username);

    Optional<UserAuthEntity> findByEmailVerificationCode(String code);

    List<UserAuthEntity> findByRoleAndRestaurants_IdAndIsActiveTrue(UserRole requestedRole, Long id);

    List<UserAuthEntity> findByRoleAndRestaurants_IdInAndIsActiveTrue(UserRole requestedRole, Set<Long> restaurantIds);

    List<UserAuthEntity> findByRole(UserRole requestedRole);
}
