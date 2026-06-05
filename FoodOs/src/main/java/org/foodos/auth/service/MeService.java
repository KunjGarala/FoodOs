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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

        // Collect every outlet the user can see: their directly-assigned outlets
        // (user_restaurants) AND the active child outlets of each. Traversing the
        // parent → childRestaurants tree means a chain owner sees every outlet on
        // the picker even if a child was never written into the join table.
        // Primary first, then assigned outlets, then their children; deduped by UUID.
        Map<String, Restaurant> byUuid = new LinkedHashMap<>();
        if (primaryActive) {
            collectWithActiveChildren(primary, byUuid);
        }
        for (Restaurant r : user.getRestaurants()) {
            collectWithActiveChildren(r, byUuid);
        }

        List<RestaurantBasicDTO> outlets = byUuid.values().stream()
                .map(userProfileMapper::toRestaurantBasicDTO)
                .toList();

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
     * Adds {@code restaurant} and its active child outlets to {@code acc} (keyed by
     * UUID, so order is preserved and duplicates are skipped). Inactive restaurants
     * are ignored. Chains are one level deep (a child outlet has no children of its
     * own), so a single pass over {@link Restaurant#getAllActiveChildRestaurants()}
     * is enough.
     */
    private void collectWithActiveChildren(Restaurant restaurant, Map<String, Restaurant> acc) {
        if (restaurant == null || !Boolean.TRUE.equals(restaurant.getIsActive())) {
            return;
        }
        acc.putIfAbsent(restaurant.getRestaurantUuid(), restaurant);
        for (Restaurant child : restaurant.getAllActiveChildRestaurants()) {
            if (child != null) {
                acc.putIfAbsent(child.getRestaurantUuid(), child);
            }
        }
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
