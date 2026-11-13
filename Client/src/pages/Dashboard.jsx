import { useEffect, useState } from "react";

import api from "../api/axios";

import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/dashboard");

      const dashboardData =
        res.data.data || res.data;

      if (!dashboardData?.role) {
        throw new Error("Invalid dashboard response");
      }

      setData(dashboardData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}

        <button
          className="primary-button"
          onClick={loadDashboard}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  switch (data.role) {
    case "ADMIN":
      return <AdminDashboard data={data} />;

    case "MANAGER":
      return <ManagerDashboard data={data} />;

    case "EMPLOYEE":
      return <EmployeeDashboard data={data} />;

    default:
      return (
        <div className="error-message">
          Unauthorized role
        </div>
      );
  }
}
