package com.bodygym.service;

import com.bodygym.model.Exercise;
import com.bodygym.model.Routine;
import com.bodygym.repository.ExerciseRepository;
import com.bodygym.repository.RoutineRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExerciseDataLoader implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;
    private final RoutineRepository routineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) {
        loadExercisesIfEmpty();
        seedPresetRoutinesIfEmpty();
    }

    private void loadExercisesIfEmpty() {
        if (exerciseRepository.count() > 0) {
            log.info("Exercises dataset already loaded: {} records in DB.", exerciseRepository.count());
            return;
        }

        // Try several candidate paths for exercises.json
        String[] possiblePaths = {
            "../exercises-dataset/data/exercises.json",
            "exercises-dataset/data/exercises.json",
            "/app/exercises-dataset/data/exercises.json",
            "C:/Users/XUAN SON/Desktop/Xuan Son Version/BodyGym/exercises-dataset/data/exercises.json"
        };

        File targetFile = null;
        for (String path : possiblePaths) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                targetFile = f;
                break;
            }
        }

        if (targetFile == null) {
            log.warn("Could not find exercises.json in candidate paths!");
            return;
        }

        try {
            log.info("Starting loading exercises from: {}", targetFile.getAbsolutePath());
            JsonNode rootNode = objectMapper.readTree(targetFile);
            if (!rootNode.isArray()) {
                log.error("exercises.json root is not an array!");
                return;
            }

            List<Exercise> exercises = new ArrayList<>();
            for (JsonNode item : rootNode) {
                String id = item.path("id").asText("");
                String name = item.path("name").asText("");
                String category = item.path("category").asText("");
                String bodyPart = item.path("body_part").asText("");
                String equipment = item.path("equipment").asText("");
                String target = item.path("target").asText("");
                String muscleGroup = item.path("muscle_group").asText("");
                
                // Secondary muscles
                String secondaryMuscles = "";
                if (item.has("secondary_muscles") && item.path("secondary_muscles").isArray()) {
                    List<String> secs = new ArrayList<>();
                    item.path("secondary_muscles").forEach(s -> secs.add(s.asText()));
                    secondaryMuscles = String.join(", ", secs);
                }

                // Instructions (Primary: en)
                String instructionsEn = "";
                String instructionsJson = "";
                if (item.has("instructions")) {
                    instructionsJson = item.path("instructions").toString();
                    instructionsEn = item.path("instructions").path("en").asText("");
                }

                String instructionStepsJson = item.has("instruction_steps") ? item.path("instruction_steps").toString() : "";
                String image = item.path("image").asText("");
                String gifUrl = item.path("gif_url").asText("");
                String attribution = item.path("attribution").asText("");
                Integer mediaId = item.has("media_id") ? item.path("media_id").asInt() : null;

                Exercise exercise = Exercise.builder()
                        .id(id)
                        .name(name)
                        .category(category)
                        .bodyPart(bodyPart)
                        .equipment(equipment)
                        .target(target)
                        .muscleGroup(muscleGroup)
                        .secondaryMuscles(secondaryMuscles)
                        .instructions(instructionsEn)
                        .instructionsJson(instructionsJson)
                        .instructionStepsJson(instructionStepsJson)
                        .image(image)
                        .gifUrl(gifUrl)
                        .attribution(attribution)
                        .mediaId(mediaId)
                        .build();

                exercises.add(exercise);
            }

            exerciseRepository.saveAll(exercises);
            log.info("Successfully imported {} exercises into Database!", exercises.size());

        } catch (Exception e) {
            log.error("Error loading exercises data: {}", e.getMessage(), e);
        }
    }

    private void seedPresetRoutinesIfEmpty() {
        if (routineRepository.count() > 0) {
            return;
        }

        List<Routine> presets = new ArrayList<>();

        // Helper to construct routine items with real exercise metadata
        autoAddPreset(presets, "Push Day Alpha (Chest & Triceps Focus)",
                "Giáo án đẩy toàn diện kích thích cơ Ngực trên/phẳng, Vai ngang và Tay sau với các bài tập Compound kinh điển.",
                "Chest, Shoulders, Upper Arms", "Intermediate", 60,
                List.of("0025", "0047", "0334", "0086"));

        autoAddPreset(presets, "Pull Day Beast (Back, Biceps & Rear Delts)",
                "Giáo án kéo xây dựng tấm lưng chữ V dày dặn và bắp tay trước vạm vỡ.",
                "Back, Upper Arms, Shoulders", "Intermediate", 65,
                List.of("0032", "0652", "0027", "0294"));

        autoAddPreset(presets, "Legs & Core Domination (Quads & Glutes)",
                "Tăng cường sức mạnh thân dưới toàn diện với bài Squat, Đùi trước/sau và Cơ bụng săn chắc.",
                "Upper Legs, Lower Legs, Waist", "Advanced", 70,
                List.of("0043", "0585", "0582", "0871"));

        autoAddPreset(presets, "Upper Body Power Hypertrophy",
                "Phát triển sức mạnh và độ dày toàn bộ thân trên (Ngực, Lưng xô, Vai và Tay).",
                "Chest, Back, Shoulders, Upper Arms", "Advanced", 75,
                List.of("0025", "0652", "0334", "0294", "0086"));

        autoAddPreset(presets, "Full Body Quick Shred (HIIT / Home)",
                "Giáo án toàn thân đốt mỡ nhanh, phù hợp cho người bận rộn hoặc tập tại nhà với tạ đơn và bodyweight.",
                "Cardio, Chest, Back, Upper Legs, Waist", "Beginner", 45,
                List.of("0662", "0399", "0685", "0001"));

        autoAddPreset(presets, "Arnold Golden Era Split (Chest & Back)",
                "Phương pháp tập đối kháng Supersets kinh điển của Arnold Schwarzenegger mang lại độ căng phồng cơ bắp cực đại.",
                "Chest, Back", "Advanced", 65,
                List.of("0025", "0652", "0047", "0027"));

        routineRepository.saveAll(presets);
        log.info("Successfully seeded {} preset routines with verified dataset assets.", presets.size());
    }

    private void autoAddPreset(List<Routine> presets, String name, String desc, String focus, String level, int mins, List<String> exerciseIds) {
        List<java.util.Map<String, Object>> items = new ArrayList<>();
        for (String id : exerciseIds) {
            exerciseRepository.findById(id).ifPresent(ex -> {
                java.util.Map<String, Object> item = new java.util.HashMap<>();
                item.put("exerciseId", ex.getId());
                item.put("exerciseName", ex.getName());
                item.put("bodyPart", ex.getBodyPart());
                item.put("target", ex.getTarget());
                item.put("equipment", ex.getEquipment());
                item.put("image", ex.getImage());
                item.put("gifUrl", ex.getGifUrl());
                item.put("defaultSets", 4);
                item.put("targetReps", 10);
                item.put("restSeconds", 90);
                items.add(item);
            });
        }

        try {
            presets.add(Routine.builder()
                    .name(name)
                    .description(desc)
                    .targetFocus(focus)
                    .level(level)
                    .estimatedMinutes(mins)
                    .isPreset(true)
                    .exercisesJson(objectMapper.writeValueAsString(items))
                    .build());
        } catch (Exception e) {
            log.error("Failed to serialize preset routine: {}", e.getMessage());
        }
    }
}
