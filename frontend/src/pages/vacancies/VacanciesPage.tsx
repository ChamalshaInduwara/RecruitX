import axios from "axios";

import {
  BriefcaseBusiness,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import type {
  CreateVacancyResponse,
  VacanciesResponse,
  Vacancy,
  VacancyStatus,
} from "../../types/vacancy";

/*
|--------------------------------------------------------------------------
| Form State
|--------------------------------------------------------------------------
*/

interface VacancyForm {
  title: string;
  department: string;
  description: string;
  requiredSkills: string;
  employmentType: string;
  deadline: string;
  status: VacancyStatus;
}

const initialForm: VacancyForm = {
  title: "",
  department: "",
  description: "",
  requiredSkills: "",
  employmentType: "Internship",
  deadline: "",
  status: "DRAFT",
};

/*
|--------------------------------------------------------------------------
| Status Styles
|--------------------------------------------------------------------------
*/

const statusStyles: Record<
  VacancyStatus,
  string
> = {
  ACTIVE:
    "bg-green-50 text-green-700 ring-green-600/20",

  DRAFT:
    "bg-amber-50 text-amber-700 ring-amber-600/20",

  CLOSED:
    "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function VacanciesPage() {
  const [vacancies, setVacancies] =
    useState<Vacancy[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [form, setForm] =
    useState<VacancyForm>(
      initialForm
    );

  const [creating, setCreating] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Vacancies
  |--------------------------------------------------------------------------
  */

  const loadVacancies = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (statusFilter) {
        params.set(
          "status",
          statusFilter
        );
      }

      const query = params.toString();

      const response =
        await api.get<VacanciesResponse>(
          `/vacancies${
            query
              ? `?${query}`
              : ""
          }`
        );

      setVacancies(
        response.data.vacancies
      );
    } catch (error) {
      console.error(
        "Load vacancies error:",
        error
      );

      setError(
        "Unable to load vacancies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          loadVacancies();
        },
        300
      );

    return () =>
      window.clearTimeout(timeout);
  }, [search, statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | Update Form
  |--------------------------------------------------------------------------
  */

  const updateForm = (
    field: keyof VacancyForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Create Vacancy
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setCreating(true);
      setFormError("");

      const payload = {
        title: form.title.trim(),

        department:
          form.department.trim() ||
          undefined,

        description:
          form.description.trim(),

        requiredSkills:
          form.requiredSkills.trim() ||
          undefined,

        employmentType:
          form.employmentType.trim() ||
          undefined,

        deadline:
          form.deadline ||
          undefined,

        status: form.status,
      };

      await api.post<CreateVacancyResponse>(
        "/vacancies",
        payload
      );

      setForm(initialForm);

      setShowCreateModal(false);

      await loadVacancies();
    } catch (error) {
      console.error(
        "Create vacancy error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setFormError(
          error.response?.data
            ?.message ||
            "Unable to create vacancy."
        );
      } else {
        setFormError(
          "Unable to create vacancy."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Vacancies
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage job and internship
            vacancies.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreateModal(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={18} />

          Create Vacancy
        </button>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search vacancies by title..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              All statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">
            Loading vacancies...
          </p>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <BriefcaseBusiness
            size={36}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 font-semibold text-slate-800">
            No vacancies found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a vacancy or change
            your search filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vacancy
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applications
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Deadline
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {vacancies.map(
                    (vacancy) => (
                      <tr
                        key={
                          vacancy.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {
                              vacancy.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {vacancy.employmentType ||
                              "Not specified"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {vacancy.department ||
                            "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                              statusStyles[
                                vacancy
                                  .status
                              ]
                            }`}
                          >
                            {
                              vacancy.status
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {vacancy
                            ._count
                            ?.applications ??
                            0}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {vacancy.deadline
                            ? new Date(
                                vacancy.deadline
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}

          <div className="space-y-3 md:hidden">
            {vacancies.map(
              (vacancy) => (
                <div
                  key={vacancy.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {vacancy.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {vacancy.department ||
                          "No department"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        statusStyles[
                          vacancy.status
                        ]
                      }`}
                    >
                      {vacancy.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">
                        Applications
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {vacancy
                          ._count
                          ?.applications ??
                          0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Deadline
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {vacancy.deadline
                          ? new Date(
                              vacancy.deadline
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Create Vacancy Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Create Vacancy
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new job or
                  internship vacancy.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(
                    false
                  );

                  setFormError("");
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

              {/* Title */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Vacancy title *
                </label>

                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "title",
                      event.target
                        .value
                    )
                  }
                  placeholder="Software Engineering Intern"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Department */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Department
                  </label>

                  <input
                    type="text"
                    value={
                      form.department
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "department",
                        event.target
                          .value
                      )
                    }
                    placeholder="Engineering"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Employment Type */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Employment type
                  </label>

                  <select
                    value={
                      form.employmentType
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "employmentType",
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="Internship">
                      Internship
                    </option>

                    <option value="Full Time">
                      Full Time
                    </option>

                    <option value="Part Time">
                      Part Time
                    </option>

                    <option value="Contract">
                      Contract
                    </option>
                  </select>
                </div>
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description *
                </label>

                <textarea
                  required
                  rows={5}
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Describe the role and responsibilities..."
                  className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Skills */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Required skills
                </label>

                <input
                  type="text"
                  value={
                    form.requiredSkills
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "requiredSkills",
                      event.target
                        .value
                    )
                  }
                  placeholder="React, TypeScript, Node.js"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Deadline */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Application deadline
                  </label>

                  <input
                    type="date"
                    value={
                      form.deadline
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "deadline",
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Status */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "status",
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="DRAFT">
                      Draft
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="CLOSED">
                      Closed
                    </option>
                  </select>
                </div>
              </div>

              {/* Actions */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(
                      false
                    );

                    setForm(
                      initialForm
                    );

                    setFormError("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Vacancy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacanciesPage;