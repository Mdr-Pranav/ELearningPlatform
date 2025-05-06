package com.elearning.dto;

import com.elearning.model.CourseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@ToString(exclude = {}) // Include all properties in toString for debugging
public class CourseRequest {
    @NotBlank(message = "Title cannot be empty")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @NotBlank(message = "Description cannot be empty")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    private String imageUrl;

    private String pdfUrl;

    private List<String> chapters = new ArrayList<>();

    // New field for chapter details
    private List<ChapterDetailRequest> chapterDetails = new ArrayList<>();

    @NotBlank(message = "Category cannot be empty")
    private String category;

    @NotNull(message = "Course type must be specified")
    private CourseType courseType;

    // Default constructor needed for proper deserialization
    public CourseRequest() {
        // Initialize with empty values
        this.chapters = new ArrayList<>();
        this.chapterDetails = new ArrayList<>();
    }

    // Prevent null fields by providing default values
    public void ensureFieldsNotNull() {
        if (this.title == null)
            this.title = "";
        if (this.description == null)
            this.description = "";
        if (this.category == null)
            this.category = "";
        if (this.chapters == null)
            this.chapters = new ArrayList<>();
        if (this.chapterDetails == null)
            this.chapterDetails = new ArrayList<>();
    }
}