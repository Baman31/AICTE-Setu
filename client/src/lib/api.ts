const API_BASE = "/api";

export const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Logout failed");
    return response.json();
  },

  async getSession() {
    const response = await fetch(`${API_BASE}/auth/session`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Session check failed");
    return response.json();
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    institutionDetails?: any;
  }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Registration failed");
    return response.json();
  },

  async getInstitutionDashboard() {
    const response = await fetch(`${API_BASE}/institution/dashboard`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard");
    return response.json();
  },

  async getEvaluatorDashboard() {
    const response = await fetch(`${API_BASE}/evaluator/dashboard`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard");
    return response.json();
  },

  async getAdminDashboard() {
    const response = await fetch(`${API_BASE}/admin/dashboard`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard");
    return response.json();
  },

  async createApplication(data: any) {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to create application");
    return response.json();
  },

  async getApplication(id: string) {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch application");
    return response.json();
  },

  async updateApplication(id: string, data: any) {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to update application");
    return response.json();
  },

  async submitApplication(id: string) {
    const response = await fetch(`${API_BASE}/applications/${id}/submit`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to submit application");
    return response.json();
  },

  async sendMessage(applicationId: string, content: string) {
    const response = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, content }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  async assignEvaluator(data: {
    applicationId: string;
    evaluatorId: string;
    priority?: string;
    deadline?: string;
  }) {
    const response = await fetch(`${API_BASE}/admin/assign-evaluator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to assign evaluator");
    return response.json();
  },

  async getAllApplications() {
    const response = await fetch(`${API_BASE}/admin/applications`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch applications");
    return response.json();
  },

  async submitEvaluation(data: {
    assignmentId: string;
    applicationId: string;
    score?: number;
    comments?: string;
    recommendation?: string;
    siteVisitNotes?: string;
  }) {
    const response = await fetch(`${API_BASE}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to submit evaluation");
    return response.json();
  },
};
