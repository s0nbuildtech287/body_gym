package com.bodygym.controller;

import com.bodygym.model.Exercise;
import com.bodygym.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    public ResponseEntity<Page<Exercise>> getExercises(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String bodyPart,
            @RequestParam(required = false) String equipment,
            @RequestParam(required = false) String target,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(exerciseService.getExercises(search, bodyPart, equipment, target, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exercise> getExerciseById(@PathVariable String id) {
        return exerciseService.getExerciseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/meta")
    public ResponseEntity<Map<String, Object>> getMetadata() {
        return ResponseEntity.ok(exerciseService.getExerciseMetadata());
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<Exercise>> getSimilar(@PathVariable String id) {
        return ResponseEntity.ok(exerciseService.getSimilarExercises(id));
    }
}
