package com.elearning.controller;

import com.elearning.dto.CourseResponse;
import com.elearning.dto.EnrollmentRequest;
import com.elearning.dto.MessageResponse;
import com.elearning.dto.NoteRequest;
import com.elearning.dto.NoteResponse;
import com.elearning.dto.MentoringSessionRequest;
import com.elearning.dto.MentoringSessionResponse;
import com.elearning.model.Course;
import com.elearning.model.CourseType;
import com.elearning.model.Enrollment;
import com.elearning.model.Note;
import com.elearning.model.User;
import com.elearning.model.UserType;
import com.elearning.model.ChapterDetail;
import com.elearning.model.MentoringSession;
import com.elearning.model.MentoringSessionStatus;
import com.elearning.dto.ChapterDetailResponse;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.EnrollmentRepository;
import com.elearning.repository.NoteRepository;
import com.elearning.repository.UserRepository;
import com.elearning.repository.ChapterDetailRepository;
import com.elearning.repository.MentoringSessionRepository;
import com.elearning.security.services.UserDetailsImpl;
import com.elearning.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.elearning.model.Certificate;
import com.elearning.repository.CertificateRepository;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasAuthority('ROLE_STUDENT')")
public class StudentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private ChapterDetailRepository chapterDetailRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private MentoringSessionRepository mentoringSessionRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getStudentDashboard() {
        return ResponseEntity.ok(new MessageResponse("Student Dashboard Data"));
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getStudentCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();
        List<Course> allCourses = courseRepository.findAll();

        // Filter courses based on user type
        List<Course> filteredCourses = allCourses.stream()
                .filter(course -> course.getCourseType().name().equals(student.getUserType().name()))
                .collect(Collectors.toList());

        List<CourseResponse> courseResponses = filteredCourses.stream()
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

    @GetMapping("/enrolled-courses")
    public ResponseEntity<?> getEnrolledCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (userOpt.isPresent()) {
            User student = userOpt.get();
            List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);

            List<CourseResponse> courseResponses = enrollments.stream()
                    .map(enrollment -> {
                        Course course = enrollment.getCourse();
                        return new CourseResponse(
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
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(courseResponses);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollInCourse(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody EnrollmentRequest enrollmentRequest) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();
        Long courseId = enrollmentRequest.getCourseId();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if course type matches student type
        if (!course.getCourseType().name().equals(student.getUserType().name())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("This course is not suitable for your user type"));
        }

        // Check if already enrolled
        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are already enrolled in this course"));
        }

        // Create enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        enrollmentRepository.save(enrollment);

        return ResponseEntity.ok(new MessageResponse("Successfully enrolled in course: " + course.getTitle()));
    }

    @DeleteMapping("/unenroll/{courseId}")
    public ResponseEntity<?> unenrollFromCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Find the enrollment
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByStudentAndCourse(student, course);

        if (!enrollmentOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Delete the enrollment
        enrollmentRepository.delete(enrollmentOpt.get());

        return ResponseEntity.ok(new MessageResponse("Successfully unenrolled from course: " + course.getTitle()));
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getStudentAssignments() {
        return ResponseEntity.ok(new MessageResponse("Student Assignments"));
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getStudentProgress() {
        return ResponseEntity.ok(new MessageResponse("Student Progress"));
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
            response.put("userType", userData.getUserType());

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
        response.put("userType", updatedUser.getUserType());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-user-type")
    public ResponseEntity<?> updateUserType(@RequestBody String userType,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(new MessageResponse("Unauthorized: User not authenticated"));
            }

            // Remove quotes if present and trim whitespace
            userType = userType.replaceAll("\"", "").trim();
            UserType type = UserType.valueOf(userType);

            // Get user by username instead of ID
            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body(new MessageResponse("User not found"));
            }

            User updatedUser = userService.updateUserType(userOpt.get().getId(), type);

            Map<String, Object> response = new HashMap<>();
            response.put("username", updatedUser.getUsername());
            response.put("email", updatedUser.getEmail());
            response.put("fullName", updatedUser.getFullName());
            response.put("phoneNumber", updatedUser.getPhoneNumber());
            response.put("roles", updatedUser.getRoles());
            response.put("userType", updatedUser.getUserType());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error updating user type: " + e.getMessage()));
        }
    }

