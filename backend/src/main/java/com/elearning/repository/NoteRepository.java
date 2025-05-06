package com.elearning.repository;

import com.elearning.model.Course;
import com.elearning.model.Note;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByStudent(User student);

    List<Note> findByCourse(Course course);

    List<Note> findByStudentAndCourse(User student, Course course);

    Optional<Note> findByStudentAndCourseAndChapterIndex(User student, Course course, Integer chapterIndex);

    boolean existsByStudentAndCourseAndChapterIndex(User student, Course course, Integer chapterIndex);
}