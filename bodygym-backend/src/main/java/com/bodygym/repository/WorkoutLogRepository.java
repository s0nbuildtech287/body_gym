package com.bodygym.repository;

import com.bodygym.model.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {
    List<WorkoutLog> findAllByOrderByLoggedAtDesc();
    
    List<WorkoutLog> findTop10ByOrderByLoggedAtDesc();

    @Query("SELECT w FROM WorkoutLog w WHERE w.loggedAt >= :since ORDER BY w.loggedAt DESC")
    List<WorkoutLog> findLogsSince(LocalDateTime since);

    @Query("SELECT SUM(w.totalVolumeKg) FROM WorkoutLog w")
    Double calculateTotalVolume();

    @Query("SELECT COUNT(w) FROM WorkoutLog w")
    Long countTotalWorkouts();
}
