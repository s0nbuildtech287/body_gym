package com.bodygym.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutStatsResponse {
    private long totalWorkouts;
    private double totalVolumeKg;
    private int currentStreakDays;
    private int bestStreakDays;
    private Map<String, Integer> bodyPartFrequency;
    private List<WeeklyVolumeData> weeklyVolumes;
    private List<MuscleRecoveryStatus> muscleRecoveries;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyVolumeData {
        private String weekLabel;
        private double volumeKg;
        private int workoutCount;
    }
}
