-- Create chapter_details table
CREATE TABLE IF NOT EXISTS chapter_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chapter_index INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    objectives TEXT,
    resources TEXT,
    course_id BIGINT NOT NULL,
    instructor_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
); 