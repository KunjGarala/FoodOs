package org.foodos.auth.repository;

import org.foodos.auth.entity.UserAuthEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuthEntity, Long> {

    Optional<UserAuthEntity> findByUsername(String username);
    Optional<UserAuthEntity> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    Optional<UserAuthRepository> findByUsernameAndDeletedAtIsNull(String username);
}
