package com.bodygym.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CalculatorService {

    public Map<String, Object> calculateOneRepMax(double weight, int reps) {
        if (reps <= 0 || weight <= 0) {
            throw new IllegalArgumentException("Weight and reps must be positive numbers");
        }

        // Standard 1RM Formulas
        double brzycki = weight * (36.0 / (37.0 - reps));
        double epley = weight * (1.0 + (reps / 30.0));
        double lander = (100.0 * weight) / (101.3 - (2.67123 * reps));
        double lombardi = weight * Math.pow(reps, 0.1);
        double mayhew = (100.0 * weight) / (52.2 + (41.9 * Math.exp(-0.055 * reps)));
        double average1RM = (brzycki + epley + lander + lombardi + mayhew) / 5.0;

        // Calculate Reps table (% of 1RM)
        List<Map<String, Object>> repPercentages = new ArrayList<>();
        int[] targetReps = {1, 2, 3, 4, 5, 6, 8, 10, 12, 15};
        double[] pct = {1.0, 0.95, 0.93, 0.90, 0.87, 0.85, 0.80, 0.75, 0.70, 0.65};

        for (int i = 0; i < targetReps.length; i++) {
            Map<String, Object> row = new HashMap<>();
            row.put("reps", targetReps[i]);
            row.put("percentage", Math.round(pct[i] * 100));
            row.put("weightKg", Math.round((average1RM * pct[i]) * 10.0) / 10.0);
            repPercentages.add(row);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("inputWeight", weight);
        result.put("inputReps", reps);
        result.put("estimated1RM", Math.round(average1RM * 10.0) / 10.0);
        result.put("brzycki", Math.round(brzycki * 10.0) / 10.0);
        result.put("epley", Math.round(epley * 10.0) / 10.0);
        result.put("lander", Math.round(lander * 10.0) / 10.0);
        result.put("repPercentages", repPercentages);
        return result;
    }

    public Map<String, Object> calculateTdee(String gender, double weightKg, double heightCm, int age, String activityLevel, String goal) {
        // Mifflin-St Jeor Equation for BMR
        double bmr;
        if ("female".equalsIgnoreCase(gender)) {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        }

        double activityMultiplier = switch (activityLevel.toLowerCase()) {
            case "light" -> 1.375;
            case "moderate" -> 1.55;
            case "very_active" -> 1.725;
            case "extra_active" -> 1.9;
            default -> 1.2; // Sedentary
        };

        double tdee = bmr * activityMultiplier;
        double targetCalories;

        switch (goal.toLowerCase()) {
            case "fat_loss" -> targetCalories = tdee - 500; // -500 kcal deficit
            case "extreme_loss" -> targetCalories = tdee - 750;
            case "hypertrophy", "muscle_gain" -> targetCalories = tdee + 350; // Lean bulk
            default -> targetCalories = tdee; // Maintenance
        }

        // Macro breakdown
        // Protein: 2.0g per kg of bodyweight
        double proteinGrams = weightKg * 2.0;
        double proteinCalories = proteinGrams * 4;

        // Fat: 25% of total calories
        double fatCalories = targetCalories * 0.25;
        double fatGrams = fatCalories / 9.0;

        // Carbs: Remaining calories
        double carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
        double carbGrams = carbCalories / 4.0;

        Map<String, Object> result = new HashMap<>();
        result.put("bmr", Math.round(bmr));
        result.put("tdee", Math.round(tdee));
        result.put("targetCalories", Math.round(targetCalories));
        result.put("goal", goal);
        result.put("proteinGrams", Math.round(proteinGrams));
        result.put("fatGrams", Math.round(fatGrams));
        result.put("carbGrams", Math.round(carbGrams));
        result.put("waterLiters", Math.round((weightKg * 0.035) * 10.0) / 10.0);

        return result;
    }

    public Map<String, Object> calculateHeartRateZones(int age) {
        int maxHr = 220 - age;
        List<Map<String, Object>> zones = new ArrayList<>();

        zones.add(Map.of("zone", "Zone 1 (Phục hồi)", "range", Math.round(maxHr * 0.50) + " - " + Math.round(maxHr * 0.60) + " BPM", "purpose", "Khởi động, hồi phục tim mạch"));
        zones.add(Map.of("zone", "Zone 2 (Đốt mỡ Fat Burn)", "range", Math.round(maxHr * 0.60) + " - " + Math.round(maxHr * 0.70) + " BPM", "purpose", "Tối ưu hóa đốt chất béo, tăng sức bền"));
        zones.add(Map.of("zone", "Zone 3 (Aerobic Cardio)", "range", Math.round(maxHr * 0.70) + " - " + Math.round(maxHr * 0.80) + " BPM", "purpose", "Nâng cao dung tích phổi và tim mạch"));
        zones.add(Map.of("zone", "Zone 4 (Anaerobic Ngưỡng Lactate)", "range", Math.round(maxHr * 0.80) + " - " + Math.round(maxHr * 0.90) + " BPM", "purpose", "Tăng ngưỡng chịu đựng axit lactic"));
        zones.add(Map.of("zone", "Zone 5 (Cường độ Tối đa VO2 Max)", "range", Math.round(maxHr * 0.90) + " - " + maxHr + " BPM", "purpose", "Bứt tốc HIIT ngắn hạn"));

        Map<String, Object> result = new HashMap<>();
        result.put("maxHeartRate", maxHr);
        result.put("zones", zones);
        return result;
    }
}
