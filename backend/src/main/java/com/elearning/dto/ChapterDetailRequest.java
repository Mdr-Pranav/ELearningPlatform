package com.elearning.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChapterDetailRequest {
    @NotNull(message = "Chapter index is required")
    private Integer chapterIndex;

    @NotBlank(message = "Chapter title is required")
    private String title;

    private String content;

    private String objectives;

    private String resources;

    private String videoUrl;
}