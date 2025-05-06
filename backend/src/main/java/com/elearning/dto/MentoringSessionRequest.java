package com.elearning.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MentoringSessionRequest {
    @NotNull
    private Long courseId;

    @NotBlank
    private String topic;

    @NotBlank
    private String description;
}