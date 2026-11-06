
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { UserRound, Mail, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await API.put("/auth/profile", {
        name: name.trim(),
      });

      updateUser(response.data.user);
      navigate("/settings", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => navigate("/settings")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            My Profile
          </h1>
          <p className="mt-2 text-slate-500">
            Manage your personal account information.
          </p>
        </div>

        <form
          onSubmit={handleUpdateProfile}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-4">
              <UserRound className="h-8 w-8 text-blue-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {user?.name}
              </h2>
              <p className="text-sm text-slate-500">
                MailPilot User
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Mail className="h-5 w-5 text-slate-400" />

              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full bg-transparent text-slate-600 outline-none"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Your registered email address cannot be changed here.
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          {success && (
            <p className="mb-4 text-sm text-green-600">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Profile;
