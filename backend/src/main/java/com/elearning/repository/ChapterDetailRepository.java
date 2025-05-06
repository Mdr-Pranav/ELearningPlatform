package com.elearning.repository;

import com.elearning.model.ChapterDetail;
import com.elearning.model.Course;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterDetailRepository extends JpaRepository<ChapterDetail, Long> {
    List<ChapterDetail> findByCourse(Course course);

    List<ChapterDetail> findByInstructor(User instructor);

    List<ChapterDetail> findByCourseAndInstructor(Course course, User instructor);

    Optional<ChapterDetail> findByCourseAndChapterIndex(Course course, Integer chapterIndex);

    Optional<ChapterDetail> findByCourseAndInstructorAndChapterIndex(Course course, User instructor,
            Integer chapterIndex);
}