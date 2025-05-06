package com.elearning.repository;

import com.elearning.model.Course;
import com.elearning.model.MentoringSession;
import com.elearning.model.MentoringSessionStatus;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentoringSessionRepository extends JpaRepository<MentoringSession, Long> {
    List<MentoringSession> findByStudent(User student);

    List<MentoringSession> findByInstructor(User instructor);

    List<MentoringSession> findByCourse(Course course);

    List<MentoringSession> findByStatus(MentoringSessionStatus status);

    List<MentoringSession> findByStudentAndStatus(User student, MentoringSessionStatus status);

    List<MentoringSession> findByInstructorAndStatus(User instructor, MentoringSessionStatus status);

    List<MentoringSession> findByCourseAndStatus(Course course, MentoringSessionStatus status);

    List<MentoringSession> findByStudentAndCourse(User student, Course course);

    List<MentoringSession> findByInstructorAndCourse(User instructor, Course course);
}