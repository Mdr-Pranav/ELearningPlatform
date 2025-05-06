package com.elearning.controller;

import com.elearning.model.ChapterDetail;
import com.elearning.model.Question;
import com.elearning.model.Quiz;
import com.elearning.model.QuizSubmission;
import com.elearning.model.User;
import com.elearning.repository.ChapterDetailRepository;
import com.elearning.repository.QuizRepository;
import com.elearning.repository.QuizSubmissionRepository;
import com.elearning.repository.UserRepository;
import com.elearning.dto.ErrorResponse;
import com.elearning.dto.QuizSubmissionRequest;
import com.elearning.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class QuizController {
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ChapterDetailRepository chapterDetailRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/chapter/{chapterId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getChapterQuizzes(@PathVariable Long chapterId) {
        try {
            logger.info("Fetching quizzes for chapter ID: {}", chapterId);
            
            // First check if the chapter exists
            Optional<ChapterDetail> chapterOpt = chapterDetailRepository.findById(chapterId);
            if (chapterOpt.isEmpty()) {
                logger.warn("Chapter not found with ID: {}", chapterId);
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<Quiz> quizzes = quizRepository.findByChapterId(chapterId);
            
            if (quizzes == null || quizzes.isEmpty()) {
                logger.info("No quizzes found for chapter ID: {}", chapterId);
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            // Force initialization of questions collection within transaction
            quizzes.forEach(quiz -> {
                if (quiz.getQuestions() != null) {
                    quiz.getQuestions().size();
                }
            });
            
            logger.info("Successfully fetched {} quizzes for chapter ID: {}", quizzes.size(), chapterId);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            logger.error("Error fetching quizzes for chapter ID: " + chapterId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch quizzes", e.getMessage()));
        }
    }

    @PostMapping(path = "/chapter/{chapterId}", 
                consumes = MediaType.ALL_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> createQuiz(@PathVariable Long chapterId, @RequestBody Quiz quiz) {
        try {
            logger.info("Creating quiz for chapter ID: {}", chapterId);
            logger.info("Received quiz data: {}", quiz);

            Optional<ChapterDetail> chapterOpt = chapterDetailRepository.findById(chapterId);
            if (chapterOpt.isEmpty()) {
                logger.error("Chapter not found with ID: {}", chapterId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Chapter not found", "INVALID_CHAPTER_ID"));
            }

            ChapterDetail chapter = chapterOpt.get();
            quiz.setChapter(chapter);

            // Set the quiz reference and correct answer for each question
            if (quiz.getQuestions() != null) {
                for (Question question : quiz.getQuestions()) {
                    question.setQuiz(quiz);
                    if (question.getOptions() != null && 
                        question.getCorrectOptionIndex() >= 0 && 
                        question.getCorrectOptionIndex() < question.getOptions().size()) {
                        question.setCorrectAnswer(question.getOptions().get(question.getCorrectOptionIndex()));
                    }
                }
            }

            Quiz savedQuiz = quizRepository.save(quiz);
            logger.info("Quiz saved successfully with ID: {}", savedQuiz.getId());
            return ResponseEntity.ok(savedQuiz);
        } catch (Exception e) {
            logger.error("Error creating quiz: ", e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to create quiz", e.getMessage()));
        }
    }

    @PutMapping("/{quizId}")
    @Transactional
    public ResponseEntity<?> updateQuiz(@PathVariable Long quizId, @RequestBody Quiz quiz) {
        logger.info("Received PUT request to update quiz with ID: {}", quizId);
        
        // Log request headers
        jakarta.servlet.http.HttpServletRequest request = 
            ((jakarta.servlet.http.HttpServletRequest) org.springframework.web.context.request.RequestContextHolder
                .currentRequestAttributes().resolveReference("request"));
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        StringBuilder headers = new StringBuilder("Request headers: ");
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.append(headerName).append("=").append(request.getHeader(headerName)).append(", ");
        }
        logger.info(headers.toString());
        
        logger.info("Request body: {}", quiz);

        try {
            logger.info("Updating quiz with ID: {}", quizId);
            logger.debug("Received quiz data: {}", quiz);

            Optional<Quiz> existingQuizOpt = quizRepository.findById(quizId);
            if (existingQuizOpt.isEmpty()) {
                logger.error("Quiz not found with ID: {}", quizId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Quiz not found", "QUIZ_NOT_FOUND"));
            }

            Quiz existingQuiz = existingQuizOpt.get();
            existingQuiz.setTitle(quiz.getTitle());

            // Handle questions update
            if (quiz.getQuestions() != null) {
                logger.debug("Processing {} questions for update", quiz.getQuestions().size());
                
                // Create a new list for questions to keep
                List<Question> questionsToKeep = new ArrayList<>();
                
                // Process each question from the request
                for (Question newQuestion : quiz.getQuestions()) {
                    try {
                        logger.debug("Processing question: {}", newQuestion);
                        
                        if (newQuestion.getId() != null) {
                            // Update existing question
                            boolean found = false;
                            for (Question existingQuestion : existingQuiz.getQuestions()) {
                                if (existingQuestion.getId().equals(newQuestion.getId())) {
                                    logger.debug("Updating existing question with ID: {}", existingQuestion.getId());
                                    existingQuestion.setQuestionText(newQuestion.getQuestionText());
                                    existingQuestion.setOptions(newQuestion.getOptions());
                                    existingQuestion.setCorrectOptionIndex(newQuestion.getCorrectOptionIndex());
                                    existingQuestion.setPoints(newQuestion.getPoints());
                                    
                                    if (newQuestion.getOptions() != null && 
                                        newQuestion.getCorrectOptionIndex() >= 0 && 
                                        newQuestion.getCorrectOptionIndex() < newQuestion.getOptions().size()) {
                                        existingQuestion.setCorrectAnswer(
                                            newQuestion.getOptions().get(newQuestion.getCorrectOptionIndex())
                                        );
                                    }
                                    questionsToKeep.add(existingQuestion);
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                logger.warn("Question with ID {} not found in existing quiz", newQuestion.getId());
                            }
                        } else {
                            // Add new question
                            logger.debug("Adding new question");
                            Question questionToAdd = new Question();
                            questionToAdd.setQuestionText(newQuestion.getQuestionText());
                            questionToAdd.setOptions(newQuestion.getOptions());
                            questionToAdd.setCorrectOptionIndex(newQuestion.getCorrectOptionIndex());
                            questionToAdd.setPoints(newQuestion.getPoints());
                            
                            // Set the quiz reference
                            questionToAdd.setQuiz(existingQuiz);
                            
                            // Set the correct answer
                            if (newQuestion.getOptions() != null && 
                                newQuestion.getCorrectOptionIndex() >= 0 && 
                                newQuestion.getCorrectOptionIndex() < newQuestion.getOptions().size()) {
                                questionToAdd.setCorrectAnswer(
                                    newQuestion.getOptions().get(newQuestion.getCorrectOptionIndex())
                                );
                            }
                            
                            // Add to the list of questions to keep
                            questionsToKeep.add(questionToAdd);
                            logger.debug("Added new question: {}", questionToAdd);
                        }
                    } catch (Exception e) {
                        logger.error("Error processing question: {}", e.getMessage(), e);
                        throw new RuntimeException("Error processing question: " + e.getMessage(), e);
                    }
                }

                // Update the questions collection
                logger.debug("Updating questions collection with {} questions", questionsToKeep.size());
                existingQuiz.getQuestions().clear();
                existingQuiz.getQuestions().addAll(questionsToKeep);
            }

            try {
                logger.debug("Saving quiz with questions: {}", existingQuiz.getQuestions());
                Quiz savedQuiz = quizRepository.save(existingQuiz);
                logger.info("Quiz updated successfully with ID: {}", savedQuiz.getId());
                return ResponseEntity.ok(savedQuiz);
            } catch (Exception e) {
                logger.error("Error saving quiz to database: {}", e.getMessage(), e);
                throw new RuntimeException("Error saving quiz to database: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("Error updating quiz: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to update quiz", e.getMessage()));
        }
    }

    @DeleteMapping("/{quizId}")
    @Transactional
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        try {
            logger.info("Received DELETE request for quiz with ID: {}", quizId);
            
            // Log request headers
            jakarta.servlet.http.HttpServletRequest request = 
                ((jakarta.servlet.http.HttpServletRequest) org.springframework.web.context.request.RequestContextHolder
                    .currentRequestAttributes().resolveReference("request"));
            java.util.Enumeration<String> headerNames = request.getHeaderNames();
            StringBuilder headers = new StringBuilder("Request headers: ");
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                headers.append(headerName).append("=").append(request.getHeader(headerName)).append(", ");
            }
            logger.info(headers.toString());
            
            if (!quizRepository.existsById(quizId)) {
                logger.error("Quiz not found with ID: {}", quizId);
                return ResponseEntity.notFound().build();
            }
            
            quizRepository.deleteById(quizId);
            logger.info("Quiz deleted successfully with ID: {}", quizId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting quiz: ", e);
            return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Failed to delete quiz", e.getMessage()));
        }
    }

    @PostMapping("/{quizId}/submit")
    @Transactional
    public ResponseEntity<?> submitQuiz(
            @PathVariable Long quizId,
            @RequestBody QuizSubmissionRequest submissionRequest,
            @RequestHeader("Authorization") String token) {
        try {
            logger.info("Received quiz submission for quiz ID: {}", quizId);
            
            // Extract username from JWT token
            String username = jwtUtils.getUserNameFromJwtToken(token.substring(7));
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                logger.error("User not found for username: {}", username);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("User not found", "USER_NOT_FOUND"));
            }
            User user = userOpt.get();

            // Get the quiz
            Optional<Quiz> quizOpt = quizRepository.findById(quizId);
            if (quizOpt.isEmpty()) {
                logger.error("Quiz not found with ID: {}", quizId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Quiz not found", "QUIZ_NOT_FOUND"));
            }
            Quiz quiz = quizOpt.get();

            // Create submission
            QuizSubmission submission = new QuizSubmission();
            submission.setQuiz(quiz);
            submission.setUser(user);
            submission.setEarnedPoints(submissionRequest.getScore().getEarned());
            submission.setTotalPoints(submissionRequest.getScore().getTotal());
            submission.setPercentage(submissionRequest.getScore().getPercentage());
            submission.setAnswers(submissionRequest.getAnswers());

            // Save submission
            QuizSubmission savedSubmission = quizSubmissionRepository.save(submission);
            logger.info("Quiz submission saved successfully with ID: {}", savedSubmission.getId());

            return ResponseEntity.ok(savedSubmission);
        } catch (Exception e) {
            logger.error("Error submitting quiz: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to submit quiz", e.getMessage()));
        }
    }
} 