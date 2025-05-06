package com.elearning.dto;

import java.util.Map;

public class QuizSubmissionRequest {
    private Map<Integer, Integer> answers;
    private Score score;

    public static class Score {
        private int earned;
        private int total;
        private int percentage;

        public int getEarned() {
            return earned;
        }

        public void setEarned(int earned) {
            this.earned = earned;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public int getPercentage() {
            return percentage;
        }

        public void setPercentage(int percentage) {
            this.percentage = percentage;
        }
    }

    public Map<Integer, Integer> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<Integer, Integer> answers) {
        this.answers = answers;
    }

    public Score getScore() {
        return score;
    }

    public void setScore(Score score) {
        this.score = score;
    }
} 