package com.bodygym.controller;

import com.bodygym.model.UserProfile;
import com.bodygym.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserProfileController {

    private final UserProfileRepository userProfileRepository;

    @GetMapping
    public ResponseEntity<UserProfile> getProfile() {
        UserProfile profile = userProfileRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> userProfileRepository.save(UserProfile.builder()
                        .fullName("Gym Athlete")
                        .gender("male")
                        .age(24)
                        .heightCm(175.0)
                        .weightKg(72.0)
                        .fitnessGoal("hypertrophy")
                        .activityLevel("moderate")
                        .build()));
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(@RequestBody UserProfile request) {
        UserProfile profile = userProfileRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> UserProfile.builder().build());

        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getAge() != null) profile.setAge(request.getAge());
        if (request.getHeightCm() != null) profile.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) profile.setWeightKg(request.getWeightKg());
        if (request.getFitnessGoal() != null) profile.setFitnessGoal(request.getFitnessGoal());
        if (request.getActivityLevel() != null) profile.setActivityLevel(request.getActivityLevel());

        return ResponseEntity.ok(userProfileRepository.save(profile));
    }
}
