package com.bodygym.repository;

import com.bodygym.model.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findByIsPresetTrue();
    List<Routine> findByIsPresetFalseOrderByCreatedAtDesc();
    List<Routine> findAllByOrderByCreatedAtDesc();
}
