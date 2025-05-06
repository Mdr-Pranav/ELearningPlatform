package com.elearning.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "mentoring_sessions")
@NoArgsConstructor
@AllArgsConstructor
public class MentoringSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    private MentoringSessionStatus status = MentoringSessionStatus.PENDING;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false, length = 1000)
    private String description;

    private LocalDateTime requestDate;

    private LocalDateTime sessionDate;

    @Column(length = 1000)
    private String notes;

    @PrePersist
    protected void onCreate() {
        requestDate = LocalDateTime.now();
    }
}