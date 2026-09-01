package com.bodygym.repository;

import com.bodygym.model.Exercise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, String> {

    @Query("SELECT e FROM Exercise e WHERE " +
           "(:query IS NULL OR LOWER(e.name) LIKE CONCAT('%', :query, '%') OR LOWER(e.target) LIKE CONCAT('%', :query, '%') OR LOWER(e.muscleGroup) LIKE CONCAT('%', :query, '%') OR LOWER(e.bodyPart) LIKE CONCAT('%', :query, '%')) AND " +
           "(:bodyPart IS NULL OR LOWER(e.bodyPart) LIKE CONCAT('%', :bodyPart, '%')) AND " +
           "(:equipment IS NULL OR LOWER(e.equipment) LIKE CONCAT('%', :equipment, '%')) AND " +
           "(:target IS NULL OR LOWER(e.target) LIKE CONCAT('%', :target, '%'))")
    Page<Exercise> filterExercises(
            @Param("query") String query,
            @Param("bodyPart") String bodyPart,
            @Param("equipment") String equipment,
            @Param("target") String target,
            Pageable pageable);

    @Query("SELECT DISTINCT e.bodyPart FROM Exercise e WHERE e.bodyPart IS NOT NULL ORDER BY e.bodyPart ASC")
    List<String> findAllBodyParts();

    @Query("SELECT DISTINCT e.equipment FROM Exercise e WHERE e.equipment IS NOT NULL ORDER BY e.equipment ASC")
    List<String> findAllEquipments();

    @Query("SELECT DISTINCT e.target FROM Exercise e WHERE e.target IS NOT NULL ORDER BY e.target ASC")
    List<String> findAllTargets();

    List<Exercise> findByBodyPartIgnoreCase(String bodyPart);
    
    List<Exercise> findByTargetIgnoreCase(String target);
}
