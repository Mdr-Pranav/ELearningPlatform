package com.elearning.controller;

import com.elearning.dto.CourseResponse;
import com.elearning.model.User;
import com.elearning.model.Role;
import com.elearning.model.Course;
import com.elearning.model.CourseStatus;
import com.elearning.repository.UserRepository;
import com.elearning.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;

import com.elearning.dto.CourseDTO;
import com.elearning.dto.MentoringSessionDTO;
import com.elearning.service.CourseService;
import com.elearning.service.InstructorService;
import com.elearning.service.MentoringService;
import com.elearning.service.StudentService;
import com.elearning.model.Enrollment;
import com.elearning.repository.EnrollmentRepository;
import com.elearning.model.ChapterDetail;
import com.elearning.repository.ChapterDetailRepository;
import com.elearning.dto.ChapterDetailResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentService studentService;

    @Autowired
    private InstructorService instructorService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private MentoringService mentoringService;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ChapterDetailRepository chapterDetailRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentService.countStudents());
        stats.put("totalInstructors", instructorService.countInstructors());
        stats.put("totalCourses", courseService.countAllCourses());
        stats.put("pendingCourses", courseService.countPendingCourses());
        stats.put("approvedCourses", courseService.countApprovedCourses());
        stats.put("mentoringSessions", mentoringService.countAllSessions());

        // Adding student counts by user type
        long studentTypeCount = studentService.countStudentTypeUsers();
        long professionalTypeCount = studentService.countProfessionalTypeUsers();
        long placementTypeCount = studentService.countPlacementTypeUsers();

        stats.put("studentTypeUsers", studentTypeCount);
        stats.put("professionalTypeUsers", professionalTypeCount);
        stats.put("placementTypeUsers", placementTypeCount);

        System.out.println("Stats being returned: " + stats);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        try {
            List<User> students = userRepository.findAll().stream()
                    .filter(user -> user.getRoles().contains("ROLE_STUDENT"))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching students: " + e.getMessage());
        }
    }

    @GetMapping("/instructors")
    public ResponseEntity<?> getAllInstructors() {
        try {
            List<User> instructors = userRepository.findAll().stream()
                    .filter(user -> user.getRoles().contains("ROLE_INSTRUCTOR"))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(instructors);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching instructors: " + e.getMessage());
        }
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<?> getStudentDetails(@PathVariable Long id) {
        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            if (!student.getRoles().contains("ROLE_STUDENT")) {
                return ResponseEntity.badRequest().body("User is not a student");
            }

            return ResponseEntity.ok(student);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching student details: " + e.getMessage());
        }
    }

    @GetMapping("/instructor/{id}")
    public ResponseEntity<?> getInstructorDetails(@PathVariable Long id) {
        try {
            User instructor = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));

            if (!instructor.getRoles().contains("ROLE_INSTRUCTOR")) {
                return ResponseEntity.badRequest().body("User is not an instructor");
            }

            return ResponseEntity.ok(instructor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching instructor details: " + e.getMessage());
        }
    }

    @PutMapping("/student/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody User updatedStudent) {
        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            if (!student.getRoles().contains("ROLE_STUDENT")) {
                return ResponseEntity.badRequest().body("User is not a student");
            }

            // Update student details
            student.setFullName(updatedStudent.getFullName());
            student.setEmail(updatedStudent.getEmail());
            student.setPhoneNumber(updatedStudent.getPhoneNumber());
            student.setUserType(updatedStudent.getUserType());

            User savedStudent = userRepository.save(student);
            return ResponseEntity.ok(savedStudent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating student: " + e.getMessage());
        }
    }

    @PutMapping("/instructor/{id}")
    public ResponseEntity<?> updateInstructor(@PathVariable Long id, @RequestBody User updatedInstructor) {
        try {
            User instructor = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));

            if (!instructor.getRoles().contains("ROLE_INSTRUCTOR")) {
                return ResponseEntity.badRequest().body("User is not an instructor");
            }

            // Update instructor details
            instructor.setFullName(updatedInstructor.getFullName());
            instructor.setEmail(updatedInstructor.getEmail());
            instructor.setPhoneNumber(updatedInstructor.getPhoneNumber());

            User savedInstructor = userRepository.save(instructor);
            return ResponseEntity.ok(savedInstructor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating instructor: " + e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getAdminProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User admin = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!admin.getRoles().contains("ROLE_ADMIN")) {
                return ResponseEntity.badRequest().body("User is not an admin");
            }

            return ResponseEntity.ok(admin);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching admin profile: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateAdminProfile(@RequestBody User updatedAdmin) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User admin = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!admin.getRoles().contains("ROLE_ADMIN")) {
                return ResponseEntity.badRequest().body("User is not an admin");
            }

            // Update admin details
            admin.setFullName(updatedAdmin.getFullName());
            admin.setEmail(updatedAdmin.getEmail());
            admin.setPhoneNumber(updatedAdmin.getPhoneNumber());

            User savedAdmin = userRepository.save(admin);
            return ResponseEntity.ok(savedAdmin);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating admin profile: " + e.getMessage());
        }
    }

    @GetMapping("/pending-courses")
    public ResponseEntity<?> getPendingCourses() {
        try {
            List<Course> pendingCourses = courseRepository.findByStatus(CourseStatus.PENDING);

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
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching pending courses: " + e.getMessage());
        }
    }

    @PostMapping("/courses/{courseId}/approve")
    public ResponseEntity<?> approveCourse(@PathVariable Long courseId) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

            course.setStatus(CourseStatus.APPROVED);
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
            return ResponseEntity.badRequest().body("Error approving course: " + e.getMessage());
        }
    }

    @PostMapping("/courses/{courseId}/reject")
    public ResponseEntity<?> rejectCourse(@PathVariable Long courseId) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

            course.setStatus(CourseStatus.REJECTED);
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
            return ResponseEntity.badRequest().body("Error rejecting course: " + e.getMessage());
        }
    }

    @GetMapping("/mentoring-sessions")
    public ResponseEntity<List<MentoringSessionDTO>> getAllMentoringSessions() {
        List<MentoringSessionDTO> sessions = mentoringService.getAllMentoringSessions();
        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/mentoring-sessions/{sessionId}")
    public ResponseEntity<?> cancelMentoringSession(@PathVariable Long sessionId) {
        try {
            boolean deleted = mentoringService.cancelMentoringSession(sessionId);
            if (deleted) {
                return ResponseEntity.ok().body(Map.of("message", "Mentoring session successfully cancelled"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error cancelling mentoring session: " + e.getMessage());
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        List<CourseDTO> courses = courseService.getAllCoursesForAdmin();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/student/{id}/enrollments")
    public ResponseEntity<?> getStudentEnrollments(@PathVariable Long id) {
        try {
            User student = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            if (!student.getRoles().contains("ROLE_STUDENT")) {
                return ResponseEntity.badRequest().body("User is not a student");
            }

            List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);

            // Map enrollments to a simpler format
            List<Map<String, Object>> enrollmentDetails = enrollments.stream()
                    .map(enrollment -> {
                        Course course = enrollment.getCourse();
                        Map<String, Object> details = new HashMap<>();
                        details.put("id", enrollment.getId());
                        details.put("courseId", course.getId());
                        details.put("courseTitle", course.getTitle());
                        details.put("enrolledAt", enrollment.getEnrolledAt());
                        details.put("completed", enrollment.getCompleted());
                        details.put("completedAt", enrollment.getCompletedAt());
                        return details;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(enrollmentDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching student enrollments: " + e.getMessage());
        }
    }

    @GetMapping("/instructor/{id}/courses")
    public ResponseEntity<?> getInstructorCourses(@PathVariable Long id) {
        try {
            User instructor = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));

            if (!instructor.getRoles().contains("ROLE_INSTRUCTOR")) {
                return ResponseEntity.badRequest().body("User is not an instructor");
            }

            List<Course> courses = courseRepository.findByInstructor(instructor);

            List<CourseResponse> courseResponses = courses.stream()
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
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching instructor courses: " + e.getMessage());
        }
    }

    @GetMapping("/course/{courseId}/chapter/{chapterIndex}/details")
    public ResponseEntity<?> getChapterDetails(
            @PathVariable Long courseId,
            @PathVariable Integer chapterIndex,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Get the chapter detail
        Optional<ChapterDetail> chapterDetailOpt = chapterDetailRepository
                .findByCourseAndChapterIndex(course, chapterIndex);

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

    @GetMapping("/courses/{courseId}/pdf")
    public ResponseEntity<?> getCoursePdf(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

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