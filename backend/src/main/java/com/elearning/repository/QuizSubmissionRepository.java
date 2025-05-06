package com.elearning.repository;

import com.elearning.model.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.quiz.id = :quizId AND qs.user.id = :userId")
    List<QuizSubmission> findByQuizIdAndUserId(@Param("quizId") Long quizId, @Param("userId") Long userId);

    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.user.id = :userId")
    List<QuizSubmission> findByUserId(@Param("userId") Long userId);
} 