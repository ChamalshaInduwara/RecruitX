import axios from "axios";

import {
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { type FormEvent, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../../services/api";

import type {
  ApplicationDetails,
  ApplicationResponse,
  ApplicationStatus,
  CVAnalysis,
  CVAnalysisDetails,
} from "../../types/application";

import { analyzeApplicationCV } from "../../services/application.service";

/*
|--------------------------------------------------------------------------
| Status Helpers
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

const pipelineStatuses: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "SELECTED",
];

const formatStatus = (status: string) =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function ApplicationDetailsPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [application, setApplication] = useState<ApplicationDetails | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);

  const [cvAnalysisDetails, setCvAnalysisDetails] =
    useState<CVAnalysisDetails | null>(null);

  const [analyzingCV, setAnalyzingCV] = useState(false);

  const [cvAnalysisError, setCvAnalysisError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Status Modal
  |--------------------------------------------------------------------------
  */

  const [statusModal, setStatusModal] = useState<ApplicationStatus | null>(
    null,
  );

  const [statusNote, setStatusNote] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [statusError, setStatusError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Schedule Interview Modal
  |--------------------------------------------------------------------------
  */

  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const [interviewDateTime, setInterviewDateTime] = useState("");

  const [interviewType, setInterviewType] = useState("ONLINE");

  const [interviewLocation, setInterviewLocation] = useState("");

  const [interviewNotes, setInterviewNotes] = useState("");

  const [schedulingInterview, setSchedulingInterview] = useState(false);

  const [interviewError, setInterviewError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Complete Interview Modal
  |--------------------------------------------------------------------------
  */

  const [interviewToComplete, setInterviewToComplete] = useState<string | null>(
    null,
  );

  const [interviewFeedback, setInterviewFeedback] = useState("");

  const [completingInterview, setCompletingInterview] = useState(false);

  const [completionError, setCompletionError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Application
  |--------------------------------------------------------------------------
  */

  const loadApplication = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get<ApplicationResponse>(
        `/applications/${id}`,
      );

      setApplication(response.data.application);
    } catch (error) {
      console.error("Load application error:", error);

      setError("Unable to load application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleAnalyzeCV = async () => {
    if (!application?.id) {
      return;
    }

    try {
      setAnalyzingCV(true);
      setCvAnalysisError("");

      const response = await analyzeApplicationCV(application.id);

      setCvAnalysis(response.analysis);
      setCvAnalysisDetails(response.details);
    } catch (error) {
      console.error("CV analysis failed:", error);

      setCvAnalysisError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to analyze CV"
          : "Unable to analyze CV",
      );
    } finally {
      setAnalyzingCV(false);
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case "EXCELLENT_MATCH":
        return "Excellent Match";
      case "GOOD_MATCH":
        return "Good Match";
      case "MODERATE_MATCH":
        return "Moderate Match";
      case "LOW_MATCH":
        return "Low Match";
      default:
        return recommendation;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Status Update
  |--------------------------------------------------------------------------
  */

  const openStatusModal = (status: ApplicationStatus) => {
    setStatusModal(status);
    setStatusNote("");
    setStatusError("");
  };

  const handleStatusUpdate = async () => {
    if (!id || !statusModal) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");

      await api.patch(`/applications/${id}/status`, {
        status: statusModal,

        note: statusNote.trim() || undefined,
      });

      setStatusModal(null);
      setStatusNote("");

      await loadApplication();
    } catch (error) {
      console.error("Status update error:", error);

      if (axios.isAxiosError(error)) {
        setStatusError(
          error.response?.data?.message ||
            "Unable to update application status.",
        );
      } else {
        setStatusError("Unable to update application status.");
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Schedule Interview
  |--------------------------------------------------------------------------
  */

  const handleScheduleInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !interviewDateTime) {
      return;
    }

    try {
      setSchedulingInterview(true);

      setInterviewError("");

      const selectedDate = new Date(interviewDateTime);

      if (selectedDate <= new Date()) {
        setInterviewError("Interview date and time must be in the future.");

        return;
      }

      await api.post(`/applications/${id}/interviews`, {
        dateTime: selectedDate.toISOString(),

        type: interviewType,

        locationOrLink: interviewLocation.trim() || undefined,

        notes: interviewNotes.trim() || undefined,
      });

      setInterviewDateTime("");
      setInterviewType("ONLINE");
      setInterviewLocation("");
      setInterviewNotes("");

      setShowInterviewModal(false);

      await loadApplication();
    } catch (error) {
      console.error("Schedule interview error:", error);

      if (axios.isAxiosError(error)) {
        setInterviewError(
          error.response?.data?.message || "Unable to schedule interview.",
        );
      } else {
        setInterviewError("Unable to schedule interview.");
      }
    } finally {
      setSchedulingInterview(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Complete Interview
  |--------------------------------------------------------------------------
  */

  const handleCompleteInterview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!interviewToComplete || !interviewFeedback.trim()) {
      setCompletionError("Feedback is required.");

      return;
    }

    try {
      setCompletingInterview(true);

      setCompletionError("");

      await api.patch(`/interviews/${interviewToComplete}/complete`, {
        feedback: interviewFeedback.trim(),
      });

      setInterviewToComplete(null);

      setInterviewFeedback("");

      await loadApplication();
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
      setCompletingInterview(false);
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
        <p className="text-sm text-slate-500">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Applications
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Application not found."}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Current Pipeline Position
  |--------------------------------------------------------------------------
  */

  const pipelineIndex = pipelineStatuses.indexOf(application.status);

  const canScheduleInterview =
    application.status === "SCREENING" ||
    application.status === "INTERVIEW_COMPLETED";

  const displayedAnalysis = cvAnalysis ?? application.cvAnalysis ?? null;

  return (
    <div className="space-y-6">
      {/* Back */}

      <Link
        to="/applications"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Applications
      </Link>

      {/* Header */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {application.candidate.fullName}
              </h1>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                  statusStyles[application.status]
                }`}
              >
                {formatStatus(application.status)}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Application for{" "}
              <span className="font-medium text-slate-700">
                {application.vacancy.title}
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}

          <div className="flex flex-wrap gap-2">
            {application.status === "APPLIED" && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal("SCREENING")}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Move to Screening
                </button>

                <button
                  type="button"
                  onClick={() => openStatusModal("REJECTED")}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Reject
                </button>
              </>
            )}

            {canScheduleInterview && (
              <button
                type="button"
                onClick={() => {
                  setInterviewError("");
                  setShowInterviewModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <CalendarDays size={17} />

                {application.status === "INTERVIEW_COMPLETED"
                  ? "Schedule Another Interview"
                  : "Schedule Interview"}
              </button>
            )}

            {application.status === "SCREENING" && (
              <button
                type="button"
                onClick={() => openStatusModal("REJECTED")}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Reject
              </button>
            )}

            {application.status === "INTERVIEW_COMPLETED" && (
              <>
                <button
                  type="button"
                  onClick={() => openStatusModal("SELECTED")}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                >
                  <CheckCircle2 size={17} />
                  Select Candidate
                </button>

                <button
                  type="button"
                  onClick={() => openStatusModal("REJECTED")}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <XCircle size={17} />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pipeline */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Recruitment Pipeline
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current progress of this application.
        </p>

        {application.status === "REJECTED" ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Application Rejected
                </p>

                <p className="mt-1 text-sm text-red-600">
                  This application is no longer progressing through the
                  recruitment pipeline.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-7 grid gap-3 md:grid-cols-5">
            {pipelineStatuses.map((status, index) => {
              const completed = pipelineIndex >= index;

              const current = application.status === status;

              return (
                <div
                  key={status}
                  className={`rounded-xl border p-4 ${
                    current
                      ? "border-slate-900 bg-slate-900 text-white"
                      : completed
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      current
                        ? "bg-white text-slate-900"
                        : completed
                          ? "bg-green-700 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <p
                    className={`mt-3 text-sm font-medium ${
                      current
                        ? "text-white"
                        : completed
                          ? "text-green-800"
                          : "text-slate-500"
                    }`}
                  >
                    {formatStatus(status)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Candidate + Vacancy */}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserRound size={20} className="text-slate-500" />

            <h2 className="text-lg font-semibold text-slate-900">Candidate</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-400">Full Name</p>

              <Link
                to={`/candidates/${application.candidate.id}`}
                className="mt-1 block text-sm font-medium text-slate-900 hover:underline"
              >
                {application.candidate.fullName}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={15} />

              {application.candidate.email}
            </div>

            {application.candidate.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={15} />

                {application.candidate.phone}
              </div>
            )}

            {application.candidate.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={15} />

                {application.candidate.location}
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400">Skills</p>

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {application.candidate.skills || "No skills listed."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={20} className="text-slate-500" />

            <h2 className="text-lg font-semibold text-slate-900">Vacancy</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-400">Vacancy</p>

              <Link
                to={`/vacancies/${application.vacancy.id}`}
                className="mt-1 block text-sm font-medium text-slate-900 hover:underline"
              >
                {application.vacancy.title}
              </Link>
            </div>

            <div>
              <p className="text-xs text-slate-400">Department</p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {application.vacancy.department || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Applied On</p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(application.appliedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* AI CV Analysis */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                AI CV Analysis
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Job-relevant CV matching using skills, qualifications and local
              semantic analysis.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeCV}
            disabled={analyzingCV}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {analyzingCV ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : displayedAnalysis ? (
              <>
                <Sparkles className="h-4 w-4" />
                Re-analyze CV
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze CV
              </>
            )}
          </button>
        </div>

        {cvAnalysisError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {cvAnalysisError}
          </div>
        )}

        {displayedAnalysis ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Overall Match Score
                  </p>

                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-4xl font-bold text-slate-900">
                      {Math.round(displayedAnalysis.overallScore)}%
                    </span>

                    <span className="pb-1 text-sm text-slate-500">
                      decision-support score
                    </span>
                  </div>
                </div>

                <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                  {getRecommendationLabel(displayedAnalysis.recommendation)}
                </div>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${Math.min(Math.max(displayedAnalysis.overallScore, 0), 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Score Breakdown
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Skills", displayedAnalysis.skillsScore, 40],
                  ["Experience", displayedAnalysis.experienceScore, 25],
                  ["Education", displayedAnalysis.educationScore, 15],
                  ["Semantic", displayedAnalysis.semanticScore, 20],
                ].map(([label, score, maximum]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </p>

                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {score}/{maximum}
                    </p>

                    {label === "Semantic" && (
                      <p className="mt-1 text-xs text-slate-500">
                        {Math.round(displayedAnalysis.semanticScore * 5)}%
                        relevance
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {[
                {
                  title: "Matched Skills",
                  skills: displayedAnalysis.matchedSkills,
                  icon: CheckCircle2,
                  containerClass: "border-emerald-200 bg-emerald-50/50",
                  headingClass: "text-emerald-900",
                  iconClass: "text-emerald-600",
                  tagClass: "border-emerald-200 text-emerald-700",
                  empty: "No explicit matched skills identified.",
                },
                {
                  title: "Missing Skills",
                  skills: displayedAnalysis.missingSkills,
                  icon: XCircle,
                  containerClass: "border-amber-200 bg-amber-50/50",
                  headingClass: "text-amber-900",
                  iconClass: "text-amber-600",
                  tagClass: "border-amber-200 text-amber-700",
                  empty: "All explicitly listed skills were matched.",
                },
              ].map((skillGroup) => {
                const SkillIcon = skillGroup.icon;

                return (
                  <div
                    key={skillGroup.title}
                    className={`rounded-lg border p-4 ${skillGroup.containerClass}`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <SkillIcon
                        className={`h-4 w-4 ${skillGroup.iconClass}`}
                      />

                      <h3
                        className={`text-sm font-semibold ${skillGroup.headingClass}`}
                      >
                        {skillGroup.title}
                      </h3>
                    </div>

                    {skillGroup.skills && skillGroup.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillGroup.skills.map((skill) => (
                          <span
                            key={skill}
                            className={`rounded-full border bg-white px-3 py-1 text-xs font-medium ${skillGroup.tagClass}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        {skillGroup.empty}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {displayedAnalysis.strengths &&
              displayedAnalysis.strengths.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Analysis Highlights
                  </h3>

                  <div className="space-y-2">
                    {displayedAnalysis.strengths.map((strength, index) => (
                      <div
                        key={`${strength}-${index}`}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {displayedAnalysis.summary && (
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  Summary
                </h3>

                <p className="text-sm leading-6 text-slate-600">
                  {displayedAnalysis.summary}
                </p>
              </div>
            )}

            {cvAnalysisDetails && (
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <span>
                    Rule-based relevance:{" "}
                    <strong>{cvAnalysisDetails.ruleBasedPercentage}%</strong>
                  </span>

                  <span>
                    Semantic relevance:{" "}
                    <strong>{cvAnalysisDetails.semanticPercentage}%</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs leading-5 text-blue-700">
                AI-assisted analysis is provided for recruiter decision support.
                It evaluates job-related qualifications and should not be used
                as the sole basis for selecting or rejecting a candidate.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
            <Brain className="mx-auto h-9 w-9 text-slate-400" />

            <h3 className="mt-3 font-medium text-slate-900">
              No CV analysis yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Run an analysis to compare the candidate&apos;s job-related
              qualifications with this vacancy.
            </p>
          </div>
        )}
      </section>

      {/* Interviews */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Interviews</h2>

          <p className="mt-1 text-sm text-slate-500">
            Interview activity for this application.
          </p>
        </div>

        {application.interviews.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CalendarDays size={30} className="mx-auto text-slate-300" />

            <p className="mt-3 text-sm text-slate-500">
              No interviews scheduled yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {application.interviews.map((interview) => (
              <div key={interview.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {formatStatus(interview.type)}
                        {" Interview"}
                      </p>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {formatStatus(interview.status)}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Clock3 size={15} />

                      {new Date(interview.dateTime).toLocaleString()}
                    </p>

                    {interview.locationOrLink && (
                      <p className="mt-2 text-sm text-slate-500">
                        Location / Link: {interview.locationOrLink}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-500">
                      Interviewer: {interview.interviewer.name}
                    </p>

                    {interview.notes && (
                      <p className="mt-3 text-sm text-slate-600">
                        Notes: {interview.notes}
                      </p>
                    )}

                    {interview.feedback && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Feedback
                        </p>

                        <p className="mt-2 text-sm text-slate-700">
                          {interview.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {interview.status === "SCHEDULED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewFeedback("");

                        setCompletionError("");

                        setInterviewToComplete(interview.id);
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Complete Interview
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Status History */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Status History</h2>

        <p className="mt-1 text-sm text-slate-500">
          Activity timeline for this application.
        </p>

        <div className="mt-6">
          {application.statusHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No status history found.</p>
          ) : (
            <div className="space-y-0">
              {application.statusHistory.map((history, index) => (
                <div key={history.id} className="relative flex gap-4 pb-7">
                  {index !== application.statusHistory.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />
                  )}

                  <div className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-slate-800 ring-1 ring-slate-300" />

                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {history.oldStatus
                        ? `${formatStatus(history.oldStatus)} → ${formatStatus(
                            history.newStatus,
                          )}`
                        : formatStatus(history.newStatus)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(history.changedAt).toLocaleString()}
                      {" • "}
                      {history.user.name}
                    </p>

                    {history.note && (
                      <p className="mt-2 text-sm text-slate-600">
                        {history.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Status Update Modal */}

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Update Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Move application to {formatStatus(statusModal)}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {statusError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {statusError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Note
                </label>

                <textarea
                  rows={4}
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Optional note about this decision..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={handleStatusUpdate}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {updatingStatus ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}

      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Schedule Interview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create an interview for this application.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-5 p-6">
              {interviewError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {interviewError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date and time *
                </label>

                <input
                  type="datetime-local"
                  required
                  value={interviewDateTime}
                  onChange={(event) => setInterviewDateTime(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Interview type *
                </label>

                <select
                  value={interviewType}
                  onChange={(event) => setInterviewType(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="ONLINE">Online</option>

                  <option value="ONSITE">Onsite</option>

                  <option value="PHONE">Phone</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location / Meeting Link
                </label>

                <input
                  value={interviewLocation}
                  onChange={(event) => setInterviewLocation(event.target.value)}
                  placeholder="Office meeting room or online meeting link"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(event) => setInterviewNotes(event.target.value)}
                  placeholder="Optional instructions..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {schedulingInterview ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Interview Modal */}

      {interviewToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Complete Interview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add interview feedback.
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

            <form onSubmit={handleCompleteInterview} className="space-y-5 p-6">
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
                  value={interviewFeedback}
                  onChange={(event) => setInterviewFeedback(event.target.value)}
                  placeholder="Enter interview feedback..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setInterviewToComplete(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={completingInterview}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {completingInterview ? "Completing..." : "Complete Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationDetailsPage;
