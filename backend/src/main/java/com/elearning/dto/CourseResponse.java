package com.elearning.dto;

import com.elearning.model.CourseStatus;
import com.elearning.model.CourseType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private String pdfUrl;
    private List<String> chapters;
    private String category;
    private CourseType courseType;
    private CourseStatus status;
    private Long instructorId;
    private String instructorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}