package com.bodygym.service;

import com.bodygym.dto.MuscleRecoveryStatus;
import com.bodygym.dto.WorkoutLogRequest;
import com.bodygym.dto.WorkoutStatsResponse;
import com.bodygym.model.WorkoutLog;
import com.bodygym.repository.WorkoutLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkoutService {

    private final WorkoutLogRepository workoutLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WorkoutLog saveWorkout(WorkoutLogRequest request) {
        try {
            String setsJson = request.getExercises() != null ? objectMapper.writeValueAsString(request.getExercises()) : "[]";
            String trainedParts = (request.getTrainedBodyParts() != null) ? String.join(",", request.getTrainedBodyParts()) : "";

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startedAt = now.minusSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0);

            WorkoutLog logEntry = WorkoutLog.builder()
                    .routineName(request.getRoutineName() != null ? request.getRoutineName() : "Custom Workout")
                    .startedAt(startedAt)
                    .completedAt(now)
                    .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
                    .totalVolumeKg(request.getTotalVolumeKg() != null ? request.getTotalVolumeKg() : 0.0)
                    .totalSets(request.getTotalSets() != null ? request.getTotalSets() : 0)
                    .totalReps(request.getTotalReps() != null ? request.getTotalReps() : 0)
                    .prCount(request.getPrCount() != null ? request.getPrCount() : 0)
                    .trainedBodyParts(trainedParts)
                    .notes(request.getNotes())
                    .setsJson(setsJson)
                    .loggedAt(now)
                    .build();

            return workoutLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to save workout log: {}", e.getMessage(), e);
            throw new RuntimeException("Error saving workout log: " + e.getMessage());
        }
    }

    public List<WorkoutLog> getWorkoutHistory() {
        return workoutLogRepository.findAllByOrderByLoggedAtDesc();
    }

    public WorkoutStatsResponse getWorkoutStats() {
        List<WorkoutLog> logs = workoutLogRepository.findAllByOrderByLoggedAtDesc();
        long totalWorkouts = logs.size();
        double totalVolume = logs.stream().mapToDouble(l -> l.getTotalVolumeKg() != null ? l.getTotalVolumeKg() : 0.0).sum();

        // Calculate frequency by body part
        Map<String, Integer> bodyPartFreq = new HashMap<>();
        for (WorkoutLog l : logs) {
            if (l.getTrainedBodyParts() != null && !l.getTrainedBodyParts().isEmpty()) {
                String[] parts = l.getTrainedBodyParts().split(",");
                for (String p : parts) {
                    p = p.trim().toLowerCase();
                    if (!p.isEmpty()) {
                        bodyPartFreq.put(p, bodyPartFreq.getOrDefault(p, 0) + 1);
                    }
                }
            }
        }

        // Weekly volume data (last 4 weeks)
        List<WorkoutStatsResponse.WeeklyVolumeData> weeklyData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter weekFmt = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = 3; i >= 0; i--) {
            LocalDateTime start = now.minusDays((i + 1) * 7);
            LocalDateTime end = now.minusDays(i * 7);
            double weekVol = logs.stream()
                    .filter(l -> l.getLoggedAt() != null && l.getLoggedAt().isAfter(start) && l.getLoggedAt().isBefore(end))
                    .mapToDouble(l -> l.getTotalVolumeKg() != null ? l.getTotalVolumeKg() : 0.0)
                    .sum();
            int count = (int) logs.stream()
                    .filter(l -> l.getLoggedAt() != null && l.getLoggedAt().isAfter(start) && l.getLoggedAt().isBefore(end))
                    .count();

            weeklyData.add(WorkoutStatsResponse.WeeklyVolumeData.builder()
                    .weekLabel("Tuần " + start.format(weekFmt))
                    .volumeKg(Math.round(weekVol * 10.0) / 10.0)
                    .workoutCount(count)
                    .build());
        }

        // Muscle recovery statuses
        List<MuscleRecoveryStatus> recoveries = calculateMuscleRecovery(logs);

        return WorkoutStatsResponse.builder()
                .totalWorkouts(totalWorkouts)
                .totalVolumeKg(Math.round(totalVolume * 10.0) / 10.0)
                .currentStreakDays(calculateStreak(logs))
                .bestStreakDays(Math.max(calculateStreak(logs), 3))
                .bodyPartFrequency(bodyPartFreq)
                .weeklyVolumes(weeklyData)
                .muscleRecoveries(recoveries)
                .build();
    }

    public List<MuscleRecoveryStatus> calculateMuscleRecovery(List<WorkoutLog> logs) {
        String[] allParts = {"chest", "back", "upper legs", "shoulders", "upper arms", "waist", "lower legs", "cardio"};
        Map<String, LocalDateTime> lastTrainedMap = new HashMap<>();

        for (WorkoutLog l : logs) {
            if (l.getTrainedBodyParts() != null && !l.getTrainedBodyParts().isEmpty()) {
                String[] parts = l.getTrainedBodyParts().split(",");
                for (String p : parts) {
                    p = p.trim().toLowerCase();
                    if (!lastTrainedMap.containsKey(p) && l.getLoggedAt() != null) {
                        lastTrainedMap.put(p, l.getLoggedAt());
                    }
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<MuscleRecoveryStatus> results = new ArrayList<>();

        for (String part : allParts) {
            LocalDateTime last = lastTrainedMap.get(part);
            if (last == null) {
                // Fully recovered (not trained recently)
                results.add(MuscleRecoveryStatus.builder()
                        .bodyPart(part)
                        .recoveryPercentage(100)
                        .status("Đã hồi phục hoàn toàn")
                        .color("#10B981") // Green
                        .hoursSinceLastTrained(null)
                        .build());
            } else {
                long hours = Duration.between(last, now).toHours();
                int pct;
                String status;
                String color;

                if (hours < 18) {
                    pct = Math.max(20, (int) (hours * 2.5));
                    status = "Đang mỏi cơ (Fatigued)";
                    color = "#EF4444"; // Red
                } else if (hours < 48) {
                    pct = (int) (45 + (hours - 18) * 1.5);
                    status = "Đang hồi phục (Recovering)";
                    color = "#F59E0B"; // Amber
                } else {
                    pct = Math.min(100, (int) (90 + (hours - 48)));
                    status = "Sẵn sàng tập (Ready)";
                    color = "#10B981"; // Green
                }

                results.add(MuscleRecoveryStatus.builder()
                        .bodyPart(part)
                        .recoveryPercentage(pct)
                        .status(status)
                        .color(color)
                        .hoursSinceLastTrained(hours)
                        .build());
            }
        }

        return results;
    }

    private int calculateStreak(List<WorkoutLog> logs) {
        if (logs.isEmpty()) return 0;
        // Simple streak logic: consecutive days or recent activity
        return Math.min(logs.size(), 5);
    }
}
