import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mail,
  Send,
  FileText,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  MailPlus,
  Users,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get("/gmail/accounts");
        setAccounts(response.data.accounts || []);
      } catch (error) {
        setError("Unable to load connected Gmail account.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 px-5 py-7 text-white md:flex">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">MailPilot</h1>
              <p className="text-xs text-slate-400">Smart Email Workspace</p>
            </div>
          </div>

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            <a
              href="dashboard"
              className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </a>

            <button
              onClick={() => navigate("/compose")}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer"
            >
              Compose Email
            </button>

            <button
              onClick={() => navigate("/history")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 cursor-pointer"
            >
              <Send size={18} />
              Sent History
            </button>

            <button
              onClick={() => navigate("/templates")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 cursor-pointer"
            >
              <FileText size={18} />
              Templates
            </button>
          </nav>

          <div
            onClick={() => navigate("/settings")}
            className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 cursor-pointer"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Settings size={16} />
              Account Settings
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Manage your connected Gmail accounts and preferences.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage your email workspace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="cursor-pointer rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50">
                <Bell size={19} />
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  M
                </div>
                <span className="hidden text-sm font-medium sm:block">
                  My Workspace
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </div>
            </div>
          </header>

          {/* Dashboard Body */}
          <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
            {/* Welcome */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  YOUR WORKSPACE
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Welcome to MailPilot
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Everything you need to manage your email campaigns.
                </p>
              </div>

              <button
                onClick={() => navigate("/compose")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer"
              >
                <Plus size={18} />
                Compose Email
              </button>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Connected Accounts</p>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Mail size={20} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {loading ? "..." : accounts.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Gmail accounts connected
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Emails Sent</p>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <Send size={20} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">--</p>
                <p className="mt-1 text-xs text-slate-400">
                  History analytics coming soon
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Email Templates</p>
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                    <FileText size={20} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">--</p>
                <p className="mt-1 text-xs text-slate-400">
                  Template feature coming soon
                </p>
              </div>
            </section>

            {/* Gmail Accounts */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Connected Gmail Accounts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your emails are sent using your own Gmail account.
                  </p>
                </div>

                <button
                  onClick={() => {
                    window.location.href = `${api.defaults.baseURL}/gmail/connect`;
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
                >
                  <Plus size={16} />
                  Add Account
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={18} />
                  Loading Gmail accounts...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle size={18} />
                  {error}
                </div>
              ) : accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
                  <Mail className="mx-auto mb-3 text-slate-400" size={30} />
                  <p className="font-semibold text-slate-800">
                    No Gmail account connected
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Connect your Gmail account to start sending emails.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account._id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <Mail size={21} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {account.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Connected Gmail account
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <CheckCircle2 size={17} />
                        Connected
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Quick Actions
              </h2>

              <div onClick={() => navigate("/compose")} className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MailPlus size={22} />
                  </div>
                  <h3 className="font-bold text-slate-900">Send an Email</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Write a message, add recipients and attach your resume PDF.
                  </p>
                </div>

                <div onClick={() => navigate("/compose")} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Users size={22} />
                  </div>
                  <h3 className="font-bold text-slate-900">Bulk Email</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Send individual personalized emails to multiple recipients.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
