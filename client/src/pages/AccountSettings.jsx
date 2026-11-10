import {
  UserRound,
  Mail,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useEffect, useState } from "react";

const settingsItems = [
  {
    title: "Profile",
    description: "Manage your personal information",
    icon: UserRound,
  },
  {
    title: "Security",
    description: "Manage your password and account security",
    icon: ShieldCheck,
  },
  {
    title: "Preferences",
    description: "Manage your application preferences",
    icon: Bell,
  },
];

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [gmailAccounts, setGmailAccounts] = useState([]);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [gmailError, setGmailError] = useState("");
  const [disconnectingId, setDisconnectingId] = useState(null);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification]);

  const fetchGmailAccounts = async () => {
    try {
      setGmailLoading(true);
      setGmailError("");

      const response = await API.get("/gmail/accounts");

      setGmailAccounts(response.data.accounts);
    } catch (error) {
      console.error("Fetch Gmail accounts error:", error);

      setGmailError("Unable to load connected Gmail accounts.");
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    const accountId = disconnectTarget._id;

    try {
      setDisconnectingId(accountId);
      setNotification(null);

      await API.delete(`/gmail/${accountId}`);

      setGmailAccounts((previousAccounts) =>
        previousAccounts.filter((account) => account._id !== accountId),
      );

      setDisconnectTarget(null);

      setNotification({
        type: "success",
        message: "Gmail account disconnected successfully!",
      });
    } catch (error) {
      console.error("Disconnect Gmail error:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to disconnect Gmail account.",
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordData.newPassword.length < 8) {
      setNotification({
        type: "error",
        message: "New password must be at least 8 characters.",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({
        type: "error",
        message: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await API.put("/auth/change-password", passwordData);

      setNotification({
        type: "success",
        message: response.data.message,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to change password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    fetchGmailAccounts();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            MAILPILOT WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Account Settings
          </h1>
          <p className="mt-2 text-slate-500">
            Manage your account and application preferences.
          </p>
        </div>

        <div className="space-y-4">
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                onClick={() => {
                  if (item.title === "Profile") {
                    navigate("/profile");
                  }

                  if (item.title === "Security") {
                    setShowPasswordForm((previous) => !previous);
                  }
                }}
                className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 ${
                  ["Profile", "Security"].includes(item.title)
                    ? "cursor-pointer transition hover:border-blue-300 hover:shadow-sm"
                    : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.title === "Profile"
                        ? user?.name || user?.email || "Your account"
                        : item.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            );
          })}
        </div>

        {showPasswordForm && (
          <form
            onSubmit={handleChangePassword}
            className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Change Password
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter your current password and choose a new one.
              </p>
            </div>

            {[
              {
                label: "Current Password",
                name: "currentPassword",
                key: "current",
              },
              {
                label: "New Password",
                name: "newPassword",
                key: "new",
              },
              {
                label: "Confirm New Password",
                name: "confirmPassword",
                key: "confirm",
              },
            ].map((field) => (
              <div key={field.name} className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {field.label}
                </label>

                <div className="relative">
                  <input
                    type={showPasswords[field.key] ? "text" : "password"}
                    name={field.name}
                    value={passwordData[field.name]}
                    onChange={(event) =>
                      setPasswordData((previous) => ({
                        ...previous,
                        [field.name]: event.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((previous) => ({
                        ...previous,
                        [field.key]: !previous[field.key],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Connected Gmail Accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage your connected email accounts.
              </p>
              <button
                onClick={() => {
                  window.location.href = `${API.defaults.baseURL}/gmail/connect`;
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Connect Gmail
              </button>
            </div>

            <button
              onClick={fetchGmailAccounts}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              title="Refresh accounts"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {gmailLoading ? (
              <p className="text-sm text-slate-500">
                Loading Gmail accounts...
              </p>
            ) : gmailError ? (
              <p className="text-sm text-red-500">{gmailError}</p>
            ) : gmailAccounts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No Gmail account connected yet.
              </p>
            ) : (
              gmailAccounts.map((account) => (
                <div
                  key={account._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                >
                  {/* Gmail icon and email */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">
                        {account.email}
                      </p>
                      <p className="text-xs text-green-600">Connected</p>
                    </div>
                  </div>

                  {/* Disconnect button */}
                  <button
                    onClick={() => setDisconnectTarget(account)}
                    disabled={disconnectingId === account._id}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    {disconnectingId === account._id
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Disconnect Confirmation Modal */}
        {disconnectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Disconnect Gmail?
                  </h2>
                </div>

                <button
                  onClick={() => setDisconnectTarget(null)}
                  disabled={disconnectingId !== null}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                      {disconnectTarget.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Connected Gmail account
                    </p>
                  </div>
                </div>
              </div>

              <p className="my-5 text-sm leading-6 text-slate-500">
                Are you sure you want to disconnect this account? You can
                connect it again anytime.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDisconnectTarget(null)}
                  disabled={disconnectingId !== null}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={disconnectingId !== null}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnectingId !== null
                    ? "Disconnecting..."
                    : "Yes, Disconnect"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Notification */}
        {notification && (
          <div className="fixed right-5 top-5 z-[60] w-full max-w-sm animate-in slide-in-from-right rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {notification.type === "success"
                    ? "Success!"
                    : "Something went wrong"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {notification.message}
                </p>
              </div>

              <button
                onClick={() => setNotification(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Logout section  */}
        <div
          onClick={handleLogout}
          role="button"
          className="mt-8 rounded-xl border border-red-200 bg-white p-5 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-50 p-3">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <h3 className="font-semibold text-red-600">Logout</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sign out from your MailPilot account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
