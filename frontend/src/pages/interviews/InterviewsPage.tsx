import axios from "axios";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import type {
  Interview,
  InterviewsResponse,
  InterviewStatus,
} from "../../types/interview";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const statusStyles: Record<InterviewStatus, string> = {
  SCHEDULED: "bg-purple-50 text-purple-700 ring-purple-600/20",

  COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",

  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",

  RESCHEDULED: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const formatValue = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [upcomingOnly, setUpcomingOnly] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Complete Interview State
  |--------------------------------------------------------------------------
  */

  const [interviewToComplete, setInterviewToComplete] =
    useState<Interview | null>(null);

  const [completionFeedback, setCompletionFeedback] = useState("");

  const [completing, setCompleting] = useState(false);

  const [completionError, setCompletionError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Reschedule State
  |--------------------------------------------------------------------------
  */

  const [interviewToReschedule, setInterviewToReschedule] =
    useState<Interview | null>(null);

  const [rescheduleDateTime, setRescheduleDateTime] = useState("");

  const [rescheduleLocation, setRescheduleLocation] = useState("");

  const [rescheduleNotes, setRescheduleNotes] = useState("");

  const [rescheduling, setRescheduling] = useState(false);

  const [rescheduleError, setRescheduleError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Cancel State
  |--------------------------------------------------------------------------
  */

  const [interviewToCancel, setInterviewToCancel] = useState<Interview | null>(
    null,
  );

  const [cancelling, setCancelling] = useState(false);

  const [cancelError, setCancelError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Interviews
  |--------------------------------------------------------------------------
  */

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (upcomingOnly) {
        params.set("upcoming", "true");
      }

      const query = params.toString();

      const response = await api.get<InterviewsResponse>(
        `/interviews${query ? `?${query}` : ""}`,
      );

      setInterviews(response.data.interviews);
    } catch (error) {
      console.error("Load interviews error:", error);

      setError("Unable to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [statusFilter, upcomingOnly]);

  /*
  |--------------------------------------------------------------------------
  | Client Search
  |--------------------------------------------------------------------------
  */

  const filteredInterviews = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return interviews;
    }

    return interviews.filter((interview) => {
      const candidate = interview.application.candidate.fullName;

      const email = interview.application.candidate.email;

      const vacancy = interview.application.vacancy.title;

      return (
        candidate.toLowerCase().includes(value) ||
        email.toLowerCase().includes(value) ||
        vacancy.toLowerCase().includes(value)
      );
    });
  }, [interviews, search]);

  /*
  |--------------------------------------------------------------------------
  | Complete Interview
  |--------------------------------------------------------------------------
  */

  const handleComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!interviewToComplete || !completionFeedback.trim()) {
      setCompletionError("Interview feedback is required.");

      return;
    }

    try {
      setCompleting(true);
      setCompletionError("");

      await api.patch(`/interviews/${interviewToComplete.id}/complete`, {
        feedback: completionFeedback.trim(),
      });

      setInterviewToComplete(null);

      setCompletionFeedback("");

      await loadInterviews();
    } catch (error) {
      console.error("Complete interview error:", error);

      if (axios.isAxiosError(error)) {
        setCompletionError(
          error.response?.data?.message || "Unable to complete interview.",
        );
      } else {
        setCompletionError("Unable to complete interview.");
      }
    } finally {
      setCompleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Reschedule Modal
  |--------------------------------------------------------------------------
  */

  const openRescheduleModal = (interview: Interview) => {
    const currentDate = new Date(interview.dateTime);

    const localDate = new Date(
      currentDate.getTime() - currentDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    setInterviewToReschedule(interview);

    setRescheduleDateTime(localDate);

    setRescheduleLocation(interview.locationOrLink || "");

    setRescheduleNotes(interview.notes || "");

    setRescheduleError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Reschedule Interview
  |--------------------------------------------------------------------------
  */

  const handleReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!interviewToReschedule || !rescheduleDateTime) {
      return;
    }

    const newDate = new Date(rescheduleDateTime);

    if (newDate <= new Date()) {
      setRescheduleError("New interview date must be in the future.");

      return;
    }

    try {
      setRescheduling(true);
      setRescheduleError("");

      await api.patch(`/interviews/${interviewToReschedule.id}/reschedule`, {
        dateTime: newDate.toISOString(),

        locationOrLink: rescheduleLocation.trim() || undefined,

        notes: rescheduleNotes.trim() || undefined,
      });

      setInterviewToReschedule(null);

      setRescheduleDateTime("");
      setRescheduleLocation("");
      setRescheduleNotes("");

      await loadInterviews();
    } catch (error) {
      console.error("Reschedule interview error:", error);

      if (axios.isAxiosError(error)) {
        setRescheduleError(
          error.response?.data?.message || "Unable to reschedule interview.",
        );
      } else {
        setRescheduleError("Unable to reschedule interview.");
      }
    } finally {
      setRescheduling(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel Interview
  |--------------------------------------------------------------------------
  */

  const handleCancel = async () => {
    if (!interviewToCancel) {
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");

      await api.patch(`/interviews/${interviewToCancel.id}/cancel`);

      setInterviewToCancel(null);

      await loadInterviews();
    } catch (error) {
      console.error("Cancel interview error:", error);

      if (axios.isAxiosError(error)) {
        setCancelError(
          error.response?.data?.message || "Unable to cancel interview.",
        );
      } else {
        setCancelError("Unable to cancel interview.");
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Interviews</h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage scheduled, completed, cancelled and rescheduled interviews.
        </p>
      </div>

      {/* Filters */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
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

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All statuses</option>

            <option value="SCHEDULED">Scheduled</option>

            <option value="COMPLETED">Completed</option>

            <option value="CANCELLED">Cancelled</option>

            <option value="RESCHEDULED">Rescheduled</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(event) => setUpcomingOnly(event.target.checked)}
              className="h-4 w-4"
            />
            Upcoming only
          </label>
        </div>
      </section>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <p className="text-sm text-slate-500">Loading interviews...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <CalendarDays size={36} className="mx-auto text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-800">
            No interviews found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Scheduled interviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const interviewDate = new Date(interview.dateTime);

            return (
              <section
                key={interview.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  {/* Main Information */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {interview.application.candidate.fullName}
                      </h2>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusStyles[interview.status]
                        }`}
                      >
                        {formatValue(interview.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {interview.application.vacancy.title}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400">Date</p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <CalendarDays size={15} />

                          {interviewDate.toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Time</p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Clock3 size={15} />

                          {interviewDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Type</p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatValue(interview.type)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Interviewer</p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {interview.interviewer.name}
                        </p>
                      </div>
                    </div>

                    {interview.locationOrLink && (
                      <div className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <MapPin size={17} className="mt-0.5 shrink-0" />

                        <span className="break-all">
                          {interview.locationOrLink}
                        </span>
                      </div>
                    )}

                    {interview.notes && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Notes
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {interview.notes}
                        </p>
                      </div>
                    )}

                    {interview.feedback && (
                      <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          Interview Feedback
                        </p>

                        <p className="mt-2 text-sm leading-6 text-green-800">
                          {interview.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}

                  <div className="flex flex-wrap gap-2 xl:w-48 xl:flex-col">
                    <Link
                      to={`/applications/${interview.application.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      Application
                    </Link>

                    <Link
                      to={`/candidates/${interview.application.candidate.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserRound size={16} />
                      Candidate
                    </Link>

                    {interview.status === "SCHEDULED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCompletionFeedback("");

                            setCompletionError("");

                            setInterviewToComplete(interview);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          <CheckCircle2 size={16} />
                          Complete
                        </button>

                        <button
                          type="button"
                          onClick={() => openRescheduleModal(interview)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                        >
                          <RefreshCw size={16} />
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCancelError("");

                            setInterviewToCancel(interview);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <XCircle size={16} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Complete Modal */}

      {interviewToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Complete Interview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {interviewToComplete.application.candidate.fullName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInterviewToComplete(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleComplete} className="space-y-5 p-6">
              {completionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {completionError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Feedback *
                </label>

                <textarea
                  required
                  rows={5}
                  value={completionFeedback}
                  onChange={(event) =>
                    setCompletionFeedback(event.target.value)
                  }
                  placeholder="Enter interview feedback..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setInterviewToComplete(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={completing}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {completing ? "Completing..." : "Complete Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}

      {interviewToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Reschedule Interview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a new date and time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInterviewToReschedule(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-5 p-6">
              {rescheduleError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {rescheduleError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  New date and time *
                </label>

                <input
                  type="datetime-local"
                  required
                  value={rescheduleDateTime}
                  onChange={(event) =>
                    setRescheduleDateTime(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location / Link
                </label>

                <input
                  value={rescheduleLocation}
                  onChange={(event) =>
                    setRescheduleLocation(event.target.value)
                  }
                  placeholder="Meeting room or online link"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={rescheduleNotes}
                  onChange={(event) => setRescheduleNotes(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setInterviewToReschedule(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={rescheduling}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {rescheduling ? "Rescheduling..." : "Save New Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}

      {interviewToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircle size={22} />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Cancel Interview?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This will cancel the scheduled interview for{" "}
                <span className="font-medium text-slate-700">
                  {interviewToCancel.application.candidate.fullName}
                </span>
                .
              </p>

              {cancelError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {cancelError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInterviewToCancel(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Keep Interview
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancel}
                  className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                >
                  {cancelling ? "Cancelling..." : "Cancel Interview"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewsPage;
