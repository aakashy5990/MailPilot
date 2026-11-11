import { useEffect, useState } from "react";
import {
  Mail,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from "lucide-react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function EmailHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalEmails, setTotalEmails] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/gmail/history?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}`
      );

      // console.log("response:", response.data.sentTotal);

      setHistory(response.data.history || []);
      setTotalEmails(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setSentTotal(response.data.sentTotal);
    } catch (error) {
      console.error("Unable to fetch email history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchHistory();
}, [currentPage, search]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const filteredHistory = history.filter(
    (email) =>
      email.to.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MailPilot Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Email History
          </h1>

          <p className="mt-2 text-slate-500">
            View and track your previously sent emails.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Mail size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Total Emails</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {totalEmails}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Successfully Sent</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {sentTotal}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Search size={19} className="text-slate-400" />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by recipient or subject..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={30} className="animate-spin text-blue-600" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Mail size={42} className="mx-auto text-slate-400" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No emails found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your sent email history will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {filteredHistory.map((email) => (
                <div
                  key={email._id}
                  onClick={() => navigate(`/history/${email._id}`)}
                  className="flex cursor-pointer flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {email.subject}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      To: {email.to}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={13} />
                      {new Date(email.sentAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    {email.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={14} />
                        Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                        <XCircle size={14} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailHistory;
