package com.bodygym.controller;

import com.bodygym.dto.MuscleRecoveryStatus;
import com.bodygym.dto.WorkoutLogRequest;
import com.bodygym.dto.WorkoutStatsResponse;
import com.bodygym.model.WorkoutLog;
import com.bodygym.service.WorkoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkoutController {

    private final WorkoutService workoutService;

    @PostMapping("/log")
    public ResponseEntity<WorkoutLog> logWorkout(@RequestBody WorkoutLogRequest request) {
        return ResponseEntity.ok(workoutService.saveWorkout(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<WorkoutLog>> getHistory() {
        return ResponseEntity.ok(workoutService.getWorkoutHistory());
    }

    @GetMapping("/stats")
    public ResponseEntity<WorkoutStatsResponse> getStats() {
        return ResponseEntity.ok(workoutService.getWorkoutStats());
    }

    @GetMapping("/recovery")
    public ResponseEntity<List<MuscleRecoveryStatus>> getRecoveryHeatmap() {
        return ResponseEntity.ok(workoutService.getWorkoutStats().getMuscleRecoveries());
    }
}
