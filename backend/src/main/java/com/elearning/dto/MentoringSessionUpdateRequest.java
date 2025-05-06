package com.elearning.dto;

import com.elearning.model.MentoringSessionStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MentoringSessionUpdateRequest {
    private MentoringSessionStatus status;
    private LocalDateTime sessionDate;
    private String notes;
}