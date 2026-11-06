
import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Pencil,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import api from "../services/api";

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);

  const [deleting, setDeleting] = useState(false);

  // Fetch saved templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/templates");
      setTemplates(response.data.templates || []);
    } catch (err) {
      setError("Unable to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);


// Create or update template
const handleCreate = async (event) => {
  event.preventDefault();
  setError("");
  setSuccess("");

  try {
    setSaving(true);

    if (editingTemplateId) {
      // Update existing template
      await api.put(`/templates/${editingTemplateId}`, {
        name,
        subject,
        message,
      });

      setSuccess("Template updated successfully!");
    } else {
      // Create new template
      await api.post("/templates", {
        name,
        subject,
        message,
      });

      setSuccess("Template created successfully!");
    }

    // Reset form
    setName("");
    setSubject("");
    setMessage("");
    setEditingTemplateId(null);
    setShowForm(false);

    await fetchTemplates();
  } catch (err) {
    setError(
      err.response?.data?.message || "Unable to save template."
    );
  } finally {
    setSaving(false);
  }
};

  // Start editing an existing template
    const handleEdit = (template) => {
    setEditingTemplateId(template._id);
    setName(template.name);
    setSubject(template.subject);
    setMessage(template.message);

    setShowForm(true);
    setError("");
    setSuccess("");
    };


    // Open custom delete confirmation modal
    const handleDelete = (templateId) => {
        setDeleteTemplateId(templateId);
    };

    // Confirm deletion
    const confirmDelete = async () => {
    if (!deleteTemplateId || deleting) return;

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
        await api.delete(`/templates/${deleteTemplateId}`);

        setSuccess("Template deleted successfully!");
        setDeleteTemplateId(null);

        await fetchTemplates();
    } catch (err) {
        setError(
        err.response?.data?.message || "Unable to delete template."
        );
    } finally {
        setDeleting(false);
    }
    };


  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              MailPilot Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Email Templates
            </h1>

            <p className="mt-2 text-slate-500">
              Create and manage your reusable email messages.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Close Form" : "Create Template"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Create Template Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              {editingTemplateId ? "Edit Template" : "Create New Template"}
            </h2>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Template Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Job Application"
                required
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                required
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email message..."
                rows={7}
                required
                maxLength={20000}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {editingTemplateId ? "Update Template" : "Save Template"}
                </>
              )}
            </button>
          </form>
        )}

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Search size={19} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={30} className="animate-spin text-blue-600" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText size={42} className="mx-auto text-slate-400" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No templates found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create your first email template to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={23} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                        type="button"
                        title="Edit Template"
                        onClick={() => handleEdit(template)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                        <Pencil size={17} />
                        </button>

                    <button
                        type="button"
                        title="Delete Template"
                        onClick={() => handleDelete(template._id)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        >
                        <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Subject
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {template.subject}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Message Preview
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                    {template.message.length > 160
                      ? template.message.slice(0, 160) + "..."
                      : template.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          {templates.length} saved template(s)
        </p>


              {/* Custom Delete Confirmation Modal */}
      {deleteTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Delete Template?
                </h2>
                <p className="text-sm text-slate-500">
                  Confirmation required
                </p>
              </div>
            </div>

            <p className="mb-7 text-sm leading-6 text-slate-600">
              Are you sure you want to delete this template?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTemplateId(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Template"
                )}
              </button>
            </div>

          </div>
        </div>
      )}


      </div>
    </div>
  );
}

export default Templates;
