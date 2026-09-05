import axios from "axios";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import type {
  UpdateVacancyResponse,
  Vacancy,
  VacancyResponse,
  VacancyStatus,
} from "../../types/vacancy";

interface EditForm {
  title: string;
  department: string;
  description: string;
  requiredSkills: string;
  employmentType: string;
  deadline: string;
  status: VacancyStatus;
}

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

function VacancyDetailsPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [vacancy, setVacancy] =
    useState<Vacancy | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] =
    useState<EditForm>({
      title: "",
      department: "",
      description: "",
      requiredSkills: "",
      employmentType: "",
      deadline: "",
      status: "DRAFT",
    });

  /*
  |--------------------------------------------------------------------------
  | Load Vacancy
  |--------------------------------------------------------------------------
  */

  const loadVacancy = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<VacancyResponse>(
          `/vacancies/${id}`
        );

      setVacancy(
        response.data.vacancy
      );
    } catch (error) {
      console.error(
        "Load vacancy error:",
        error
      );

      setError(
        "Unable to load vacancy details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancy();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Open Edit Modal
  |--------------------------------------------------------------------------
  */

  const openEditModal = () => {
    if (!vacancy) {
      return;
    }

    setForm({
      title: vacancy.title,
      department:
        vacancy.department || "",
      description:
        vacancy.description,
      requiredSkills:
        vacancy.requiredSkills || "",
      employmentType:
        vacancy.employmentType || "",
      deadline: vacancy.deadline
        ? vacancy.deadline.split(
            "T"
          )[0]
        : "",
      status: vacancy.status,
    });

    setFormError("");
    setShowEditModal(true);
  };

  const updateForm = (
    field: keyof EditForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Save Edit
  |--------------------------------------------------------------------------
  */

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await api.put<UpdateVacancyResponse>(
        `/vacancies/${id}`,
        {
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
            null,

          status: form.status,
        }
      );

      setShowEditModal(false);

      await loadVacancy();
    } catch (error) {
      console.error(
        "Update vacancy error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setFormError(
          error.response?.data
            ?.message ||
            "Unable to update vacancy."
        );
      } else {
        setFormError(
          "Unable to update vacancy."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Close / Reopen
  |--------------------------------------------------------------------------
  */

  const changeStatus = async (
    status: VacancyStatus
  ) => {
    if (!id) {
      return;
    }

    try {
      await api.put(
        `/vacancies/${id}`,
        {
          status,
        }
      );

      await loadVacancy();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setError(
        "Unable to update vacancy status."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading / Error
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading vacancy...
        </p>
      </div>
    );
  }

  if (
    error ||
    !vacancy
  ) {
    return (
      <div className="space-y-4">
        <Link
          to="/vacancies"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Vacancies
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ||
            "Vacancy not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}

      <Link
        to="/vacancies"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Vacancies
      </Link>

      {/* Header */}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {vacancy.title}
            </h1>

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

          <p className="mt-2 text-sm text-slate-500">
            {vacancy.department ||
              "No department specified"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={17} />
            Edit
          </button>

          {vacancy.status ===
          "CLOSED" ? (
            <button
              type="button"
              onClick={() =>
                changeStatus(
                  "ACTIVE"
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
            >
              <RefreshCw size={17} />
              Reopen
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                changeStatus(
                  "CLOSED"
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <XCircle size={17} />
              Close Vacancy
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <BriefcaseBusiness
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Employment Type
          </p>

          <p className="mt-1 font-medium text-slate-800">
            {vacancy.employmentType ||
              "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Applications
          </p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {vacancy._count
              ?.applications ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Deadline
          </p>

          <p className="mt-1 font-medium text-slate-800">
            {vacancy.deadline
              ? new Date(
                  vacancy.deadline
                ).toLocaleDateString()
              : "No deadline"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckCircle2
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Created By
          </p>

          <p className="mt-1 font-medium text-slate-800">
            {vacancy.creator
              ?.name || "Unknown"}
          </p>
        </div>
      </div>

      {/* Details */}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Vacancy Details
          </h2>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {vacancy.description}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Required Skills
            </p>

            <p className="mt-2 text-sm text-slate-700">
              {vacancy.requiredSkills ||
                "No specific skills listed."}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Information
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-400">
                Department
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {vacancy.department ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Created
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(
                  vacancy.createdAt
                ).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Last Updated
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(
                  vacancy.updatedAt
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Applications */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Candidates linked to this
            vacancy.
          </p>
        </div>

        {!vacancy.applications ||
        vacancy.applications.length ===
          0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No applications for this
            vacancy yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vacancy.applications.map(
              (application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {
                        application
                          .candidate
                          .fullName
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        application
                          .candidate
                          .email
                      }
                    </p>
                  </div>

                  <span className="text-sm font-medium text-slate-600">
                    {
                      application.status
                    }
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Edit Modal */}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Vacancy
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update vacancy
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Vacancy title *
                </label>

                <input
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
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Department
                  </label>

                  <input
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
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
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
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Required skills
                </label>

                <input
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
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Deadline
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
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
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

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacancyDetailsPage;