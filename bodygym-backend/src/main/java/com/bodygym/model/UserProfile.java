package com.bodygym.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    private String gender; // "male", "female"

    private Integer age;

    private Double heightCm;

    private Double weightKg;

    private String fitnessGoal; // "hypertrophy", "strength", "fat_loss", "maintenance"

    private String activityLevel; // "sedentary", "light", "moderate", "very_active", "extra_active"

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
