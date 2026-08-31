package com.bodygym.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutineRequest {
    private String name;
    private String description;
    private String targetFocus;
    private String level;
    private Integer estimatedMinutes;
    private Boolean isPreset;
    private List<RoutineExerciseItem> exercises;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoutineExerciseItem {
        private String exerciseId;
        private String exerciseName;
        private String bodyPart;
        private String target;
        private String equipment;
        private String image;
        private String gifUrl;
        private int defaultSets;
        private int targetReps;
        private int restSeconds;
    }
}
