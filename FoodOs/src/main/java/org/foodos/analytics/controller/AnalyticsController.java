package org.foodos.analytics.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.analytics.dto.DashboardAnalyticsDto;
import org.foodos.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Dashboard analytics for owners and managers")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/v1/analytics/{restaurantUuid}/dashboard?days=7
     *
     * Returns a single payload containing:
     *  - today's summary (revenue, order count, avg order value)
     *  - yesterday's summary (for % change)
     *  - daily revenue chart for last `days` days
     *  - top 5 selling items for the chart period
     *  - hourly order distribution for today
     *  - order status breakdown for today
     */
    @GetMapping("/{restaurantUuid}/dashboard")
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    @Operation(
            summary     = "Get dashboard analytics",
            description = "Returns revenue chart, top items, hourly distribution and status breakdown"
    )
    public ResponseEntity<DashboardAnalyticsDto> getDashboardAnalytics(
            @PathVariable String restaurantUuid,
            @RequestParam(defaultValue = "7") int days) {

        log.info("Analytics request: restaurant={}, days={}", restaurantUuid, days);

        // Clamp to a safe range (1–30 days)
        int safeDays = Math.max(1, Math.min(days, 30));

        DashboardAnalyticsDto response = analyticsService.getDashboardAnalytics(restaurantUuid, safeDays);
        return ResponseEntity.ok(response);
    }
}