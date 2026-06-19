
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status}`,
    );
  }

  return response.json();
}

export const parkFlowApi = {
  // ---------------------------
  // Existing APIs
  // ---------------------------

  async getIncidents() {
    const response = await fetch(
      `${API_BASE_URL}/incidents`,
    );

    return handleResponse(response);
  },

  async getScenarios() {
    const response = await fetch(
      `${API_BASE_URL}/scenarios`,
    );

    return handleResponse(response);
  },

  async getHotspotsOld() {
    const response = await fetch(
      `${API_BASE_URL}/hotspots`,
    );

    return handleResponse(response);
  },

  async getEnforcementCases() {
    const response = await fetch(
      `${API_BASE_URL}/enforcement-cases`,
    );

    return handleResponse(response);
  },

  async getPatrolRoutes() {
    const response = await fetch(
      `${API_BASE_URL}/patrol-routes`,
    );

    return handleResponse(response);
  },

  async getReports(period = "7d") {
    const response = await fetch(
      `${API_BASE_URL}/reports?period=${period}`,
    );

    return handleResponse(response);
  },

  // ---------------------------
  // NEW Analytics APIs
  // ---------------------------

  async getDashboardAnalytics() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard`,
    );

    return handleResponse(response);
  },

  async getHotspots() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/hotspots`,
    );

    return handleResponse(response);
  },

  async getHeatmapData() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/heatmap`,
    );

    return handleResponse(response);
  },
  async updateEnforcementStatus(
    id: string,
    status: string,
  ) {
    const response = await fetch(
      `${API_BASE_URL}/enforcement-cases/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
  
    return handleResponse(response);
  },
};