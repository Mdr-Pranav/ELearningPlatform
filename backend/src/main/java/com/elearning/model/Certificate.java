package com.elearning.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "certificates")
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({ "enrollments", "notes", "certificates", "password", "roles" })
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({ "enrollments", "instructor", "chapters", "notes", "certificates" })
    private Course course;

    private String certificateNumber;
    private LocalDateTime issuedAt;
    private String studentName;
    private String courseName;
    private String instructorName;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
        // Generate a unique certificate number
        certificateNumber = "CERT-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 1000);

        // Set names for easy access
        if (student != null) {
            studentName = student.getFullName();
        }
        if (course != null) {
            courseName = course.getTitle();
            if (course.getInstructor() != null) {
                instructorName = course.getInstructor().getFullName();
            }
        }
    }
}