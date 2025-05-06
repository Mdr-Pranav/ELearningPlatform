import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api/';

class MentoringService {
  // Student endpoints
  requestMentoringSession(courseId, topic, description) {
    return axios.post(
      API_URL + 'student/mentoring-session/request', 
      {
        courseId,
        topic,
        description
      },
      { headers: authHeader() }
    );
  }

  getStudentMentoringSessions() {
    return axios.get(
      API_URL + 'student/mentoring-sessions',
      { headers: authHeader() }
    );
  }

  // Instructor endpoints
  getInstructorMentoringSessions() {
    return axios.get(
      API_URL + 'instructor/mentoring-sessions',
      { headers: authHeader() }
    );
  }

  getCourseMentoringSessions(courseId) {
    return axios.get(
      API_URL + `instructor/courses/${courseId}/mentoring-sessions`,
      { headers: authHeader() }
    );
  }

  updateMentoringSession(sessionId, status, sessionDate, notes) {
    return axios.put(
      API_URL + `instructor/mentoring-sessions/${sessionId}`,
      {
        status,
        sessionDate,
        notes
      },
      { headers: authHeader() }
    );
  }
}

export default new MentoringService(); 