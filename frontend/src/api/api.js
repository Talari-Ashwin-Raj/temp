const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();

    if (res.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!data.success) throw new Error(data.error || 'Request failed');
    return data;
  }

  static get(endpoint) {
    return this.request(endpoint);
  }

  static post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  static put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  static patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth
  static login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  static register(username, email, password, role) {
    return this.post('/auth/register', { username, email, password, role });
  }

  static getMe() {
    return this.get('/auth/me');
  }

  // Users
  static getUsers() { return this.get('/users'); }
  static getUsersByRole(role) { return this.get(`/users/role/${role}`); }
  static deleteUser(id) { return this.delete(`/users/${id}`); }
  static updateUserRole(id, role) { return this.patch(`/users/${id}/role`, { role }); }

  // Projects
  static getProjects() { return this.get('/projects'); }
  static getProject(id) { return this.get(`/projects/${id}`); }
  static createProject(data) { return this.post('/projects', data); }
  static updateProject(id, data) { return this.put(`/projects/${id}`, data); }
  static deleteProject(id) { return this.delete(`/projects/${id}`); }
  static getProjectMembers(id) { return this.get(`/projects/${id}/members`); }
  static addProjectMember(projectId, userId) { return this.post(`/projects/${projectId}/members`, { userId }); }
  static removeProjectMember(projectId, userId) { return this.delete(`/projects/${projectId}/members/${userId}`); }

  // Tasks
  static createTask(data) { return this.post('/tasks', data); }
  static getMyTasks() { return this.get('/tasks/my'); }
  static getTasksByProject(projectId) { return this.get(`/tasks/project/${projectId}`); }
  static getTask(id) { return this.get(`/tasks/${id}`); }
  static updateTask(id, data) { return this.put(`/tasks/${id}`, data); }
  static updateTaskStatus(id, status) { return this.patch(`/tasks/${id}/status`, { status }); }
  static deleteTask(id) { return this.delete(`/tasks/${id}`); }
  static getDashboardStats() { return this.get('/tasks/dashboard/stats'); }

  // Comments
  static getComments(taskId) { return this.get(`/tasks/${taskId}/comments`); }
  static addComment(taskId, message) { return this.post(`/tasks/${taskId}/comments`, { message }); }
  static deleteComment(id) { return this.delete(`/comments/${id}`); }

  // Notifications
  static getNotifications() { return this.get('/notifications'); }
  static getUnreadNotifications() { return this.get('/notifications/unread'); }
  static markNotificationRead(id) { return this.patch(`/notifications/${id}/read`); }
  static markAllNotificationsRead() { return this.patch('/notifications/read-all'); }
}

export default ApiClient;
