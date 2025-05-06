package com.elearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {
    private Long id;
    private Long courseId;
    private String courseName;
    private String content;
    private Integer chapterIndex;
    private LocalDateTime updatedAt;
}