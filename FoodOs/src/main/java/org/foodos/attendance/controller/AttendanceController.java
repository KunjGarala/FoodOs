package org.foodos.attendance.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.attendance.dto.request.ClockInRequest;
import org.foodos.attendance.dto.response.AttendanceResponse;
import org.foodos.attendance.service.AttendanceService;
import org.foodos.auth.entity.UserAuthEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Clock-in / clock-out and on-shift roster")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @Operation(summary = "Clock in", description = "Starts a shift for the authenticated user at the given outlet")
    @PostMapping("/clock-in")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CHEF')")
    public ResponseEntity<AttendanceResponse> clockIn(
            @Valid @RequestBody ClockInRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
        return ResponseEntity.ok(attendanceService.clockIn(currentUser, request));
    }

    @Operation(summary = "Clock out", description = "Ends the current open shift for the authenticated user")
    @PostMapping("/clock-out")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'CHEF')")
    public ResponseEntity<AttendanceResponse> clockOut(
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
        return ResponseEntity.ok(attendanceService.clockOut(currentUser));
    }

    @Operation(summary = "On-shift roster", description = "Currently-clocked-in staff for an outlet")
    @GetMapping("/on-shift")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
    public ResponseEntity<List<AttendanceResponse>> onShift(@RequestParam String restaurantUuid) {
        return ResponseEntity.ok(attendanceService.getOnShift(restaurantUuid));
    }
}
