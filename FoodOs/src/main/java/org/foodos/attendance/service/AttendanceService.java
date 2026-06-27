package org.foodos.attendance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.attendance.dto.request.ClockInRequest;
import org.foodos.attendance.dto.response.AttendanceResponse;
import org.foodos.attendance.entity.Attendance;
import org.foodos.attendance.repository.AttendanceRepository;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.common.security.RestaurantAccessGuard;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RestaurantRepo restaurantRepo;
    private final RestaurantAccessGuard restaurantAccessGuard;

    @Transactional
    public AttendanceResponse clockIn(UserAuthEntity currentUser, ClockInRequest request) {
        restaurantAccessGuard.assertCanAccess(request.getRestaurantUuid());

        attendanceRepository.findOpenShift(currentUser.getId()).ifPresent(open -> {
            throw new BusinessException("You already have an open shift; clock out first");
        });

        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(request.getRestaurantUuid())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Restaurant not found: " + request.getRestaurantUuid()));

        Attendance attendance = Attendance.builder()
                .user(currentUser)
                .restaurant(restaurant)
                .clockInAt(LocalDateTime.now())
                .build();

        attendance = attendanceRepository.save(attendance);
        log.info("Clock-in user={} restaurant={}", currentUser.getUserUuid(), request.getRestaurantUuid());

        return toResponse(attendance);
    }

    @Transactional
    public AttendanceResponse clockOut(UserAuthEntity currentUser) {
        Attendance attendance = attendanceRepository.findOpenShift(currentUser.getId())
                .orElseThrow(() -> new BusinessException("No open shift to clock out from"));

        attendance.setClockOutAt(LocalDateTime.now());
        attendance = attendanceRepository.save(attendance);
        log.info("Clock-out user={} attendance={}", currentUser.getUserUuid(), attendance.getAttendanceUuid());

        return toResponse(attendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getOnShift(String restaurantUuid) {
        restaurantAccessGuard.assertCanAccess(restaurantUuid);
        return attendanceRepository.findOnShiftByRestaurantUuid(restaurantUuid)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AttendanceResponse toResponse(Attendance a) {
        UserAuthEntity u = a.getUser();
        return AttendanceResponse.builder()
                .attendanceUuid(a.getAttendanceUuid())
                .userUuid(u != null ? u.getUserUuid() : null)
                .userName(u != null ? u.getFullName() : null)
                .role(u != null && u.getRole() != null ? u.getRole().name() : null)
                .restaurantUuid(a.getRestaurant() != null ? a.getRestaurant().getRestaurantUuid() : null)
                .clockInAt(a.getClockInAt())
                .clockOutAt(a.getClockOutAt())
                .onShift(a.isOnShift())
                .build();
    }
}
