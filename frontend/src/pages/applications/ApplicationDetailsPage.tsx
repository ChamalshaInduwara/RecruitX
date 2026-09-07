import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

function ApplicationDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link
        to="/applications"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />

        Back to Applications
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Application Details
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Application ID: {id}
        </p>

        <p className="mt-4 text-sm text-slate-500">
          Full application workflow will
          be added in the next step.
        </p>
      </div>
    </div>
  );
}

export default ApplicationDetailsPage;