    @GetMapping("/notes/{courseId}")
    public ResponseEntity<?> getCourseNotes(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Get all notes for this student and course
        List<Note> notes = noteRepository.findByStudentAndCourse(student, course);

        // Map to response DTOs
        List<NoteResponse> noteResponses = notes.stream()
                .map(note -> new NoteResponse(
                        note.getId(),
                        course.getId(),
                        course.getTitle(),
                        note.getContent(),
                        note.getChapterIndex(),
                        note.getUpdatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(noteResponses);
    }

    @GetMapping("/notes/{courseId}/chapter/{chapterIndex}")
    public ResponseEntity<?> getChapterNote(
            @PathVariable Long courseId,
            @PathVariable Integer chapterIndex,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Get the note for this chapter if it exists
        Optional<Note> noteOpt = noteRepository.findByStudentAndCourseAndChapterIndex(student, course, chapterIndex);

        if (noteOpt.isPresent()) {
            Note note = noteOpt.get();
            NoteResponse response = new NoteResponse(
                    note.getId(),
                    course.getId(),
                    course.getTitle(),
                    note.getContent(),
                    note.getChapterIndex(),
                    note.getUpdatedAt());
            return ResponseEntity.ok(response);
        } else {
            // Return empty note
            NoteResponse emptyResponse = new NoteResponse(
                    null,
                    course.getId(),
                    course.getTitle(),
                    "",
                    chapterIndex,
                    null);
            return ResponseEntity.ok(emptyResponse);
        }
    }

    @PostMapping("/notes/{courseId}")
    public ResponseEntity<?> saveNote(
            @PathVariable Long courseId,
            @RequestBody NoteRequest noteRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Check if a note for this chapter already exists
        Optional<Note> existingNoteOpt = noteRepository.findByStudentAndCourseAndChapterIndex(
                student, course, noteRequest.getChapterIndex());

        Note note;

        if (existingNoteOpt.isPresent()) {
            // Update existing note
            note = existingNoteOpt.get();
            note.setContent(noteRequest.getContent());
            // updatedAt will be set by @PreUpdate
        } else {
            // Create new note
            note = new Note();
            note.setStudent(student);
            note.setCourse(course);
            note.setContent(noteRequest.getContent());
            note.setChapterIndex(noteRequest.getChapterIndex());
        }

        Note savedNote = noteRepository.save(note);

        NoteResponse response = new NoteResponse(
                savedNote.getId(),
                course.getId(),
                course.getTitle(),
                savedNote.getContent(),
                savedNote.getChapterIndex(),
                savedNote.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<?> deleteNote(
            @PathVariable Long noteId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Note> noteOpt = noteRepository.findById(noteId);

        if (!noteOpt.isPresent()) {
            return ResponseEntity.status(404).body("Note not found");
        }

        Note note = noteOpt.get();

        // Check if the note belongs to the current student
        if (!note.getStudent().getId().equals(student.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to delete this note");
        }

        noteRepository.delete(note);

        return ResponseEntity.ok(new MessageResponse("Note deleted successfully"));
    }

    @GetMapping("/notes/{courseId}/general")
    public ResponseEntity<?> getGeneralCourseNote(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Get the general note (with null chapterIndex) if it exists
        Optional<Note> noteOpt = noteRepository.findByStudentAndCourseAndChapterIndex(student, course, null);

        if (noteOpt.isPresent()) {
            Note note = noteOpt.get();
            NoteResponse response = new NoteResponse(
                    note.getId(),
                    course.getId(),
                    course.getTitle(),
                    note.getContent(),
                    note.getChapterIndex(),
                    note.getUpdatedAt());
            return ResponseEntity.ok(response);
        } else {
            // Return empty note
            NoteResponse emptyResponse = new NoteResponse(
                    null,
                    course.getId(),
                    course.getTitle(),
                    "",
                    null,
                    null);
            return ResponseEntity.ok(emptyResponse);
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

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }

        User student = userOpt.get();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if the student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // First try to get the chapter detail with the instructor
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

    @PostMapping("/mentoring-session/request")
    public ResponseEntity<?> requestMentoringSession(
            @Valid @RequestBody MentoringSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("Student not found");
        }

        User student = userOpt.get();
        Long courseId = request.getCourseId();

        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();
        User instructor = course.getInstructor();

        // Check if student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(new MessageResponse("You are not enrolled in this course"));
        }

        // Create new mentoring session
        MentoringSession session = new MentoringSession();
        session.setStudent(student);
        session.setInstructor(instructor);
        session.setCourse(course);
        session.setTopic(request.getTopic());
        session.setDescription(request.getDescription());
        session.setStatus(MentoringSessionStatus.PENDING);

        mentoringSessionRepository.save(session);

        MentoringSessionResponse response = new MentoringSessionResponse(
                session.getId(),
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                instructor.getId(),
                instructor.getFullName(),
                course.getId(),
                course.getTitle(),
                session.getStatus(),
                session.getTopic(),
                session.getDescription(),
                session.getRequestDate(),
                session.getSessionDate(),
                session.getNotes());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/mentoring-sessions")
    public ResponseEntity<?> getStudentMentoringSessions(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

        if (!userOpt.isPresent()) {
            return ResponseEntity.status(404).body("Student not found");
        }

        User student = userOpt.get();
        List<MentoringSession> sessions = mentoringSessionRepository.findByStudent(student);

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

    @PostMapping("/courses/{courseId}/complete")
    public ResponseEntity<?> completeCourse(@PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Course> courseOpt = courseRepository.findById(courseId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (!courseOpt.isPresent()) {
                return ResponseEntity.status(404).body("Course not found");
            }

            User student = userOpt.get();
            Course course = courseOpt.get();

            System.out.println("DEBUG: Starting course completion process");
            System.out.println("DEBUG: Student ID: " + student.getId() + ", Username: " + student.getUsername());
            System.out.println("DEBUG: Course ID: " + course.getId() + ", Title: " + course.getTitle());

            // Check if student is enrolled in this course
            Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByStudentAndCourse(student, course);
            if (!enrollmentOpt.isPresent()) {
                System.out.println("DEBUG: Student is not enrolled in the course");
                return ResponseEntity.badRequest().body("You are not enrolled in this course");
            }

            Enrollment enrollment = enrollmentOpt.get();

            // Mark the enrollment as completed
            enrollment.setCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
            Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
            System.out.println("DEBUG: Enrollment marked as completed. Enrollment ID: " + savedEnrollment.getId());

            // Check for existing certificate
            boolean certificateExists = certificateRepository.existsByStudentAndCourse(student, course);
            System.out.println("DEBUG: Certificate exists check: " + certificateExists);

            Certificate certificate;
            // Generate certificate if it doesn't exist
            if (!certificateExists) {
                System.out.println("DEBUG: Creating new certificate");
                certificate = new Certificate();
                certificate.setStudent(student);
                certificate.setCourse(course);

                // Print certificate details before saving
                System.out.println("DEBUG: Certificate details before save:");
                System.out.println("DEBUG: Student Name: " + certificate.getStudentName());
                System.out.println("DEBUG: Course Name: " + certificate.getCourseName());
                System.out.println("DEBUG: Instructor Name: " + certificate.getInstructorName());

                Certificate savedCertificate = certificateRepository.save(certificate);
                System.out.println("DEBUG: Certificate created successfully");
                System.out.println("DEBUG: Certificate ID: " + savedCertificate.getId());
                System.out.println("DEBUG: Certificate Number: " + savedCertificate.getCertificateNumber());
            } else {
                System.out.println("DEBUG: Certificate already exists for this course and student");
                certificate = certificateRepository.findByStudentAndCourse(student, course)
                        .orElseThrow(() -> new RuntimeException("Certificate not found despite existing check"));
                
                // Update certificate with latest course details
                System.out.println("DEBUG: Updating existing certificate with latest course details");
                certificate.setCourseName(course.getTitle());
                if (course.getInstructor() != null) {
                    certificate.setInstructorName(course.getInstructor().getFullName());
                }
                certificate.setIssuedAt(LocalDateTime.now());
                
                // Save the updated certificate
                certificate = certificateRepository.save(certificate);
                System.out.println("DEBUG: Certificate updated successfully");
                System.out.println("DEBUG: Updated Certificate ID: " + certificate.getId());
                System.out.println("DEBUG: Updated Course Name: " + certificate.getCourseName());
                System.out.println("DEBUG: Updated Instructor Name: " + certificate.getInstructorName());
            }

            return ResponseEntity.ok(new MessageResponse("Course completed successfully and certificate generated"));
        } catch (Exception e) {
            System.err.println("ERROR in completeCourse: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error completing course: " + e.getMessage());
        }
    }

    @GetMapping("/certificates")
    public ResponseEntity<?> getMyCertificates(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            System.out.println("DEBUG: Unauthorized request to /certificates - no user details");
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            System.out.println("DEBUG: Starting certificate fetch process");
            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());

            if (!userOpt.isPresent()) {
                System.out.println("DEBUG: User not found: " + userDetails.getUsername());
                return ResponseEntity.status(404).body("User not found");
            }

            User student = userOpt.get();
            System.out.println("DEBUG: Fetching certificates for student ID: " + student.getId() + ", Username: "
                    + student.getUsername());

            List<Certificate> certificates = certificateRepository.findByStudent(student);
            System.out.println("DEBUG: Found " + certificates.size() + " certificates");

            // Print details of each certificate found
            certificates.forEach(cert -> {
                System.out.println("DEBUG: Certificate details:");
                System.out.println("DEBUG: ID: " + cert.getId());
                System.out.println("DEBUG: Certificate Number: " + cert.getCertificateNumber());
                System.out.println("DEBUG: Course: " + cert.getCourseName());
                System.out.println("DEBUG: Student: " + cert.getStudentName());
                System.out.println("DEBUG: Instructor: " + cert.getInstructorName());
                System.out.println("DEBUG: Issued At: " + cert.getIssuedAt());
                System.out.println("DEBUG: ----------------------");
            });

            List<Map<String, Object>> certificateResponses = certificates.stream()
                    .map(cert -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", cert.getId());
                        response.put("certificateNumber", cert.getCertificateNumber());
                        response.put("issuedAt", cert.getIssuedAt());
                        response.put("studentName", cert.getStudentName());
                        response.put("courseName", cert.getCourseName());
                        response.put("instructorName", cert.getInstructorName());
                        response.put("courseId", cert.getCourse().getId());
                        response.put("studentId", cert.getStudent().getId());
                        return response;
                    })
                    .collect(Collectors.toList());

            System.out.println(
                    "DEBUG: Successfully mapped " + certificateResponses.size() + " certificates to response format");
            System.out.println("DEBUG: Response data: " + certificateResponses);
            return ResponseEntity.ok(certificateResponses);
        } catch (Exception e) {
            System.err.println("ERROR in getMyCertificates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching certificates: " + e.getMessage());
        }
    }

    @GetMapping("/certificates/{certificateId}")
    public ResponseEntity<?> getCertificateDetails(
            @PathVariable Long certificateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Certificate> certificateOpt = certificateRepository.findById(certificateId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (!certificateOpt.isPresent()) {
                return ResponseEntity.status(404).body("Certificate not found");
            }

            Certificate certificate = certificateOpt.get();
            User student = userOpt.get();

            // Verify that the certificate belongs to the student
            if (!certificate.getStudent().getId().equals(student.getId())) {
                return ResponseEntity.status(403).body("You are not authorized to view this certificate");
            }

            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching certificate details: " + e.getMessage());
        }
    }

    @GetMapping("/certificates/{certificateId}/download")
    public ResponseEntity<?> downloadCertificate(
            @PathVariable Long certificateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
            Optional<Certificate> certificateOpt = certificateRepository.findById(certificateId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (!certificateOpt.isPresent()) {
                return ResponseEntity.status(404).body("Certificate not found");
            }

            Certificate certificate = certificateOpt.get();
            User student = userOpt.get();

            // Verify that the certificate belongs to the student
            if (!certificate.getStudent().getId().equals(student.getId())) {
                return ResponseEntity.status(403).body("You are not authorized to download this certificate");
            }

            // Create certificate content
            String certificateContent = String.format(
                    "Certificate of Completion\n\n" +
                            "This is to certify that\n" +
                            "%s\n\n" +
                            "has successfully completed the course\n" +
                            "%s\n\n" +
                            "Instructor: %s\n" +
                            "Certificate Number: %s\n" +
                            "Date Issued: %s\n\n" +
                            "Congratulations on your achievement!",
                    certificate.getStudentName(),
                    certificate.getCourseName(),
                    certificate.getInstructorName(),
                    certificate.getCertificateNumber(),
                    certificate.getIssuedAt() != null ? certificate.getIssuedAt().toString() : "Not available");

            // Set response headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment",
                    String.format("certificate_%s.txt", certificate.getCertificateNumber()));
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(certificateContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error downloading certificate: " + e.getMessage());
        }
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

        User student = userOpt.get();
        Optional<Course> courseOpt = courseRepository.findById(courseId);

        if (!courseOpt.isPresent()) {
            return ResponseEntity.status(404).body("Course not found");
        }

        Course course = courseOpt.get();

        // Check if student is enrolled in this course
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            return ResponseEntity.status(403).body("You are not enrolled in this course");
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