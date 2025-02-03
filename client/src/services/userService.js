import axios from 'axios';

const API_URL = '/api/users';

const userService = {
  searchUsers: async (query) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_URL}/search`, {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getUserStatus: async (userId) => {
    const token = localStorage.getItem('token');
    return axios.get(`${API_URL}/${userId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (userData) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_URL}/profile`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default userService;
