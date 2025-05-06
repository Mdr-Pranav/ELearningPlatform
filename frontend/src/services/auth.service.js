import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth/';

class AuthService {
  login(username, password) {
    return axios
      .post(API_URL + 'signin', {
        username,
        password
      })
      .then(response => {
        if (response.data.token) {
          localStorage.setItem('user', JSON.stringify(response.data));
          localStorage.setItem('authToken', response.data.token);
          console.log('Auth token stored:', response.data.token);
        }

        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }

  register(username, email, password, fullName, phoneNumber, role, userType) {
    console.log('Registration request data:', {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      roles: [role],
      userType
    });
    return axios.post(API_URL + 'signup', {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      roles: [role],
      userType
    });
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }
}

export default new AuthService(); 