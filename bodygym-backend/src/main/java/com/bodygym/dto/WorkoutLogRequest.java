package com.bodygym.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutLogRequest {
    private String routineName;
    private Integer durationSeconds;
    private Double totalVolumeKg;
    private Integer totalSets;
    private Integer totalReps;
    private Integer prCount;
    private List<String> trainedBodyParts;
    private String notes;
    private List<ExerciseLogItem> exercises;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExerciseLogItem {
        private String exerciseId;
        private String exerciseName;
        private String bodyPart;
        private String gifUrl;
        private List<SetLogItem> sets;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SetLogItem {
        private int setNumber;
        private String type; // "W" (Warmup), "N" (Normal), "D" (Drop), "F" (Failure)
        private double weightKg;
        private int reps;
        private Integer rpe;
        private boolean isCompleted;
        private boolean isPr;
    }
}
