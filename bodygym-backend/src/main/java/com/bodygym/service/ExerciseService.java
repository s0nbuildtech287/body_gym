package com.bodygym.service;

import com.bodygym.model.Exercise;
import com.bodygym.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public Page<Exercise> getExercises(String query, String bodyPart, String equipment, String target, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return exerciseRepository.filterExercises(
                (query != null && !query.trim().isEmpty()) ? query.trim() : null,
                bodyPart,
                equipment,
                target,
                pageable
        );
    }

    public Optional<Exercise> getExerciseById(String id) {
        return exerciseRepository.findById(id);
    }

    public List<String> getAllBodyParts() {
        return exerciseRepository.findAllBodyParts();
    }

    public List<String> getAllEquipments() {
        return exerciseRepository.findAllEquipments();
    }

    public List<String> getAllTargets() {
        return exerciseRepository.findAllTargets();
    }

    public Map<String, Object> getExerciseMetadata() {
        Map<String, Object> meta = new HashMap<>();
        meta.put("bodyParts", getAllBodyParts());
        meta.put("equipments", getAllEquipments());
        meta.put("targets", getAllTargets());
        meta.put("totalExercises", exerciseRepository.count());
        return meta;
    }

    public List<Exercise> getSimilarExercises(String id) {
        return exerciseRepository.findById(id)
                .map(exercise -> {
                    List<Exercise> list = exerciseRepository.findByTargetIgnoreCase(exercise.getTarget());
                    list.removeIf(e -> e.getId().equals(id));
                    Collections.shuffle(list);
                    return list.subList(0, Math.min(list.size(), 4));
                })
                .orElse(Collections.emptyList());
    }
}
