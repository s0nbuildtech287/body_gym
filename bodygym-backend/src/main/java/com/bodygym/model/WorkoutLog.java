package com.bodygym.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String routineName;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private Integer durationSeconds;

    private Double totalVolumeKg; // Total tonnage (sets * reps * weight)

    private Integer totalSets;

    private Integer totalReps;

    private Integer prCount; // Number of personal records hit

    @Column(columnDefinition = "TEXT")
    private String trainedBodyParts; // comma separated e.g. "chest,shoulders,upper arms"

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String setsJson; // Detailed completed sets data

    private LocalDateTime loggedAt;

    @PrePersist
    public void onPrePersist() {
        if (loggedAt == null) {
            loggedAt = LocalDateTime.now();
        }
    }
}
