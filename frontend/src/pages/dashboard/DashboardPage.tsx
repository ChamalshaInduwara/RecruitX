import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  UserX,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import type {
  DashboardResponse,
  DashboardSummary,
  UpcomingInterview,
} from "../../types/dashboard";

const initialSummary: DashboardSummary = {
  activeVacancies: 0,
  totalApplications: 0,

  applicationsByStatus: {
    APPLIED: 0,
    SCREENING: 0,
    INTERVIEW_SCHEDULED: 0,
    INTERVIEW_COMPLETED: 0,
    SELECTED: 0,
    REJECTED: 0,
  },

  selectedCandidates: 0,
  rejectedCandidates: 0,
  upcomingInterviews: 0,
};

function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary>(
      initialSummary
    );

  const [
    upcomingInterviews,
    setUpcomingInterviews,
  ] = useState<UpcomingInterview[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<DashboardResponse>(
            "/dashboard/summary"
          );

        setSummary(
          response.data.summary
        );

        setUpcomingInterviews(
          response.data
            .upcomingInterviews
        );
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setError(
          "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Dashboard Cards
  |--------------------------------------------------------------------------
  */

  const cards = [
    {
      title: "Active Vacancies",
      value: summary.activeVacancies,
      icon: BriefcaseBusiness,
    },

    {
      title: "Total Applications",
      value: summary.totalApplications,
      icon: FileText,
    },

    {
      title: "Upcoming Interviews",
      value: summary.upcomingInterviews,
      icon: CalendarDays,
    },

    {
      title: "Selected Candidates",
      value: summary.selectedCandidates,
      icon: CheckCircle2,
    },

    {
      title: "Rejected Candidates",
      value: summary.rejectedCandidates,
      icon: UserX,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Application Pipeline
  |--------------------------------------------------------------------------
  */

  const pipeline = [
    {
      name: "Applied",
      value:
        summary.applicationsByStatus
          .APPLIED,
    },

    {
      name: "Screening",
      value:
        summary.applicationsByStatus
          .SCREENING,
    },

    {
      name: "Interview Scheduled",
      value:
        summary.applicationsByStatus
          .INTERVIEW_SCHEDULED,
    },

    {
      name: "Interview Completed",
      value:
        summary.applicationsByStatus
          .INTERVIEW_COMPLETED,
    },

    {
      name: "Selected",
      value:
        summary.applicationsByStatus
          .SELECTED,
    },

    {
      name: "Rejected",
      value:
        summary.applicationsByStatus
          .REJECTED,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Heading */}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your recruitment
          activity.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Application Pipeline */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Application Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current applications grouped
              by recruitment stage.
            </p>
          </div>

          <div className="space-y-5">
            {pipeline.map(
              (stage) => {
                const percentage =
                  summary.totalApplications >
                  0
                    ? Math.round(
                        (stage.value /
                          summary.totalApplications) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={
                      stage.name
                    }
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {
                          stage.name
                        }
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {
                          stage.value
                        }
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* Small Summary */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recruitment Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current recruitment results.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-600">
                Selected
              </span>

              <span className="font-semibold text-slate-900">
                {
                  summary
                    .selectedCandidates
                }
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-600">
                Rejected
              </span>

              <span className="font-semibold text-slate-900">
                {
                  summary
                    .rejectedCandidates
                }
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Interviews
              </span>

              <span className="font-semibold text-slate-900">
                {
                  summary
                    .upcomingInterviews
                }
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Upcoming Interviews */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Interviews
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Scheduled candidate interviews.
          </p>
        </div>

        {upcomingInterviews.length ===
        0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarDays
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No upcoming interviews
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Scheduled interviews will
              appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingInterviews.map(
              (interview) => {
                const date =
                  new Date(
                    interview.dateTime
                  );

                return (
                  <div
                    key={
                      interview.id
                    }
                    className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {
                          interview
                            .application
                            .candidate
                            .fullName
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          interview
                            .application
                            .vacancy
                            .title
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {date.toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Time
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {date.toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Type
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {
                            interview.type
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;