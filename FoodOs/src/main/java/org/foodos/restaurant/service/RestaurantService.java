package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.DTO.Response.ProfileResponseDTO;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.mapper.UserProfileMapper;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.restaurant.dto.request.UpdateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.RestaurantHierarchyResponseDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.mapper.RestaurantMapper;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepo restaurantRepo;

    private final RestaurantMapper restaurantMapper;

    private final UserAuthRepository userRepository;

    private final UserProfileMapper profileMapper;

    @Transactional
    public RestaurantResponseDto createParentRestaurant(
            UserAuthEntity currentUser,
            CreateRestaurantRequestDto requestDto) {

        UserAuthEntity owner =
                userRepository.getReferenceById(currentUser.getId());

        if (!owner.isOwner()) {
            throw new BusinessException("Only owners can create restaurants");
        }

        if (restaurantRepo.existsByOwner(owner)) {
            throw new BusinessException(
                    "Owner already has a restaurant. Use multi-outlet feature.");
        }

        Restaurant restaurant = restaurantMapper.toEntity(requestDto);
        restaurant.setOwner(owner);
        restaurant.setOwnerName(owner.getFullName());

        Restaurant savedRestaurant = restaurantRepo.save(restaurant);

        owner.addRestaurant(savedRestaurant); // managed → auto flushed

        log.info("Restaurant created with ID: {}", savedRestaurant.getId());
        return restaurantMapper.toResponseDto(savedRestaurant);
    }


    @Transactional
    public RestaurantResponseDto createChildRestaurant(
            String parentRestaurantUuid,
            CreateRestaurantRequestDto requestDto,
            UserAuthEntity requestingUser
    ) {

        UserAuthEntity owner =
                userRepository.getReferenceById(requestingUser.getId());

        Restaurant parent = restaurantRepo
                .findByRestaurantUuidAnd(parentRestaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Parent restaurant not found"));

        if(!parent.isParentRestaurant()) {
            throw new BusinessException("Cannot create outlet for an outlet restaurant");
        }

        if (!parent.getOwner().getId().equals(owner.getId())) {
            throw new BusinessException(
                    "You can only create outlets for your own restaurants");
        }

        Restaurant child = restaurantMapper.toEntity(requestDto);
        child.setOwner(owner);
        child.setOwnerName(owner.getFullName());
        child.setIsActive(true);

        parent.addChildRestaurant(child);
        parent.setIsMultiOutlet(true);

        Restaurant savedChild = restaurantRepo.save(child);

        owner.addRestaurant(savedChild);

        log.info("Outlet restaurant created with ID: {}", savedChild.getId());
        return restaurantMapper.toResponseDto(savedChild);
    }


    @Transactional
    public RestaurantResponseDto updateRestaurant(String restaurantUuid, UpdateRestaurantRequestDto requestDto, UserAuthEntity currentUser) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAnd(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        if (!restaurant.getOwner().getId().equals(currentUser.getId()) && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException(
                    "You can only update your own restaurants");
        }

        if(requestDto.getLicenseKey() != null && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException("Only ADMIN users can update the license key.");
        }


        restaurantMapper.updateRestaurantFromDto(requestDto, restaurant);


        log.info("Restaurant updated with ID: {}", restaurant.getId());
        return restaurantMapper.toResponseDto(restaurant);
    }

    public RestaurantHierarchyResponseDto getRestaurantHierarchy(String restaurantUuid) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAnd(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        return restaurantMapper.toHierarchyResponseDto(restaurant);
    }

    public void deleteRestaurant(String restaurantUuid, UserAuthEntity currentUser) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAnd(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        if (!restaurant.getOwner().getId().equals(currentUser.getId()) && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException(
                    "You can only delete your own restaurants");
        }

        if(restaurant.isParentRestaurant() && !restaurant.getAllActiveChildRestaurants().isEmpty()) {
            throw new BusinessException("Cannot delete a parent restaurant with existing outlets. Please delete all outlets first.");
        }

        restaurantRepo.delete(restaurant);

        log.info("Restaurant deleted with ID: {}", restaurant.getId());
    }

    public RestaurantResponseDto getRestaurantDetail(String restaurantUuid) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAnd(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        return restaurantMapper.toResponseDto(restaurant);
    }


    public List<ProfileResponseDTO> getAllEmployeesByRole(
            String role,
            String restaurantUuid,
            UserAuthEntity currentUser
    ) {
        // 1. Validate and convert role
        UserRole requestedRole;
        try {
            requestedRole = UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid role: " + role);
        }

        // 2. Check if user has permission to view this role
        if (!hasPermissionToViewRole(currentUser, requestedRole)) {
            throw new BusinessException("You are not allowed to view employees with role: " + requestedRole);
        }

        List<UserAuthEntity> employees;

        // 3. Handle by current user role
        switch (currentUser.getRole()) {
            case MANAGER:
                // Manager can only view employees in their primary restaurant
                if (currentUser.getPrimaryRestaurant() == null) {
                    throw new BusinessException("Manager does not have an assigned restaurant");
                }

                employees = userRepository.findByRoleAndRestaurants_IdAndIsActiveTrue(
                        requestedRole,
                        currentUser.getPrimaryRestaurant().getId()
                );
                break;

            case OWNER:
                // Owner can view employees in specific restaurant or all their outlets
                if (restaurantUuid != null && !restaurantUuid.isBlank()) {
                    // Specific restaurant
                    Restaurant restaurant = restaurantRepo.findByRestaurantUuid(restaurantUuid)
                            .orElseThrow(() -> new BusinessException("Restaurant not found: " + restaurantUuid));

                    // Verify owner has access to this restaurant
                    if (!currentUser.canAccessRestaurant(restaurant.getId())) {
                        throw new BusinessException("You don't have access to this restaurant");
                    }

                    employees = userRepository.findByRoleAndRestaurants_IdAndIsActiveTrue(
                            requestedRole,
                            restaurant.getId()
                    );
                } else {
                    // All restaurants owned by this owner
                    Set<Long> restaurantIds = currentUser.getRestaurants().stream()
                            .map(Restaurant::getId)
                            .collect(Collectors.toSet());

                    if (restaurantIds.isEmpty()) {
                        return Collections.emptyList();
                    }

                    employees = userRepository.findByRoleAndRestaurants_IdInAndIsActiveTrue(
                            requestedRole,
                            restaurantIds
                    );
                }
                break;

            case ADMIN:
                // Admin can view system-wide (all restaurants)
                employees = userRepository.findByRoleAndIsActiveTrue(requestedRole);
                break;

            default:
                throw new BusinessException("You are not authorized to view employees");
        }

        // 4. Map to DTO and filter out the current user
        return employees.stream()
                .filter(emp -> !emp.getId().equals(currentUser.getId())) // Exclude self
                .map(profileMapper::toProfileDTO)
                .collect(Collectors.toList());
    }

    // Helper method to check if user can view a specific role
    private boolean hasPermissionToViewRole(UserAuthEntity currentUser, UserRole requestedRole) {
        // Users cannot view roles higher than their own
        return requestedRole.getLevel() <= currentUser.getRole().getLevel();
    }

}
