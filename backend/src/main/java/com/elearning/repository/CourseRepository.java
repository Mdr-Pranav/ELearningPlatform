package com.elearning.repository;

import com.elearning.model.Course;
import com.elearning.model.CourseStatus;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByInstructor(User instructor);

    List<Course> findByCategory(String category);

    List<Course> findByTitleContainingIgnoreCase(String title);

    List<Course> findByStatus(CourseStatus status);

    long countByStatus(CourseStatus status);

    List<Course> findByInstructorAndStatus(User instructor, CourseStatus status);
}