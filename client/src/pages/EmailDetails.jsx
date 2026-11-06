import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import api from "../services/api";

function EmailDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmailDetails = async () => {
      try {
        const response = await api.get(`/gmail/history/${id}`);
        setEmail(response.data.email);
      } catch (error) {
        console.error("Unable to fetch email details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailDetails();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/history")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back to History
        </button>

        <h1 className="text-2xl font-bold text-slate-900">Email Details</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={30} className="animate-spin text-blue-600" />
          </div>
        ) : !email ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
            <Mail size={36} className="mx-auto text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">Email not found</p>
            <p className="mt-1 text-sm text-slate-500">
              Unable to load this email's details.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6 border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-slate-900">
                {email.subject}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">From</p>
                <p className="font-medium text-slate-800">{email.from}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">To</p>
                <p className="font-medium text-slate-800">{email.to}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Sent At</p>
                <p className="font-medium text-slate-800">
                  {new Date(email.sentAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold text-green-600">{email.status}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="mb-3 font-semibold text-slate-900">
                Email Message
              </h3>

              <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {email.message}
              </div>
            </div>

            {email.attachment?.filename && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Attachment
                </h3>
                <p className="text-sm text-slate-600">
                  {email.attachment.filename}
                </p>
                <p className="text-xs text-slate-400">
                  {(email.attachment.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailDetails;
