import {
  Link,
  useParams,
} from "react-router-dom";

import { ArrowLeft } from "lucide-react";

function CandidateDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />

        Back to Candidates
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Candidate Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Candidate ID: {id}
        </p>

        <p className="mt-4 text-sm text-slate-500">
          Full candidate details will be
          added in the next step.
        </p>
      </div>
    </div>
  );
}

export default CandidateDetailsPage;