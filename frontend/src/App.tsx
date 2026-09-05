import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";

import LoginPage from "./pages/auth/LoginPage";

import DashboardPage from "./pages/dashboard/DashboardPage";

import VacanciesPage from "./pages/vacancies/VacanciesPage";

import CandidatesPage from "./pages/candidates/CandidatesPage";

import ApplicationsPage from "./pages/applications/ApplicationsPage";

import InterviewsPage from "./pages/interviews/InterviewsPage";

function App() {
  return (
    <Routes>
      {/* Public */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* Protected Application */}

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/vacancies"
          element={<VacanciesPage />}
        />

        <Route
          path="/candidates"
          element={<CandidatesPage />}
        />

        <Route
          path="/applications"
          element={<ApplicationsPage />}
        />

        <Route
          path="/interviews"
          element={<InterviewsPage />}
        />
      </Route>

      {/* Redirects */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;