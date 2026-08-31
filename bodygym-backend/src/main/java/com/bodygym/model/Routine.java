package com.bodygym.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "routines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Routine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String targetFocus; // e.g. "Chest & Triceps", "Push", "Full Body"

    private String level; // "Beginner", "Intermediate", "Advanced"

    private Integer estimatedMinutes;

    private Boolean isPreset; // true if built-in system preset, false if custom user created

    @Column(columnDefinition = "TEXT")
    private String exercisesJson; // JSON array of RoutineExerciseItem

    private LocalDateTime createdAt;

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isPreset == null) {
            isPreset = false;
        }
    }
}
