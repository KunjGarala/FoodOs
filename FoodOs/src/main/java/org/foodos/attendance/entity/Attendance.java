package org.foodos.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance",
        indexes = {
                @Index(name = "idx_attendance_user", columnList = "user_id"),
                @Index(name = "idx_attendance_restaurant", columnList = "restaurant_id"),
                @Index(name = "idx_attendance_clock_in", columnList = "clock_in_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Attendance extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_uuid", nullable = false, unique = true, updatable = false, length = 36)
    private String attendanceUuid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAuthEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "clock_in_at", nullable = false)
    private LocalDateTime clockInAt;

    @Column(name = "clock_out_at")
    private LocalDateTime clockOutAt;

    @PrePersist
    protected void prePersist() {
        super.onCreate();
        if (attendanceUuid == null) {
            attendanceUuid = UUID.randomUUID().toString();
        }
        if (clockInAt == null) {
            clockInAt = LocalDateTime.now();
        }
    }

    public boolean isOnShift() {
        return clockOutAt == null;
    }
}
