import axios from "axios";
import authHeader from "./auth-header";

const API_URL = "http://localhost:8080/api/student";

class NoteService {
  getCourseNotes(courseId) {
    return axios.get(`${API_URL}/notes/${courseId}`, { headers: authHeader() });
  }

  getChapterNote(courseId, chapterIndex) {
    // For general course notes (not chapter-specific)
    if (chapterIndex === null || chapterIndex === undefined) {
      return axios.get(`${API_URL}/notes/${courseId}/general`, { headers: authHeader() });
    }
    // For chapter-specific notes
    return axios.get(`${API_URL}/notes/${courseId}/chapter/${chapterIndex}`, { headers: authHeader() });
  }

  saveNote(courseId, content, chapterIndex) {
    return axios.post(
      `${API_URL}/notes/${courseId}`, 
      { content, chapterIndex },
      { headers: authHeader() }
    );
  }

  deleteNote(noteId) {
    return axios.delete(`${API_URL}/notes/${noteId}`, { headers: authHeader() });
  }
}

export default new NoteService(); 