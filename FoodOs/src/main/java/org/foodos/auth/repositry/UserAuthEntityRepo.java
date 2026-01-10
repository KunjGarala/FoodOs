package org.foodos.auth.repositry;

import org.foodos.auth.entity.UserAuthEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthEntityRepo extends JpaRepository<UserAuthEntity, Long> {

    Optional<UserAuthEntity> findByUsernameOrEmail(String username , String email);

    boolean existsByUsername(String username);

    Optional<UserAuthEntity> findByEmail(String email);
}
