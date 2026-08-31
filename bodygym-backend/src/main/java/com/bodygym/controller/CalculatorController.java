package com.bodygym.controller;

import com.bodygym.service.CalculatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/calculator")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CalculatorController {

    private final CalculatorService calculatorService;

    @GetMapping("/1rm")
    public ResponseEntity<Map<String, Object>> calculate1RM(
            @RequestParam double weight,
            @RequestParam int reps) {
        return ResponseEntity.ok(calculatorService.calculateOneRepMax(weight, reps));
    }

    @GetMapping("/tdee")
    public ResponseEntity<Map<String, Object>> calculateTDEE(
            @RequestParam(defaultValue = "male") String gender,
            @RequestParam(defaultValue = "70") double weight,
            @RequestParam(defaultValue = "175") double height,
            @RequestParam(defaultValue = "25") int age,
            @RequestParam(defaultValue = "moderate") String activity,
            @RequestParam(defaultValue = "hypertrophy") String goal) {
        return ResponseEntity.ok(calculatorService.calculateTdee(gender, weight, height, age, activity, goal));
    }

    @GetMapping("/heart-rate")
    public ResponseEntity<Map<String, Object>> calculateHeartRate(@RequestParam(defaultValue = "25") int age) {
        return ResponseEntity.ok(calculatorService.calculateHeartRateZones(age));
    }
}
