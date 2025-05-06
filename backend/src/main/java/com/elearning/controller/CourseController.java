package com.elearning.controller;

import com.elearning.dto.CourseResponse;
import com.elearning.model.Course;
import com.elearning.model.CourseStatus;
import com.elearning.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllCourses() {
        try {
            List<Course> courses = courseRepository.findByStatus(CourseStatus.APPROVED);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching courses: " + e.getMessage());
        }
    }

    @GetMapping("/{courseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCourseById(@PathVariable Long courseId) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);

            if (!courseOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Course course = courseOpt.get();

            // Map to CourseResponse to ensure instructor name is included
            CourseResponse response = new CourseResponse(
                    course.getId(),
                    course.getTitle(),
                    course.getDescription(),
                    course.getImageUrl(),
                    course.getPdfUrl(),
                    course.getChapters(),
                    course.getCategory(),
                    course.getCourseType(),
                    course.getStatus(),
                    course.getInstructor().getId(),
                    course.getInstructor().getFullName(),
                    course.getCreatedAt(),
                    course.getUpdatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching course: " + e.getMessage());
        }
    }
}