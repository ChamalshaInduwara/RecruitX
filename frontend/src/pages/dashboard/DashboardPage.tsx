import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

function DashboardPage() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                RecruitX Dashboard
              </h1>

              <p className="mt-2 text-slate-500">
                Welcome,{" "}
                {user?.name}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Role: {user?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;