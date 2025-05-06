package com.elearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChapterDetailResponse {
    private Long id;
    private Integer chapterIndex;
    private String title;
    private String content;
    private String objectives;
    private String resources;
    private String videoUrl;
    private Long courseId;
    private Long instructorId;
    private String instructorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}