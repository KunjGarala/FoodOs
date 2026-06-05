package org.foodos.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.dto.Response.MeContextResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.mapper.UserProfileMapper;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;
import org.foodos.restaurant.entity.Restaurant;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Serves the frontend bootstrap context (identity + accessible outlets) that used to ride
 * along in the JWT outlet claim. Keeping it here — DB-backed and cached — means the token
 * stays small and the outlet picker reflects access changes in (near) real time, while the
 * actual multi-tenancy check still lives in the service layer ({@code canAccessRestaurant}).
 *
 * <p>The result is cached per user UUID. Whenever a user's outlet access, primary outlet,
 * role, or active status changes, call {@link #evictContext(String)} so the next call
 * recomputes a fresh picker.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MeService {

    private final UserAuthRepository userAuthRepository;
    private final UserProfileMapper userProfileMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "meContext", key = "#userUuid")
    public MeContextResponse getContext(String userUuid) {
        UserAuthEntity user = userAuthRepository.findByUserUuidAndIsDeletedFalse(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Restaurant primary = user.getPrimaryRestaurant();
        boolean primaryActive = primary != null && Boolean.TRUE.equals(primary.getIsActive());

        // Active outlets, primary first, no duplicates — mirrors RestaurantGetUtil's ordering.
        List<RestaurantBasicDTO> outlets = new ArrayList<>();
        if (primaryActive) {
            outlets.add(userProfileMapper.toRestaurantBasicDTO(primary));
        }
        user.getRestaurants().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .filter(r -> !primaryActive
                        || !r.getRestaurantUuid().equals(primary.getRestaurantUuid()))
                .map(userProfileMapper::toRestaurantBasicDTO)
                .forEach(outlets::add);

        MeContextResponse.UserContext identity = MeContextResponse.UserContext.builder()
                .userUuid(user.getUserUuid())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .profilePictureUrl(user.getProfilePictureUrl())
                .hasPin(user.hasPin())
                .build();

        return MeContextResponse.builder()
                .user(identity)
                .restaurants(outlets)
                .primaryRestaurant(primaryActive ? userProfileMapper.toRestaurantBasicDTO(primary) : null)
                .primaryRestaurantUuid(primaryActive ? primary.getRestaurantUuid() : null)
                .build();
    }

    /**
     * Drops the cached context for a user so the next {@code /me/context} is recomputed.
     * Invoke from any flow that grants/revokes outlet access, changes the primary outlet,
     * or changes the user's role / active status.
     */
    @CacheEvict(value = "meContext", key = "#userUuid")
    public void evictContext(String userUuid) {
        log.debug("Evicted /me/context cache for user {}", userUuid);
    }
}
