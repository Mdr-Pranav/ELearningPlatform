package com.elearning.controller;

import com.elearning.dto.CourseRequest;
import com.elearning.dto.CourseResponse;
import com.elearning.dto.MessageResponse;
import com.elearning.dto.MentoringSessionResponse;
import com.elearning.dto.MentoringSessionUpdateRequest;
import com.elearning.model.Course;
import com.elearning.model.CourseStatus;
import com.elearning.model.CourseType;
import com.elearning.model.Enrollment;
import com.elearning.model.User;
import com.elearning.model.ChapterDetail;
import com.elearning.model.MentoringSession;
import com.elearning.dto.ChapterDetailRequest;
import com.elearning.dto.ChapterDetailResponse;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.EnrollmentRepository;
import com.elearning.repository.UserRepository;
import com.elearning.repository.ChapterDetailRepository;
import com.elearning.repository.MentoringSessionRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/instructor")
@PreAuthorize("hasAuthority('ROLE_INSTRUCTOR')")
public class InstructorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ChapterDetailRepository chapterDetailRepository;

    @Autowired
    private MentoringSessionRepository mentoringSessionRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getInstructorDashboard() {
        return ResponseEntity.ok(new MessageResponse("Instructor Dashboard Data"));
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getInstructorCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            List<Course> courses = courseRepository.findByInstructor(user);

            List<CourseResponse> response = courses.stream()
                    .map(course -> new CourseResponse(
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
                            course.getUpdatedAt()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    /**
     * Get all courses available in the system
     * This endpoint is used by instructors to view all courses including ones they
     * didn't create
     */
    @GetMapping("/all-courses")
    public ResponseEntity<?> getAllCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        // Get all courses
        List<Course> allCourses = courseRepository.findAll();

        List<CourseResponse> courseResponses = allCourses.stream()
                .map(course -> new CourseResponse(
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
                        course.getUpdatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(courseResponses);
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CourseRequest courseRequest) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            Course newCourse = new Course();
            newCourse.setTitle(courseRequest.getTitle());
            newCourse.setDescription(courseRequest.getDescription());
            newCourse.setImageUrl(courseRequest.getImageUrl());
            newCourse.setPdfUrl(courseRequest.getPdfUrl());
            newCourse.setChapters(courseRequest.getChapters());
            newCourse.setCategory(courseRequest.getCategory());
            newCourse.setCourseType(courseRequest.getCourseType());
            newCourse.setInstructor(user);

            Course savedCourse = courseRepository.save(newCourse);

            // Save chapter details if provided
            if (courseRequest.getChapterDetails() != null && !courseRequest.getChapterDetails().isEmpty()) {
                for (ChapterDetailRequest detailRequest : courseRequest.getChapterDetails()) {
                    ChapterDetail chapterDetail = new ChapterDetail();
                    chapterDetail.setChapterIndex(detailRequest.getChapterIndex());
                    chapterDetail.setTitle(detailRequest.getTitle());
                    chapterDetail.setContent(detailRequest.getContent());
                    chapterDetail.setObjectives(detailRequest.getObjectives());
                    chapterDetail.setResources(detailRequest.getResources());
                    chapterDetail.setVideoUrl(detailRequest.getVideoUrl());
                    chapterDetail.setCourse(savedCourse);
                    chapterDetail.setInstructor(user);

                    chapterDetailRepository.save(chapterDetail);
                }
            }

            CourseResponse response = new CourseResponse(
                    savedCourse.getId(),
                    savedCourse.getTitle(),
                    savedCourse.getDescription(),
                    savedCourse.getImageUrl(),
                    savedCourse.getPdfUrl(),
                    savedCourse.getChapters(),
                    savedCourse.getCategory(),
                    savedCourse.getCourseType(),
                    savedCourse.getStatus(),
                    savedCourse.getInstructor().getId(),
                    savedCourse.getInstructor().getFullName(),
                    savedCourse.getCreatedAt(),
                    savedCourse.getUpdatedAt());

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @GetMapping("/students")
    public ResponseEntity<?> getInstructorStudents() {
        return ResponseEntity.ok(new MessageResponse("Instructor Students"));
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getInstructorAssignments() {
        return ResponseEntity.ok(new MessageResponse("Instructor Assignments"));
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getInstructorAnalytics() {
        return ResponseEntity.ok(new MessageResponse("Instructor Analytics"));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> user = userRepository.findByUsername(userDetails.getUsername());

        if (user.isPresent()) {
            User userData = user.get();
            Map<String, Object> response = new HashMap<>();
            response.put("username", userData.getUsername());
            response.put("email", userData.getEmail());
            response.put("fullName", userData.getFullName());
            response.put("phoneNumber", userData.getPhoneNumber());
            response.put("roles", userData.getRoles());

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updateRequest) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User user = userOpt.get();

        // Update user details
        if (updateRequest.containsKey("fullName")) {
            user.setFullName(updateRequest.get("fullName"));
        }
        if (updateRequest.containsKey("email")) {
            // Check if email is already in use by another user
            if (!user.getEmail().equals(updateRequest.get("email")) &&
                    userRepository.existsByEmail(updateRequest.get("email"))) {
                return ResponseEntity.badRequest().body("Email is already in use");
            }
            user.setEmail(updateRequest.get("email"));
        }
        if (updateRequest.containsKey("phoneNumber")) {
            user.setPhoneNumber(updateRequest.get("phoneNumber"));
        }

        User updatedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("username", updatedUser.getUsername());
        response.put("email", updatedUser.getEmail());
        response.put("fullName", updatedUser.getFullName());
        response.put("phoneNumber", updatedUser.getPhoneNumber());
        response.put("roles", updatedUser.getRoles());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<?> getCourseEnrolledStudents(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the instructor is the owner of this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to view students for this course");
        }

        // Get all enrollments for this course
        List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);

        // Map to student details to return
        List<Map<String, Object>> studentDetails = enrollments.stream()
                .map(enrollment -> {
                    User student = enrollment.getStudent();
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", student.getId());
                    details.put("username", student.getUsername());
                    details.put("email", student.getEmail());
                    details.put("fullName", student.getFullName());
                    details.put("phoneNumber", student.getPhoneNumber());
                    details.put("enrolledAt", enrollment.getEnrolledAt());
                    return details;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(studentDetails);
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CourseRequest courseRequest) {

        // Debug logging for authentication
        System.out.println("User details: " + (userDetails != null ? userDetails.getUsername() : "null"));
        System.out.println("User authorities: " + (userDetails != null ? userDetails.getAuthorities() : "null"));

        // Debug logging to see the entire courseRequest
        System.out.println("Received course update request: " + courseRequest);

        // Check for null values and provide defaults
        courseRequest.ensureFieldsNotNull();

        // Print detailed properties
        System.out.println("Title: '" + courseRequest.getTitle() + "', Length: " + courseRequest.getTitle().length());
        System.out.println("Description: '" + courseRequest.getDescription() + "', Length: "
                + courseRequest.getDescription().length());
        System.out.println("Category: '" + courseRequest.getCategory() + "'");
        System.out.println("CourseType: " + courseRequest.getCourseType());
        System.out.println("Chapters: " + courseRequest.getChapters());

        try {
            if (userDetails == null) {
                System.out.println("User details is null - unauthorized");
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Course> courseOpt = courseRepository.findById(courseId);

            if (!userOpt.isPresent()) {
                System.out.println("User not found: " + userDetails.getUsername());
                return ResponseEntity.status(404).body("User not found");
            }

            if (!courseOpt.isPresent()) {
                System.out.println("Course not found: " + courseId);
                return ResponseEntity.status(404).body("Course not found");
            }

            User instructor = userOpt.get();
            Course course = courseOpt.get();

            // Debug logging
            System.out.println("Current course type: " + course.getCourseType());
            System.out.println("New course type from request: " + courseRequest.getCourseType());
            System.out.println("Course instructor ID: " + course.getInstructor().getId());
            System.out.println("Requesting user ID: " + instructor.getId());

            // Verify that the instructor owns this course
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                System.out.println("Unauthorized access attempt - instructor ID mismatch");
                return ResponseEntity.status(403).body("You are not authorized to update this course");
            }

            // Update course details with null checks
            if (courseRequest.getTitle() != null) {
                course.setTitle(courseRequest.getTitle());
            }

            if (courseRequest.getDescription() != null) {
                course.setDescription(courseRequest.getDescription());
            }

            // These can be null, so direct assignment is fine
            course.setImageUrl(courseRequest.getImageUrl());
            course.setPdfUrl(courseRequest.getPdfUrl());

            // Ensure chapters is not null and has at least one chapter
            if (courseRequest.getChapters() == null || courseRequest.getChapters().isEmpty()) {
                // Keep existing chapters if new list is empty
                if (course.getChapters() == null || course.getChapters().isEmpty()) {
                    // If both old and new are empty, add a default chapter
                    List<String> defaultChapters = new ArrayList<>();
                    defaultChapters.add("Chapter 1");
                    course.setChapters(defaultChapters);
                }
            } else {
                course.setChapters(courseRequest.getChapters());
            }

            if (courseRequest.getCategory() != null) {
                course.setCategory(courseRequest.getCategory());
            }

            if (courseRequest.getCourseType() != null) {
                course.setCourseType(courseRequest.getCourseType());
            }

            // Debug logging
            System.out.println("Course type after setting: " + course.getCourseType());
            System.out.println("Chapters after setting: " + course.getChapters());

            Course updatedCourse = courseRepository.save(course);

            // Debug logging
            System.out.println("Course type after saving: " + updatedCourse.getCourseType());
            System.out.println("Chapters after saving: " + updatedCourse.getChapters());

            CourseResponse response = new CourseResponse(
                    updatedCourse.getId(),
                    updatedCourse.getTitle(),
                    updatedCourse.getDescription(),
                    updatedCourse.getImageUrl(),
                    updatedCourse.getPdfUrl(),
                    updatedCourse.getChapters(),
                    updatedCourse.getCategory(),
                    updatedCourse.getCourseType(),
                    updatedCourse.getStatus(),
                    updatedCourse.getInstructor().getId(),
                    updatedCourse.getInstructor().getFullName(),
                    updatedCourse.getCreatedAt(),
                    updatedCourse.getUpdatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error updating course: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating course: " + e.getMessage());
        }
    }

    @GetMapping("/rejected-courses")
    public ResponseEntity<?> getRejectedCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (userOpt.isPresent()) {
            User instructor = userOpt.get();
            List<Course> rejectedCourses = courseRepository.findByInstructorAndStatus(instructor,
                    CourseStatus.REJECTED);

            List<CourseResponse> courseResponses = rejectedCourses.stream()
                    .map(course -> new CourseResponse(
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
                            course.getUpdatedAt()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(courseResponses);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @GetMapping("/pending-courses")
    public ResponseEntity<?> getPendingCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (userOpt.isPresent()) {
            User instructor = userOpt.get();
            List<Course> pendingCourses = courseRepository.findByInstructorAndStatus(instructor,
                    CourseStatus.PENDING);

            List<CourseResponse> courseResponses = pendingCourses.stream()
                    .map(course -> new CourseResponse(
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
                            course.getUpdatedAt()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(courseResponses);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PostMapping("/courses/{courseId}/resubmit")
    public ResponseEntity<?> resubmitCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the instructor is the owner of this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to resubmit this course");
        }

        // Check if the course is rejected
        if (course.getStatus() != CourseStatus.REJECTED) {
            return ResponseEntity.status(400).body("Only rejected courses can be resubmitted");
        }

        // Update course status to pending
        course.setStatus(CourseStatus.PENDING);
        Course updatedCourse = courseRepository.save(course);

        CourseResponse response = new CourseResponse(
                updatedCourse.getId(),
                updatedCourse.getTitle(),
                updatedCourse.getDescription(),
                updatedCourse.getImageUrl(),
                updatedCourse.getPdfUrl(),
                updatedCourse.getChapters(),
                updatedCourse.getCategory(),
                updatedCourse.getCourseType(),
                updatedCourse.getStatus(),
                updatedCourse.getInstructor().getId(),
                updatedCourse.getInstructor().getFullName(),
                updatedCourse.getCreatedAt(),
                updatedCourse.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/courses/{courseId}/simple-update")
    public ResponseEntity<?> simpleUpdateCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> courseData) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Course> courseOpt = courseRepository.findById(courseId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (!courseOpt.isPresent()) {
                return ResponseEntity.status(404).body("Course not found");
            }

            User instructor = userOpt.get();
            Course course = courseOpt.get();

            // Verify that the instructor owns this course
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                return ResponseEntity.status(403).body("You are not authorized to update this course");
            }

            // Update course details
            if (courseData.containsKey("title") && courseData.get("title") != null) {
                course.setTitle((String) courseData.get("title"));
            }

            if (courseData.containsKey("description") && courseData.get("description") != null) {
                course.setDescription((String) courseData.get("description"));
            }

            if (courseData.containsKey("imageUrl")) {
                course.setImageUrl((String) courseData.get("imageUrl"));
            }

            if (courseData.containsKey("pdfUrl")) {
                course.setPdfUrl((String) courseData.get("pdfUrl"));
            }

            if (courseData.containsKey("chapters")) {
                @SuppressWarnings("unchecked")
                List<String> chapters = (List<String>) courseData.get("chapters");
                if (chapters != null && !chapters.isEmpty()) {
                    course.setChapters(chapters);
                } else {
                    // If chapters list is empty, add default chapter
                    List<String> defaultChapters = new ArrayList<>();
                    defaultChapters.add("Chapter 1");
                    course.setChapters(defaultChapters);
                }
            }

            if (courseData.containsKey("category") && courseData.get("category") != null) {
                course.setCategory((String) courseData.get("category"));
            }

            if (courseData.containsKey("courseType") && courseData.get("courseType") != null) {
                String courseTypeStr = (String) courseData.get("courseType");
                try {
                    course.setCourseType(CourseType.valueOf(courseTypeStr));
                } catch (IllegalArgumentException e) {
                    // Default to STUDENT if invalid course type
                    course.setCourseType(CourseType.STUDENT);
                    System.out.println("Warning: Invalid course type '" + courseTypeStr + "', using default STUDENT");
                }
            }

            Course updatedCourse = courseRepository.save(course);

            CourseResponse response = new CourseResponse(
                    updatedCourse.getId(),
                    updatedCourse.getTitle(),
                    updatedCourse.getDescription(),
                    updatedCourse.getImageUrl(),
                    updatedCourse.getPdfUrl(),
                    updatedCourse.getChapters(),
                    updatedCourse.getCategory(),
                    updatedCourse.getCourseType(),
                    updatedCourse.getStatus(),
                    updatedCourse.getInstructor().getId(),
                    updatedCourse.getInstructor().getFullName(),
                    updatedCourse.getCreatedAt(),
                    updatedCourse.getUpdatedAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating course: " + e.getMessage());
        }
    }

    @DeleteMapping("/courses/{courseId}")
    @Transactional
    public ResponseEntity<?> deleteCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Course> courseOpt = courseRepository.findById(courseId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (!courseOpt.isPresent()) {
                return ResponseEntity.status(404).body("Course not found");
            }

            User instructor = userOpt.get();
            Course course = courseOpt.get();

            // Verify that the instructor owns this course
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                return ResponseEntity.status(403).body("You are not authorized to delete this course");
            }

            // Delete enrollments for this course first to prevent foreign key constraint
            // violations
            enrollmentRepository.deleteByCourse(course);

            // Delete the course
            courseRepository.delete(course);

            return ResponseEntity.ok(new MessageResponse("Course deleted successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error deleting course: " + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/chapters")
    public ResponseEntity<?> getCourseChapterDetails(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        User instructor = userOpt.get();
        Course course = courseOpt.get();

        // Get all chapter details for this course and instructor
        List<ChapterDetail> chapterDetails = chapterDetailRepository.findByCourseAndInstructor(course, instructor);

        List<ChapterDetailResponse> responses = chapterDetails.stream()
                .map(detail -> new ChapterDetailResponse(
                        detail.getId(),
                        detail.getChapterIndex(),
                        detail.getTitle(),
                        detail.getContent(),
                        detail.getObjectives(),
                        detail.getResources(),
                        detail.getVideoUrl(),
                        detail.getCourse().getId(),
                        detail.getInstructor().getId(),
                        detail.getInstructor().getFullName(),
                        detail.getCreatedAt(),
                        detail.getUpdatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/courses/{courseId}/chapters/{chapterIndex}")
    public ResponseEntity<?> getChapterDetail(
            @PathVariable Long courseId,
            @PathVariable Integer chapterIndex,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        User instructor = userOpt.get();
        Course course = courseOpt.get();

        // Get the chapter detail
        Optional<ChapterDetail> chapterDetailOpt = chapterDetailRepository
                .findByCourseAndInstructorAndChapterIndex(course, instructor, chapterIndex);

        if (!chapterDetailOpt.isPresent()) {
            return ResponseEntity.status(404).body("Chapter detail not found");
        }

        ChapterDetail detail = chapterDetailOpt.get();
        ChapterDetailResponse response = new ChapterDetailResponse(
                detail.getId(),
                detail.getChapterIndex(),
                detail.getTitle(),
                detail.getContent(),
                detail.getObjectives(),
                detail.getResources(),
                detail.getVideoUrl(),
                detail.getCourse().getId(),
                detail.getInstructor().getId(),
                detail.getInstructor().getFullName(),
                detail.getCreatedAt(),
                detail.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/courses/{courseId}/chapters")
    public ResponseEntity<?> createOrUpdateChapterDetail(
            @PathVariable Long courseId,
            @RequestBody ChapterDetailRequest detailRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        User instructor = userOpt.get();
        Course course = courseOpt.get();

        // Check if the instructor owns this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to update this course");
        }

        // Check if a chapter detail for this index already exists
        Optional<ChapterDetail> existingDetailOpt = chapterDetailRepository
                .findByCourseAndInstructorAndChapterIndex(course, instructor, detailRequest.getChapterIndex());

        ChapterDetail chapterDetail;

        if (existingDetailOpt.isPresent()) {
            // Update existing chapter detail
            chapterDetail = existingDetailOpt.get();
            chapterDetail.setTitle(detailRequest.getTitle());
            chapterDetail.setContent(detailRequest.getContent());
            chapterDetail.setObjectives(detailRequest.getObjectives());
            chapterDetail.setResources(detailRequest.getResources());
            chapterDetail.setVideoUrl(detailRequest.getVideoUrl());
            // updatedAt will be set by @PreUpdate
        } else {
            // Create new chapter detail
            chapterDetail = new ChapterDetail();
            chapterDetail.setChapterIndex(detailRequest.getChapterIndex());
            chapterDetail.setTitle(detailRequest.getTitle());
            chapterDetail.setContent(detailRequest.getContent());
            chapterDetail.setObjectives(detailRequest.getObjectives());
            chapterDetail.setResources(detailRequest.getResources());
            chapterDetail.setVideoUrl(detailRequest.getVideoUrl());
            chapterDetail.setCourse(course);
            chapterDetail.setInstructor(instructor);
        }

        ChapterDetail savedDetail = chapterDetailRepository.save(chapterDetail);

        ChapterDetailResponse response = new ChapterDetailResponse(
                savedDetail.getId(),
                savedDetail.getChapterIndex(),
                savedDetail.getTitle(),
                savedDetail.getContent(),
                savedDetail.getObjectives(),
                savedDetail.getResources(),
                savedDetail.getVideoUrl(),
                savedDetail.getCourse().getId(),
                savedDetail.getInstructor().getId(),
                savedDetail.getInstructor().getFullName(),
                savedDetail.getCreatedAt(),
                savedDetail.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/courses/{courseId}/chapters/{chapterIndex}")
    public ResponseEntity<?> deleteChapterDetail(
            @PathVariable Long courseId,
            @PathVariable Integer chapterIndex,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        User instructor = userOpt.get();
        Course course = courseOpt.get();

        // Check if the instructor owns this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to delete chapter details for this course");
        }

        // Find the chapter detail
        Optional<ChapterDetail> chapterDetailOpt = chapterDetailRepository
                .findByCourseAndInstructorAndChapterIndex(course, instructor, chapterIndex);

        if (!chapterDetailOpt.isPresent()) {
            return ResponseEntity.status(404).body("Chapter detail not found");
        }

        // Delete the chapter detail
        chapterDetailRepository.delete(chapterDetailOpt.get());

        return ResponseEntity.ok(new MessageResponse("Chapter detail deleted successfully"));
    }

    @GetMapping("/courses/{courseId}/mentoring-sessions")
    public ResponseEntity<?> getCourseMentoringSessions(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the instructor is the owner of this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to view mentoring sessions for this course");
        }

        // Get all mentoring sessions for this course
        List<MentoringSession> sessions = mentoringSessionRepository.findByCourse(course);

        List<MentoringSessionResponse> responses = sessions.stream()
                .map(session -> new MentoringSessionResponse(
                        session.getId(),
                        session.getStudent().getId(),
                        session.getStudent().getFullName(),
                        session.getStudent().getEmail(),
                        session.getInstructor().getId(),
                        session.getInstructor().getFullName(),
                        session.getCourse().getId(),
                        session.getCourse().getTitle(),
                        session.getStatus(),
                        session.getTopic(),
                        session.getDescription(),
                        session.getRequestDate(),
                        session.getSessionDate(),
                        session.getNotes()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/mentoring-sessions")
    public ResponseEntity<?> getAllMentoringSessions(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();

        // Get all mentoring sessions for this instructor
        List<MentoringSession> sessions = mentoringSessionRepository.findByInstructor(instructor);

        List<MentoringSessionResponse> responses = sessions.stream()
                .map(session -> new MentoringSessionResponse(
                        session.getId(),
                        session.getStudent().getId(),
                        session.getStudent().getFullName(),
                        session.getStudent().getEmail(),
                        session.getInstructor().getId(),
                        session.getInstructor().getFullName(),
                        session.getCourse().getId(),
                        session.getCourse().getTitle(),
                        session.getStatus(),
                        session.getTopic(),
                        session.getDescription(),
                        session.getRequestDate(),
                        session.getSessionDate(),
                        session.getNotes()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PutMapping("/mentoring-sessions/{sessionId}")
    public ResponseEntity<?> updateMentoringSession(
            @PathVariable Long sessionId,
            @RequestBody MentoringSessionUpdateRequest updateRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();

        Optional<MentoringSession> sessionOpt = mentoringSessionRepository.findById(sessionId);

        if (!sessionOpt.isPresent()) {
            return ResponseEntity.status(404).body("Mentoring session not found");
        }

        MentoringSession session = sessionOpt.get();

        // Check if the instructor is the owner of this session
        if (!session.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to update this mentoring session");
        }

        // Update the session status
        if (updateRequest.getStatus() != null) {
            session.setStatus(updateRequest.getStatus());
        }

        // Update session date if provided
        if (updateRequest.getSessionDate() != null) {
            session.setSessionDate(updateRequest.getSessionDate());
        }

        // Update notes if provided
        if (updateRequest.getNotes() != null) {
            session.setNotes(updateRequest.getNotes());
        }

        mentoringSessionRepository.save(session);

        MentoringSessionResponse response = new MentoringSessionResponse(
                session.getId(),
                session.getStudent().getId(),
                session.getStudent().getFullName(),
                session.getStudent().getEmail(),
                session.getInstructor().getId(),
                session.getInstructor().getFullName(),
                session.getCourse().getId(),
                session.getCourse().getTitle(),
                session.getStatus(),
                session.getTopic(),
                session.getDescription(),
                session.getRequestDate(),
                session.getSessionDate(),
                session.getNotes());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/courses/{courseId}/pdf")
    public ResponseEntity<?> getCoursePdf(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User instructor = userOpt.get();
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Verify that the instructor owns this course
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to view this course's PDF");
        }

        // Check if the course has a PDF URL
        if (course.getPdfUrl() == null || course.getPdfUrl().isEmpty()) {
            return ResponseEntity.status(404).body("No PDF available for this course");
        }

        // Return the PDF URL
        Map<String, String> response = new HashMap<>();
        response.put("pdfUrl", course.getPdfUrl());

        return ResponseEntity.ok(response);
    }
}