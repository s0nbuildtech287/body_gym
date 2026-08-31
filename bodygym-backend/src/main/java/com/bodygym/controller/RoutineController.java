package com.bodygym.controller;

import com.bodygym.dto.RoutineRequest;
import com.bodygym.model.Routine;
import com.bodygym.repository.RoutineRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoutineController {

    private final RoutineRepository routineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<List<Routine>> getAllRoutines() {
        return ResponseEntity.ok(routineRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/presets")
    public ResponseEntity<List<Routine>> getPresetRoutines() {
        return ResponseEntity.ok(routineRepository.findByIsPresetTrue());
    }

    @GetMapping("/custom")
    public ResponseEntity<List<Routine>> getCustomRoutines() {
        return ResponseEntity.ok(routineRepository.findByIsPresetFalseOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Routine> getRoutineById(@PathVariable Long id) {
        return routineRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Routine> createRoutine(@RequestBody RoutineRequest request) {
        try {
            String exercisesJson = request.getExercises() != null ? objectMapper.writeValueAsString(request.getExercises()) : "[]";
            Routine routine = Routine.builder()
                    .name(request.getName())
                    .description(request.getDescription())
                    .targetFocus(request.getTargetFocus())
                    .level(request.getLevel() != null ? request.getLevel() : "Intermediate")
                    .estimatedMinutes(request.getEstimatedMinutes() != null ? request.getEstimatedMinutes() : 45)
                    .isPreset(request.getIsPreset() != null ? request.getIsPreset() : false)
                    .exercisesJson(exercisesJson)
                    .build();

            return ResponseEntity.ok(routineRepository.save(routine));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoutine(@PathVariable Long id) {
        if (routineRepository.existsById(id)) {
            routineRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
