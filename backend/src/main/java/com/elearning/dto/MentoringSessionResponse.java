package com.elearning.dto;

import com.elearning.model.MentoringSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentoringSessionResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long instructorId;
    private String instructorName;
    private Long courseId;
    private String courseTitle;
    private MentoringSessionStatus status;
    private String topic;
    private String description;
    private LocalDateTime requestDate;
    private LocalDateTime sessionDate;
    private String notes;
}