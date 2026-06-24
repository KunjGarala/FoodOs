package org.foodos.attendance.repository;

import org.foodos.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a " +
           "WHERE a.user.id = :userId " +
           "AND a.clockOutAt IS NULL " +
           "AND a.isDeleted = false " +
           "ORDER BY a.clockInAt DESC")
    Optional<Attendance> findOpenShift(@Param("userId") Long userId);

    @Query("SELECT a FROM Attendance a " +
           "WHERE a.restaurant.restaurantUuid = :restaurantUuid " +
           "AND a.clockOutAt IS NULL " +
           "AND a.isDeleted = false " +
           "ORDER BY a.clockInAt ASC")
    List<Attendance> findOnShiftByRestaurantUuid(@Param("restaurantUuid") String restaurantUuid);
}
