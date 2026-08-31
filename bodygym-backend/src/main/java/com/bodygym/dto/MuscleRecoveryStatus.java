package com.bodygym.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MuscleRecoveryStatus {
    private String bodyPart; // "chest", "back", "upper legs", etc.
    private int recoveryPercentage; // 0 to 100%
    private String status; // "Fatigued" (<50%), "Recovering" (50-89%), "Fully Recovered" (90-100%)
    private String color; // hex code for visual heatmap e.g. #EF4444 (red), #F59E0B (amber), #10B981 (green)
    private Long hoursSinceLastTrained;
}
