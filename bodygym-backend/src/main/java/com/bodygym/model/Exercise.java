package com.bodygym.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exercises", indexes = {
    @Index(name = "idx_body_part", columnList = "bodyPart"),
    @Index(name = "idx_equipment", columnList = "equipment"),
    @Index(name = "idx_target", columnList = "target")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @Column(length = 20)
    private String id; // e.g. "0001"

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String bodyPart;

    @Column(length = 100)
    private String equipment;

    @Column(length = 100)
    private String target;

    @Column(length = 100)
    private String muscleGroup;

    @Column(columnDefinition = "TEXT")
    private String secondaryMuscles; // Comma-separated or JSON

    @Column(columnDefinition = "TEXT")
    private String instructions; // English or primary instruction text

    @Column(columnDefinition = "TEXT")
    private String instructionsJson; // Full multilingual JSON

    @Column(columnDefinition = "TEXT")
    private String instructionStepsJson; // Steps array JSON

    @Column(length = 255)
    private String image; // e.g. "images/0001.png"

    @Column(length = 255)
    private String gifUrl; // e.g. "videos/0001-xxxx.gif"

    @Column(length = 255)
    private String attribution;

    private Integer mediaId;
}
