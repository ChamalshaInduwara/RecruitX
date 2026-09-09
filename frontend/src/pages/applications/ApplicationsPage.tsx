import axios from "axios";

import {
  BriefcaseBusiness,
  Eye,
  FileText,
  Plus,
  Search,
  X,
} from "lucide-react";

import { type FormEvent, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import type {
  ApplicationListItem,
  ApplicationsResponse,
  ApplicationStatus,
} from "../../types/application";

import type { Candidate, CandidatesResponse } from "../../types/candidate";

import type { Vacancy, VacanciesResponse } from "../../types/vacancy";

/*
|--------------------------------------------------------------------------
| Status Styles
|--------------------------------------------------------------------------
*/

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700 ring-blue-600/20",

  SCREENING: "bg-amber-50 text-amber-700 ring-amber-600/20",

  INTERVIEW_SCHEDULED: "bg-purple-50 text-purple-700 ring-purple-600/20",

  INTERVIEW_COMPLETED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",

  SELECTED: "bg-green-50 text-green-700 ring-green-600/20",

  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
};

const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case "EXCELLENT_MATCH":
      return "Excellent";

    case "GOOD_MATCH":
      return "Good";

    case "MODERATE_MATCH":
      return "Moderate";

    case "LOW_MATCH":
      return "Low";

    default:
      return recommendation;
  }
};

function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [vacancyFilter, setVacancyFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Create Application State
  |--------------------------------------------------------------------------
  */

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [candidateId, setCandidateId] = useState("");

  const [vacancyId, setVacancyId] = useState("");

  const [creating, setCreating] = useState(false);

  const [formError, setFormError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Applications
  |--------------------------------------------------------------------------
  */

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (vacancyFilter) {
        params.set("vacancyId", vacancyFilter);
      }

      const query = params.toString();

      const response = await api.get<ApplicationsResponse>(
        `/applications${query ? `?${query}` : ""}`,
      );

      setApplications(response.data.applications);
    } catch (error) {
      console.error("Load applications error:", error);

      setError("Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Candidates + Vacancies
  |--------------------------------------------------------------------------
  */

  const loadFormOptions = async () => {
    try {
      const [candidateResponse, vacancyResponse] = await Promise.all([
        api.get<CandidatesResponse>("/candidates"),

        api.get<VacanciesResponse>("/vacancies?status=ACTIVE"),
      ]);

      setCandidates(candidateResponse.data.candidates);

      setVacancies(vacancyResponse.data.vacancies);
    } catch (error) {
      console.error("Load form options error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Form Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadFormOptions();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search / Filter
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadApplications();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, statusFilter, vacancyFilter]);

  /*
  |--------------------------------------------------------------------------
  | Create Application
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!candidateId || !vacancyId) {
      setFormError("Candidate and vacancy are required.");

      return;
    }

    try {
      setCreating(true);
      setFormError("");

      await api.post("/applications", {
        candidateId,
        vacancyId,
      });

      setCandidateId("");
      setVacancyId("");

      setShowCreateModal(false);

      await loadApplications();
    } catch (error) {
      console.error("Create application error:", error);

      if (axios.isAxiosError(error)) {
        setFormError(
          error.response?.data?.message || "Unable to create application.",
        );
      } else {
        setFormError("Unable to create application.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Applications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track candidate applications through the recruitment pipeline.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCandidateId("");
            setVacancyId("");
            setFormError("");

            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          Create Application
        </button>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_260px]">
          {/* Search */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate or vacancy..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Status Filter */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All statuses</option>

            <option value="APPLIED">Applied</option>

            <option value="SCREENING">Screening</option>

            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>

            <option value="INTERVIEW_COMPLETED">Interview Completed</option>

            <option value="SELECTED">Selected</option>

            <option value="REJECTED">Rejected</option>
          </select>

          {/* Vacancy Filter */}

          <select
            value={vacancyFilter}
            onChange={(event) => setVacancyFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All vacancies</option>

            {vacancies.map((vacancy) => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.title}
              </option>
            ))}
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
          <p className="text-sm text-slate-500">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <FileText size={36} className="mx-auto text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-800">
            No applications found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create an application or adjust your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs leading-5 text-blue-700">
              AI Match is a job-relevance indicator based on stated
              qualifications and semantic similarity. It is provided for
              recruiter decision support and should not be used as the sole
              basis for a hiring decision.
            </p>
          </div>

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
                      Vacancy
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      AI Match
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applied
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Interviews
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Candidate */}

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {application.candidate.fullName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {application.candidate.email}
                        </p>
                      </td>

                      {/* Vacancy */}

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {application.vacancy.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {application.vacancy.department || "No department"}
                        </p>
                      </td>

                      {/* AI Match */}

                      <td className="px-6 py-4">
                        {application.cvAnalysis ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {Math.round(
                                  application.cvAnalysis.overallScore,
                                )}
                                %
                              </span>

                              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                {getRecommendationLabel(
                                  application.cvAnalysis.recommendation,
                                )}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              AI-assisted relevance
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not analyzed
                          </span>
                        )}
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[application.status]
                          }`}
                        >
                          {application.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      {/* Date */}

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </td>

                      {/* Interviews */}

                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {application._count?.interviews ?? 0}
                      </td>

                      {/* View */}

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/applications/${application.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}

          <div className="space-y-3 md:hidden">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {application.candidate.fullName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {application.vacancy.title}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[application.status]
                    }`}
                  >
                    {application.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-400">Applied</p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Interviews</p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {application._count?.interviews ?? 0}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">AI Match</span>

                    {application.cvAnalysis ? (
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">
                          {Math.round(application.cvAnalysis.overallScore)}%
                        </span>

                        <p className="text-xs text-indigo-600">
                          {getRecommendationLabel(
                            application.cvAnalysis.recommendation,
                          )}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Not analyzed
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/applications/${application.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={16} />
                  View Application
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Application Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Create Application
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Link a candidate to an active vacancy.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Candidate */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Candidate *
                </label>

                <select
                  required
                  value={candidateId}
                  onChange={(event) => setCandidateId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select candidate</option>

                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.fullName} — {candidate.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vacancy */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Active Vacancy *
                </label>

                <select
                  required
                  value={vacancyId}
                  onChange={(event) => setVacancyId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Select vacancy</option>

                  {vacancies.map((vacancy) => (
                    <option key={vacancy.id} value={vacancy.id}>
                      {vacancy.title}
                      {vacancy.department ? ` — ${vacancy.department}` : ""}
                    </option>
                  ))}
                </select>

                {vacancies.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    There are currently no active vacancies.
                  </p>
                )}
              </div>

              {/* Explanation */}

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex gap-3">
                  <BriefcaseBusiness
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />

                  <p className="text-sm leading-6 text-slate-600">
                    New applications begin at the{" "}
                    <strong className="font-semibold text-slate-800">
                      APPLIED
                    </strong>{" "}
                    stage automatically.
                  </p>
                </div>
              </div>

              {/* Actions */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationsPage;
