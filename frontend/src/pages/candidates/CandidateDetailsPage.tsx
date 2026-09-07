import axios from "axios";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Upload,
  UserRound,
  X,
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
  Candidate,
  CandidateDocument,
  CandidateDocumentsResponse,
  CandidateResponse,
  UpdateCandidateResponse,
  UploadDocumentResponse,
} from "../../types/candidate";

/*
|--------------------------------------------------------------------------
| Edit Form
|--------------------------------------------------------------------------
*/

interface EditCandidateForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  experience: string;
  skills: string;
}

const applicationStatusStyles:
  Record<string, string> = {
  APPLIED:
    "bg-blue-50 text-blue-700",

  SCREENING:
    "bg-amber-50 text-amber-700",

  INTERVIEW_SCHEDULED:
    "bg-purple-50 text-purple-700",

  INTERVIEW_COMPLETED:
    "bg-indigo-50 text-indigo-700",

  SELECTED:
    "bg-green-50 text-green-700",

  REJECTED:
    "bg-red-50 text-red-700",
};

function CandidateDetailsPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [documents, setDocuments] =
    useState<CandidateDocument[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Edit State
  |--------------------------------------------------------------------------
  */

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [form, setForm] =
    useState<EditCandidateForm>({
      fullName: "",
      email: "",
      phone: "",
      location: "",
      education: "",
      experience: "",
      skills: "",
    });

  /*
  |--------------------------------------------------------------------------
  | Upload State
  |--------------------------------------------------------------------------
  */

  const [
    showUploadModal,
    setShowUploadModal,
  ] = useState(false);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  const [
    documentType,
    setDocumentType,
  ] = useState("CV");

  const [
    applicationId,
    setApplicationId,
  ] = useState("");

  const [uploading, setUploading] =
    useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Candidate
  |--------------------------------------------------------------------------
  */

  const loadCandidate = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        candidateResponse,
        documentResponse,
      ] = await Promise.all([
        api.get<CandidateResponse>(
          `/candidates/${id}`
        ),

        api.get<CandidateDocumentsResponse>(
          `/candidates/${id}/documents`
        ),
      ]);

      setCandidate(
        candidateResponse.data
          .candidate
      );

      setDocuments(
        documentResponse.data
          .documents
      );
    } catch (error) {
      console.error(
        "Load candidate error:",
        error
      );

      setError(
        "Unable to load candidate profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidate();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Edit Candidate
  |--------------------------------------------------------------------------
  */

  const openEditModal = () => {
    if (!candidate) {
      return;
    }

    setForm({
      fullName:
        candidate.fullName,

      email:
        candidate.email,

      phone:
        candidate.phone || "",

      location:
        candidate.location || "",

      education:
        candidate.education || "",

      experience:
        candidate.experience || "",

      skills:
        candidate.skills || "",
    });

    setFormError("");

    setShowEditModal(true);
  };

  const updateForm = (
    field:
      keyof EditCandidateForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdate = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await api.put<UpdateCandidateResponse>(
        `/candidates/${id}`,
        {
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
        }
      );

      setShowEditModal(false);

      await loadCandidate();
    } catch (error) {
      console.error(
        "Update candidate error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setFormError(
          error.response?.data
            ?.message ||
            "Unable to update candidate."
        );
      } else {
        setFormError(
          "Unable to update candidate."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Upload Document
  |--------------------------------------------------------------------------
  */

  const handleUpload = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !id ||
      !selectedFile
    ) {
      setUploadError(
        "Please select a file."
      );

      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      selectedFile.size >
      maxSize
    ) {
      setUploadError(
        "File must be 5 MB or smaller."
      );

      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setUploadError(
        "Only PDF, DOC and DOCX files are allowed."
      );

      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData =
        new FormData();

      formData.append(
        "document",
        selectedFile
      );

      formData.append(
        "type",
        documentType
      );

      if (applicationId) {
        formData.append(
          "applicationId",
          applicationId
        );
      }

      await api.post<UploadDocumentResponse>(
        `/candidates/${id}/documents`,
        formData
      );

      setSelectedFile(null);
      setDocumentType("CV");
      setApplicationId("");

      setShowUploadModal(false);

      await loadCandidate();
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        setUploadError(
          error.response?.data
            ?.message ||
            "Unable to upload document."
        );
      } else {
        setUploadError(
          "Unable to upload document."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Protected Document
  |--------------------------------------------------------------------------
  */

  const openDocument = async (
    document: CandidateDocument
  ) => {
    try {
      const response =
        await api.get<Blob>(
          `/documents/${document.id}/download`,
          {
            responseType:
              "blob",
          }
        );

      const blobUrl =
        URL.createObjectURL(
          response.data
        );

      window.open(
        blobUrl,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            blobUrl
          );
        },
        60000
      );
    } catch (error) {
      console.error(
        "Open document error:",
        error
      );

      setError(
        "Unable to open document."
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
          Loading candidate...
        </p>
      </div>
    );
  }

  if (
    error ||
    !candidate
  ) {
    return (
      <div className="space-y-4">
        <Link
          to="/candidates"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft
            size={17}
          />

          Back to Candidates
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ||
            "Candidate not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}

      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />

        Back to Candidates
      </Link>

      {/* Profile Header */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
              {candidate.fullName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {
                  candidate.fullName
                }
              </h1>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={15} />

                  {candidate.email}
                </span>

                {candidate.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone
                      size={15}
                    />

                    {
                      candidate.phone
                    }
                  </span>
                )}

                {candidate.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      size={15}
                    />

                    {
                      candidate.location
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openEditModal
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={17} />

            Edit Candidate
          </button>
        </div>
      </section>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <BriefcaseBusiness
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Applications
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {candidate.applications
              ?.length ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <FileText
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Documents
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {documents.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays
            size={20}
            className="text-slate-500"
          />

          <p className="mt-3 text-xs text-slate-400">
            Candidate Since
          </p>

          <p className="mt-1 font-medium text-slate-800">
            {new Date(
              candidate.createdAt
            ).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Profile Information */}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Candidate Information
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Education
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {candidate.education ||
                  "No education information provided."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Experience
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {candidate.experience ||
                  "No experience information provided."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Skills
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {candidate.skills ||
                  "No skills listed."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Details
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-medium text-slate-700">
                {candidate.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Phone
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {candidate.phone ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Location
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {candidate.location ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Last Updated
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {new Date(
                  candidate.updatedAt
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
            Vacancies this candidate
            has applied for.
          </p>
        </div>

        {!candidate.applications ||
        candidate.applications
          .length === 0 ? (
          <div className="px-6 py-10 text-center">
            <UserRound
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No applications linked
              to this candidate.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {candidate.applications.map(
              (application) => (
                <div
                  key={
                    application.id
                  }
                  className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {
                        application
                          .vacancy.title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {application
                        .vacancy
                        .department ||
                        "No department"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        applicationStatusStyles[
                          application
                            .status
                        ] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {application.status.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <span className="text-xs text-slate-400">
                      Applied{" "}
                      {new Date(
                        application.appliedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Documents */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              CVs and supporting
              candidate documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedFile(
                null
              );

              setUploadError("");

              setShowUploadModal(
                true
              );
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Upload size={17} />

            Upload Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <FileText
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No documents uploaded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map(
              (document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                      <FileText
                        size={20}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {
                          document.fileName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {document.type.replaceAll(
                          "_",
                          " "
                        )}
                        {" • "}
                        {new Date(
                          document.uploadedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openDocument(
                        document
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={16} />

                    Open
                  </button>
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
                  Edit Candidate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update candidate
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full name *
                  </label>

                  <input
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
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
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
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "email",
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
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
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Location
                  </label>

                  <input
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
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Education
                </label>

                <textarea
                  rows={3}
                  value={
                    form.education
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "education",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Experience
                </label>

                <textarea
                  rows={3}
                  value={
                    form.experience
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "experience",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Skills
                </label>

                <input
                  value={form.skills}
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "skills",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
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

      {/* Upload Modal */}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Upload Document
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  PDF, DOC or DOCX.
                  Maximum 5 MB.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowUploadModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="space-y-5 p-6"
            >
              {uploadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document type *
                </label>

                <select
                  value={
                    documentType
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentType(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="CV">
                    CV
                  </option>

                  <option value="COVER_LETTER">
                    Cover Letter
                  </option>

                  <option value="CERTIFICATE">
                    Certificate
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Related application
                </label>

                <select
                  value={
                    applicationId
                  }
                  onChange={(
                    event
                  ) =>
                    setApplicationId(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="">
                    General candidate
                    document
                  </option>

                  {candidate.applications?.map(
                    (
                      application
                    ) => (
                      <option
                        key={
                          application.id
                        }
                        value={
                          application.id
                        }
                      >
                        {
                          application
                            .vacancy
                            .title
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  File *
                </label>

                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(
                    event
                  ) =>
                    setSelectedFile(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-600"
                />

                {selectedFile && (
                  <p className="mt-2 text-xs text-slate-500">
                    Selected:{" "}
                    {
                      selectedFile.name
                    }
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowUploadModal(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Upload
                    size={17}
                  />

                  {uploading
                    ? "Uploading..."
                    : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDetailsPage;