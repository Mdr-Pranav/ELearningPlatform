package com.elearning.repository;

import com.elearning.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.chapter.id = :chapterId")
    List<Quiz> findByChapterId(@Param("chapterId") Long chapterId);

    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.chapter.id = :chapterId AND q.chapter.course.id = :courseId")
    List<Quiz> findByChapterIdAndCourseId(@Param("chapterId") Long chapterId, @Param("courseId") Long courseId);
}