import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";

import LoginPage from "./pages/auth/LoginPage";

import DashboardPage from "./pages/dashboard/DashboardPage";

import VacanciesPage from "./pages/vacancies/VacanciesPage";

import CandidatesPage from "./pages/candidates/CandidatesPage";

import ApplicationsPage from "./pages/applications/ApplicationsPage";

import InterviewsPage from "./pages/interviews/InterviewsPage";

import VacancyDetailsPage from "./pages/vacancies/VacancyDetailsPage";

import CandidateDetailsPage from "./pages/candidates/CandidateDetailsPage";

import ApplicationDetailsPage from "./pages/applications/ApplicationDetailsPage";

import AdminRoute from "./components/AdminRoute";

import UsersPage from "./pages/users/UsersPage";

function App() {
  return (
    <Routes>
      {/* Public */}

      <Route path="/login" element={<LoginPage />} />

      {/* Protected Application */}

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/vacancies" element={<VacanciesPage />} />

        <Route path="/candidates" element={<CandidatesPage />} />

        <Route path="/candidates/:id" element={<CandidateDetailsPage />} />

        <Route path="/applications" element={<ApplicationsPage />} />

        <Route path="/applications/:id" element={<ApplicationDetailsPage />} />

        <Route path="/interviews" element={<InterviewsPage />} />

        <Route path="/vacancies/:id" element={<VacancyDetailsPage />} />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Redirects */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
