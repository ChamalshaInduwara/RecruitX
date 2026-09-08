import { useState } from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Vacancies",
    path: "/vacancies",
    icon: BriefcaseBusiness,
  },
  {
    name: "Candidates",
    path: "/candidates",
    icon: Users,
  },
  {
    name: "Applications",
    path: "/applications",
    icon: FileText,
  },
  {
    name: "Interviews",
    path: "/interviews",
    icon: CalendarDays,
  },
];

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();

  const visibleNavigationItems =
    user?.role === "ADMIN"
      ? [
          ...navigationItems,
          {
            name: "Users",
            path: "/users",
            icon: UserCog,
          },
        ]
      : navigationItems;

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const sidebarContent = (
    <>
      {/* Logo */}

      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <div>
          <h1 className="text-xl font-bold text-white">RecruitX</h1>

          <p className="text-xs text-slate-400">Recruitment System</p>
        </div>
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-1 px-3 py-5">
        {visibleNavigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={19} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar User */}

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-white">
            {user?.name}
          </p>

          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 transition-transform duration-200 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="absolute right-3 top-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {sidebarContent}
      </aside>

      {/* Main Area */}

      <div className="min-w-0 lg:pl-64">
        {/* Header */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Recruitment Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Avatar */}

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>

              <p className="text-xs text-slate-500">
                {user?.role === "ADMIN" ? "Administrator" : "Recruiter"}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
