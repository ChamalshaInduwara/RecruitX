import axios from "axios";

import {
  Eye,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import type {
  Candidate,
  CandidatesResponse,
  CreateCandidateResponse,
} from "../../types/candidate";

interface CandidateForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  experience: string;
  skills: string;
}

const initialForm: CandidateForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  education: "",
  experience: "",
  skills: "",
};

function CandidatesPage() {
  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [form, setForm] =
    useState<CandidateForm>(
      initialForm
    );

  const [creating, setCreating] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Candidates
  |--------------------------------------------------------------------------
  */

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      const query =
        params.toString();

      const response =
        await api.get<CandidatesResponse>(
          `/candidates${
            query
              ? `?${query}`
              : ""
          }`
        );

      setCandidates(
        response.data.candidates
      );
    } catch (error) {
      console.error(
        "Load candidates error:",
        error
      );

      setError(
        "Unable to load candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Debounced Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          loadCandidates();
        },
        300
      );

    return () =>
      window.clearTimeout(
        timeout
      );
  }, [search]);

  /*
  |--------------------------------------------------------------------------
  | Form Update
  |--------------------------------------------------------------------------
  */

  const updateForm = (
    field: keyof CandidateForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Create Candidate
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
        fullName:
          form.fullName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim() ||
          undefined,

        location:
          form.location.trim() ||
          undefined,

        education:
          form.education.trim() ||
          undefined,

        experience:
          form.experience.trim() ||
          undefined,

        skills:
          form.skills.trim() ||
          undefined,
      };

      await api.post<CreateCandidateResponse>(
        "/candidates",
        payload
      );

      setForm(initialForm);

      setShowCreateModal(false);

      await loadCandidates();
    } catch (error) {
      console.error(
        "Create candidate error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setFormError(
          error.response?.data
            ?.message ||
            "Unable to create candidate."
        );
      } else {
        setFormError(
          "Unable to create candidate."
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
            Candidates
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage candidate profiles,
            skills and applications.
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

          Add Candidate
        </button>
      </div>

      {/* Search */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
            placeholder="Search by name, email or skill..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Candidate Content */}

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">
            Loading candidates...
          </p>
        </div>
      ) : candidates.length ===
        0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <UserRound
            size={36}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 font-semibold text-slate-800">
            No candidates found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Add a candidate or change
            your search.
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
                      Candidate
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applications
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Documents
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {candidates.map(
                    (candidate) => (
                      <tr
                        key={
                          candidate.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                              {candidate.fullName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {
                                  candidate.fullName
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  candidate.email
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {candidate.phone ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {candidate.location ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {candidate
                            ._count
                            ?.applications ??
                            0}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {candidate
                            ._count
                            ?.documents ??
                            0}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={16} />

                            View
                          </Link>
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
            {candidates.map(
              (candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                      {candidate.fullName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {
                          candidate.fullName
                        }
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {candidate.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">
                        Location
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {candidate.location ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Applications
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {candidate
                          ._count
                          ?.applications ??
                          0}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/candidates/${candidate.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={16} />

                    View Profile
                  </Link>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Add Candidate Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Add Candidate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a candidate
                  profile in RecruitX.
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
                aria-label="Close"
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

              {/* Name + Email */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full name *
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      form.fullName
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "fullName",
                        event.target
                          .value
                      )
                    }
                    placeholder="Kasun Perera"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email *
                  </label>

                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "email",
                        event.target
                          .value
                      )
                    }
                    placeholder="candidate@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Phone + Location */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={form.phone}
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "phone",
                        event.target
                          .value
                      )
                    }
                    placeholder="0771234567"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Location
                  </label>

                  <input
                    type="text"
                    value={
                      form.location
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "location",
                        event.target
                          .value
                      )
                    }
                    placeholder="Colombo"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Education */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Education
                </label>

                <textarea
                  rows={3}
                  value={form.education}
                  onChange={(event) =>
                    updateForm(
                      "education",
                      event.target.value
                    )
                  }
                  placeholder="BSc Software Engineering Undergraduate"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Experience */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Experience
                </label>

                <textarea
                  rows={3}
                  value={
                    form.experience
                  }
                  onChange={(event) =>
                    updateForm(
                      "experience",
                      event.target.value
                    )
                  }
                  placeholder="Previous projects, internships or relevant experience..."
                  className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Skills */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skills
                </label>

                <input
                  type="text"
                  value={form.skills}
                  onChange={(event) =>
                    updateForm(
                      "skills",
                      event.target.value
                    )
                  }
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Buttons */}

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
                    : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidatesPage;