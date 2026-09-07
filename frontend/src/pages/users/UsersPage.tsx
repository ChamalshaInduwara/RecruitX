import axios from "axios";

import {
  Plus,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";

import type {
  SystemUser,
  UserActionResponse,
  UserRole,
  UsersResponse,
} from "../../types/user";

/*
|--------------------------------------------------------------------------
| Create User Form
|--------------------------------------------------------------------------
*/

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const initialForm:
  CreateUserForm = {
  name: "",
  email: "",
  password: "",
  role: "RECRUITER",
};

function UsersPage() {
  const {
    user: currentUser,
  } = useAuth();

  const [users, setUsers] =
    useState<SystemUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Create Modal
  |--------------------------------------------------------------------------
  */

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [form, setForm] =
    useState<CreateUserForm>(
      initialForm
    );

  const [creating, setCreating] =
    useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Action State
  |--------------------------------------------------------------------------
  */

  const [
    updatingUserId,
    setUpdatingUserId,
  ] = useState<string | null>(
    null
  );

  const [
    actionError,
    setActionError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Users
  |--------------------------------------------------------------------------
  */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<UsersResponse>(
          "/users"
        );

      setUsers(
        response.data.users
      );
    } catch (error) {
      console.error(
        "Load users error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to load users."
        );
      } else {
        setError(
          "Unable to load users."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  const updateForm = (
    field:
      keyof CreateUserForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Create User
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setCreating(true);
      setFormError("");

      await api.post<UserActionResponse>(
        "/users",
        {
          name:
            form.name.trim(),

          email:
            form.email.trim(),

          password:
            form.password,

          role:
            form.role,
        }
      );

      setForm(initialForm);

      setShowCreateModal(
        false
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setFormError(
          error.response?.data
            ?.message ||
            "Unable to create user."
        );
      } else {
        setFormError(
          "Unable to create user."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Change Role
  |--------------------------------------------------------------------------
  */

  const changeRole = async (
    userId: string,
    role: UserRole
  ) => {
    try {
      setUpdatingUserId(
        userId
      );

      setActionError("");

      await api.patch<UserActionResponse>(
        `/users/${userId}`,
        {
          role,
        }
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Role update error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setActionError(
          error.response?.data
            ?.message ||
            "Unable to change user role."
        );
      } else {
        setActionError(
          "Unable to change user role."
        );
      }
    } finally {
      setUpdatingUserId(
        null
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Activate / Deactivate
  |--------------------------------------------------------------------------
  */

  const toggleStatus = async (
    user: SystemUser
  ) => {
    const newStatus =
      user.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setUpdatingUserId(
        user.id
      );

      setActionError("");

      await api.patch<UserActionResponse>(
        `/users/${user.id}`,
        {
          status:
            newStatus,
        }
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setActionError(
          error.response?.data
            ?.message ||
            "Unable to update account status."
        );
      } else {
        setActionError(
          "Unable to update account status."
        );
      }
    } finally {
      setUpdatingUserId(
        null
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Counts
  |--------------------------------------------------------------------------
  */

  const activeUsers =
    users.filter(
      (user) =>
        user.status === "ACTIVE"
    ).length;

  const recruiterCount =
    users.filter(
      (user) =>
        user.role === "RECRUITER"
    ).length;

  const adminCount =
    users.filter(
      (user) =>
        user.role === "ADMIN"
    ).length;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage RecruitX staff,
            roles and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(
              initialForm
            );

            setFormError("");

            setShowCreateModal(
              true
            );
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />

          Add User
        </button>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <UserRoundCheck
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Active Users
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {activeUsers}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <UserCog
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Recruiters
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {recruiterCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Administrators
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {adminCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Users */}

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">
            Loading users...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vacancies
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Interviews
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {users.map(
                  (user) => {
                    const isCurrentUser =
                      user.id ===
                      currentUser?.id;

                    const isUpdating =
                      updatingUserId ===
                      user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">
                                {
                                  user.name
                                }
                              </p>

                              {isCurrentUser && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                  You
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                user.email
                              }
                            </p>
                          </div>
                        </td>

                        {/* Role */}

                        <td className="px-6 py-4">
                          {isCurrentUser ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {
                                user.role
                              }
                            </span>
                          ) : (
                            <select
                              value={
                                user.role
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) =>
                                changeRole(
                                  user.id,
                                  event
                                    .target
                                    .value as UserRole
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
                            >
                              <option value="RECRUITER">
                                Recruiter
                              </option>

                              <option value="ADMIN">
                                Admin
                              </option>
                            </select>
                          )}
                        </td>

                        {/* Status */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.status ===
                              "ACTIVE"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {
                              user.status
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {user._count
                            ?.createdVacancies ??
                            0}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {user._count
                            ?.interviews ??
                            0}
                        </td>

                        {/* Activate / Deactivate */}

                        <td className="px-6 py-4 text-right">
                          {isCurrentUser ? (
                            <span className="text-xs text-slate-400">
                              Current account
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                toggleStatus(
                                  user
                                )
                              }
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                                user.status ===
                                "ACTIVE"
                                  ? "border-red-200 text-red-700 hover:bg-red-50"
                                  : "border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {user.status ===
                              "ACTIVE" ? (
                                <>
                                  <UserRoundX
                                    size={
                                      16
                                    }
                                  />

                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserRoundCheck
                                    size={
                                      16
                                    }
                                  />

                                  Activate
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Add User
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a RecruitX staff
                  account.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Recruiter name"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email *
                </label>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="recruiter@company.com"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Temporary Password *
                </label>

                <input
                  required
                  type="password"
                  minLength={8}
                  value={
                    form.password
                  }
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value
                    )
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Share the temporary
                  password securely with
                  the staff member.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Role *
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    updateForm(
                      "role",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="RECRUITER">
                    Recruiter
                  </option>

                  <option value="ADMIN">
                    Administrator
                  </option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;