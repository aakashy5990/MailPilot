import { useEffect, useState, useRef } from "react";
import {
  Mail,
  Users,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Send,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import api from "../services/api";
import Papa from "papaparse";

function ComposeEmail() {
  const [emailMode, setEmailMode] = useState("single");
  const [step, setStep] = useState("selection");

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [bulkRecipients, setBulkRecipients] = useState("");
  const [recipientPreview, setRecipientPreview] = useState(false);

  const [bulkResults, setBulkResults] = useState(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const [recipientMode, setRecipientMode] = useState("manual");
  const [csvFile, setCsvFile] = useState(null);
  const [personalizedRecipients, setPersonalizedRecipients] = useState([]);

  const [compositionLoaded, setCompositionLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const [savedComposition, setSavedComposition] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const saveTimerRef = useRef(null);
  const saveRequestRef = useRef(Promise.resolve());
  const saveSequenceRef = useRef(0);

  const [csvStats, setCsvStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
  });

  const parseBulkRecipients = () => {
    const emails = bulkRecipients
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const uniqueEmails = [...new Set(emails)];

    const validEmails = uniqueEmails.filter((email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );

    const invalidEmails = uniqueEmails.filter(
      (email) => !validEmails.includes(email),
    );

    return {
      validEmails,
      invalidEmails,
      duplicateCount: emails.length - uniqueEmails.length,
    };
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      event.target.value = "";
      return;
    }

    setCsvFile(file);
    setError("");
    setBulkResults(null);
    setRecipientPreview(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const recipients = results.data.map((row) => ({
          email: String(row.email || "")
            .trim()
            .toLowerCase(),
          name: String(row.name || "").trim(),
        }));

        const validRecipients = recipients.filter(
          (recipient) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email) &&
            recipient.name.length > 0,
        );

        const invalidCount = recipients.length - validRecipients.length;

        // First create unique recipients
        const uniqueRecipients = [];
        const seenEmails = new Set();

        validRecipients.forEach((recipient) => {
          if (!seenEmails.has(recipient.email)) {
            seenEmails.add(recipient.email);
            uniqueRecipients.push(recipient);
          }
        });

        // Now calculate duplicates
        const duplicateCount = validRecipients.length - uniqueRecipients.length;

        // Save CSV statistics
        setCsvStats({
          total: recipients.length,
          valid: uniqueRecipients.length,
          invalid: invalidCount,
          duplicates: duplicateCount,
        });

        setPersonalizedRecipients(uniqueRecipients);

        validRecipients.forEach((recipient) => {
          if (!seenEmails.has(recipient.email)) {
            seenEmails.add(recipient.email);
            uniqueRecipients.push(recipient);
          }
        });

        setPersonalizedRecipients(uniqueRecipients);

        setError("");
      },

      error: () => {
        setError("Unable to read CSV file.");
        setPersonalizedRecipients([]);
      },
    });
  };

  const handlePreviewRecipients = () => {
    if (!accountId) {
      setError("Please select a Gmail account.");
      return;
    }

    // Manual Entry validation
    if (recipientMode === "manual") {
      const { validEmails, invalidEmails } = parseBulkRecipients();

      if (validEmails.length === 0) {
        setError("Please enter at least one valid email address.");
        return;
      }

      if (invalidEmails.length > 0) {
        setError("Please correct invalid email addresses.");
        return;
      }

      if (validEmails.length > 10) {
        setError("You can send a maximum of 10 emails per batch.");
        return;
      }
    }

    // CSV Upload validation
    if (recipientMode === "csv") {
      if (!csvFile || personalizedRecipients.length === 0) {
        setError("Please upload a valid CSV file.");
        return;
      }

      // if (csvStats.invalid > 0) {
      //   setError("Please correct invalid rows in your CSV file.");
      //   return;
      // }

      if (personalizedRecipients.length > 10) {
        setError("You can send a maximum of 10 emails per batch.");
        return;
      }
    }

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter an email message.");
      return;
    }

    setError("");
    setRecipientPreview(true);
  };

  // Fetch connected Gmail accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get("/gmail/accounts");
        const connectedAccounts = response.data.accounts || [];

        setAccounts(connectedAccounts);

        if (connectedAccounts.length > 0) {
          setAccountId(connectedAccounts[0]._id);
        }
      } catch (err) {
        setError("Unable to load connected Gmail accounts.");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Fetch Gmail accounts and restore saved composition
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // 1. Fetch connected Gmail accounts
        const accountResponse = await api.get("/gmail/accounts");
        const connectedAccounts = accountResponse.data.accounts || [];

        setAccounts(connectedAccounts);

        // Set first Gmail account as default
        if (connectedAccounts.length > 0) {
          setAccountId(connectedAccounts[0]._id);
        }

        // 2. Fetch saved composition
        try {
          const compositionResponse = await api.get("/composition");
          const saved = compositionResponse.data.composition;

          if (saved) {
            setSavedComposition(saved);
            setShowResumePrompt(true);
          }
        } catch (compositionError) {
          console.error(
            "Unable to restore composition:",
            compositionError.message,
          );
        } finally {
          setCompositionLoaded(true);
        }
      } catch (error) {
        setError("Unable to load connected Gmail accounts.");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Automatically save composition after 2 seconds of inactivity
  useEffect(() => {
    if (!compositionLoaded) return;

    const hasContent =
      recipient.trim() ||
      bulkRecipients.trim() ||
      subject.trim() ||
      message.trim() ||
      personalizedRecipients.length > 0;

    if (!hasContent) return;

    saveTimerRef.current = setTimeout(async () => {
      const currentSequence = ++saveSequenceRef.current;

      const compositionData = {
        emailMode,
        accountId,
        recipient,
        bulkRecipients,
        recipientMode,
        personalizedRecipients,
        subject,
        message,
      };

      setSaveStatus("saving");

      saveRequestRef.current = saveRequestRef.current
        .catch(() => {})
        .then(() => {
          // Skip this request if newer data is already available
          if (currentSequence !== saveSequenceRef.current) {
            return null;
          }

          return api.put("/composition", compositionData);
        });

      try {
        const result = await saveRequestRef.current;

        // Only the latest request can update the status
        if (currentSequence === saveSequenceRef.current && result) {
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("Autosave failed:", error.message);

        if (currentSequence === saveSequenceRef.current) {
          setSaveStatus("error");
        }
      }
    }, 2000);

    return () => {
      clearTimeout(saveTimerRef.current);
    };
  }, [
    compositionLoaded,
    emailMode,
    accountId,
    recipient,
    bulkRecipients,
    recipientMode,
    personalizedRecipients,
    subject,
    message,
  ]);

  // Fetch saved email templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get("/templates");
        setTemplates(response.data.templates || []);
      } catch (err) {
        console.error("Unable to load templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Select PDF attachment
  const handleAttachment = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("PDF file must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setAttachment(file);
  };

  // Clear saved composition after successful email sending
  const clearSavedComposition = async () => {

    // Invalidate all older queued autosave requests
    saveSequenceRef.current += 1;

    // Cancel pending autosave timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      // Wait for any ongoing autosave request
      await saveRequestRef.current.catch(() => {});

      // Delete composition from MongoDB
      await api.delete("/composition");

      setSaveStatus("idle");
      console.log("Saved composition cleared.");
      return true;
    } catch (error) {
      console.error("Unable to clear composition:", error.message);

      setSaveStatus("error");

      return false;
    }
  };

  // Resume the previous composition
  const handleResumeComposition = () => {
    if (!savedComposition) return;

    setEmailMode(savedComposition.emailMode || "single");

    const savedAccountExists = accounts.some(
      (account) => account._id === savedComposition.accountId,
    );

    if (savedAccountExists) {
      setAccountId(savedComposition.accountId);
    }

    setRecipient(savedComposition.recipient || "");
    setBulkRecipients(savedComposition.bulkRecipients || "");
    setRecipientMode(savedComposition.recipientMode || "manual");

    setPersonalizedRecipients(savedComposition.personalizedRecipients || []);

    setSubject(savedComposition.subject || "");
    setMessage(savedComposition.message || "");

    setStep("form");
    setShowResumePrompt(false);
  };

  // Discard the previous composition

  const handleDiscardComposition = async () => {
    // Try deleting the saved composition
    const isDeleted = await clearSavedComposition();

    // If deletion fails, stop here
    if (!isDeleted) {
      setError("Unable to discard your previous email. Please try again.");
      return;
    }

    // Deletion successful: clear local form data
    setSavedComposition(null);
    setShowResumePrompt(false);

    setEmailMode("single");
    setRecipient("");
    setBulkRecipients("");
    setRecipientMode("manual");
    setPersonalizedRecipients([]);
    setSubject("");
    setMessage("");
    setAttachment(null);

    setStep("selection");
    setError("");
  };

  // Send email
  const handleSendEmail = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!accountId) {
      setError("Please connect and select a Gmail account.");
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("accountId", accountId);
      formData.append("to", recipient);
      formData.append("subject", subject);
      formData.append("message", message);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await api.post("/gmail/send", formData);

      await clearSavedComposition();

      setSuccess(response.data.message || "Email sent successfully!");

      setRecipient("");
      setSubject("");
      setMessage("");
      setAttachment(null);

      const fileInput = document.getElementById("email-attachment");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send email. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkEmail = async () => {
    setError("");
    setSuccess("");
    setBulkResults(null);

    let recipientsToSend = [];

    // Manual Entry
    if (recipientMode === "manual") {
      const { validEmails, invalidEmails } = parseBulkRecipients();

      if (validEmails.length === 0) {
        setError("Please enter at least one valid email address.");
        return;
      }

      if (invalidEmails.length > 0) {
        setError("Please correct invalid email addresses.");
        return;
      }

      recipientsToSend = validEmails;
    }

    // CSV Upload
    if (recipientMode === "csv") {
      if (personalizedRecipients.length === 0) {
        setError("Please upload a valid CSV file.");
        return;
      }

      // if (csvStats.invalid > 0) {
      //   setError("Please correct invalid rows in your CSV file.");
      //   return;
      // }

      recipientsToSend = personalizedRecipients;
    }

    if (!accountId) {
      setError("Please select a Gmail account.");
      return;
    }

    if (recipientsToSend.length > 10) {
      setError("Maximum 10 recipients allowed per batch.");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      formData.append("accountId", accountId);
      formData.append("recipients", JSON.stringify(recipientsToSend));
      formData.append("subject", subject);
      formData.append("message", message);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await api.post("/gmail/bulk-send", formData);

      // Clear draft only when every recipient was successfully sent
      if (response.data.sent > 0 && response.data.failed === 0) {
        await clearSavedComposition();

        setBulkRecipients("");
        setPersonalizedRecipients([]);
        setSubject("");
        setMessage("");
        setRecipient("");
        setAttachment(null);
        setCsvFile(null);
        setRecipientPreview(false);
      }

      setBulkResults(response.data);

      setSuccess(
        `Bulk email completed! ${response.data.sent} sent, ${response.data.failed} failed.`,
      );

      setRecipientPreview(false);
      setShowBulkConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send bulk emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => {
            if (step === "form") {
              setStep("selection");
              setError("");
              setSuccess("");
            } else {
              window.history.back();
            }
          }}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MailPilot Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Compose Email
          </h1>

          <p className="mt-2 text-slate-500">
            {step === "selection"
              ? "Choose how you want to send your emails."
              : "Write your email and send it from your Gmail account."}
          </p>

          {step === "form" && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {saveStatus === "saving" && (
                <>
                  <Loader2 size={15} className="animate-spin text-blue-600" />
                  <span className="text-slate-500">Saving draft...</span>
                </>
              )}

              {saveStatus === "saved" && (
                <span className="text-green-600">✓ All changes saved</span>
              )}

              {saveStatus === "error" && (
                <span className="text-red-600">
                  ⚠ Unable to save draft. Please check your connection.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Email Mode Selection */}
        {step === "selection" && (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Single Email */}
              <button
                onClick={() => setEmailMode("single")}
                className={`rounded-2xl border-2 p-6 text-left transition ${
                  emailMode === "single"
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Mail size={27} />
                  </div>

                  {emailMode === "single" && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Single Email
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Send one email to one recipient. Perfect for personal
                  communication and individual job applications.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                  Choose Single Email
                  <ArrowRight size={17} />
                </div>
              </button>

              {/* Bulk Email */}
              <button
                onClick={() => setEmailMode("bulk")}
                className={`rounded-2xl border-2 p-6 text-left transition ${
                  emailMode === "bulk"
                    ? "border-violet-600 bg-violet-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-violet-300"
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Users size={27} />
                  </div>

                  {emailMode === "bulk" && (
                    <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900">Bulk Email</h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Send separate emails to multiple recipients with personalized
                  names and messages.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-600">
                  Choose Bulk Email
                  <ArrowRight size={17} />
                </div>
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep("form")}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* Single Email Form */}
        {step === "form" && emailMode === "single" && (
          <form
            onSubmit={handleSendEmail}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-7">
              <h2 className="text-xl font-bold text-slate-900">New Message</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your email will be sent through your connected Gmail account.
              </p>
            </div>

            {/* Gmail Account */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Send From
              </label>

              {loadingAccounts ? (
                <p className="text-sm text-slate-500">Loading accounts...</p>
              ) : accounts.length > 0 ? (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  No Gmail account connected. Please connect Gmail first.
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${api.defaults.baseURL}/gmail/connect`;
                    }}
                    className="ml-2 font-bold underline"
                  >
                    Connect Gmail
                  </button>
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Select Email Template */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Choose Email Template
              </label>

              <select
                defaultValue=""
                onChange={(e) => {
                  const selectedTemplate = templates.find(
                    (template) => template._id === e.target.value,
                  );

                  if (selectedTemplate) {
                    setSubject(selectedTemplate.subject);
                    setMessage(selectedTemplate.message);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option value="">
                  {loadingTemplates
                    ? "Loading templates..."
                    : templates.length === 0
                      ? "No saved templates found"
                      : "Select a template"}
                </option>

                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Select a saved template to automatically fill your subject and
                message.
              </p>
            </div>

            {/* Subject */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Message */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email here..."
                rows={8}
                required
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Attachment */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attachment (PDF only, maximum 5 MB)
              </label>

              <label
                htmlFor="email-attachment"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 transition hover:border-blue-500 hover:bg-blue-50"
              >
                <Paperclip className="text-blue-600" size={21} />
                <span className="text-sm text-slate-600">
                  Choose a PDF file
                </span>
                <input
                  id="email-attachment"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleAttachment}
                  className="hidden"
                />
              </label>

              {attachment && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-100 p-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={19} className="shrink-0 text-red-500" />
                    <span className="truncate text-sm text-slate-700">
                      {attachment.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      document.getElementById("email-attachment").value = "";
                    }}
                    className="text-slate-500 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Error and Success */}
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || loadingAccounts || accounts.length === 0}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Bulk Email Form */}
        {step === "form" && emailMode === "bulk" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Bulk Email</h2>

              <p className="mt-2 text-sm text-slate-500">
                Send the same email separately to multiple recipients.
              </p>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Send From Gmail Account
              </label>

              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loadingAccounts}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
              >
                <option value="">
                  {loadingAccounts
                    ? "Loading accounts..."
                    : "Select Gmail Account"}
                </option>

                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Email Addresses */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Recipient Email Addresses
              </label>

              {/* Mode Selection */}
              <div className="mb-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("manual");
                    setCsvFile(null);
                    setPersonalizedRecipients([]);
                    setRecipientPreview(false);
                    setError("");
                  }}
                  className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium ${
                    recipientMode === "manual"
                      ? "bg-violet-600 text-white"
                      : "border border-slate-300 text-slate-700"
                  }`}
                >
                  Manual Entry
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("csv");
                    setBulkRecipients("");
                    setRecipientPreview(false);
                    setError("");
                  }}
                  className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium ${
                    recipientMode === "csv"
                      ? "bg-violet-600 text-white"
                      : "border border-slate-300 text-slate-700"
                  }`}
                >
                  CSV Upload
                </button>
              </div>

              {/* CSV Mode */}
              {recipientMode === "csv" && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload CSV File
                  </label>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="w-full rounded-lg border border-gray-300 p-3"
                  />

                  {csvFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {csvFile.name}
                    </p>
                  )}

                  {/* CSV Summary */}
                  {csvFile && (
                    <div className="mt-4">
                      <h3 className="mb-3 font-semibold text-slate-800">
                        CSV Summary
                      </h3>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-slate-100 p-3">
                          <p className="text-xl font-bold">{csvStats.total}</p>
                          <p className="text-xs text-slate-600">Total Rows</p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-xl font-bold text-green-700">
                            {csvStats.valid}
                          </p>
                          <p className="text-xs text-green-700">Valid</p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-3">
                          <p className="text-xl font-bold text-red-700">
                            {csvStats.invalid}
                          </p>
                          <p className="text-xs text-red-700">Invalid</p>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-3">
                          <p className="text-xl font-bold text-amber-700">
                            {csvStats.duplicates}
                          </p>
                          <p className="text-xs text-amber-700">Duplicates</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual Recipient Preview */}
                  {personalizedRecipients.length > 0 && (
                    <div className="mt-5">
                      <h3 className="mb-3 font-semibold text-slate-800">
                        Recipient Preview
                      </h3>

                      <div className="max-h-60 space-y-2 overflow-y-auto">
                        {personalizedRecipients.map((recipient, index) => (
                          <div
                            key={`${recipient.email}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">
                                {recipient.name}
                              </p>
                              <p className="break-all text-sm text-slate-500">
                                {recipient.email}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Valid
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Mode */}
              {recipientMode === "manual" && (
                <>
                  <textarea
                    value={bulkRecipients}
                    onChange={(e) => {
                      setBulkRecipients(e.target.value);
                      setRecipientPreview(false);
                    }}
                    placeholder={
                      "hr1@company.com\nhr2@company.com\nhr3@company.com"
                    }
                    rows={6}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Separate email addresses using commas, spaces, semicolons,
                    or new lines.
                  </p>
                </>
              )}
            </div>

            {/* Email Subject */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* Email Message */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Message
              </label>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email message..."
                rows={8}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* PDF Attachment */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Attach Resume (PDF)
              </label>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleAttachment}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />

              {attachment && (
                <p className="mt-2 text-sm text-green-700">
                  Selected: {attachment.name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handlePreviewRecipients}
              className="mt-5 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Preview Recipients
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {recipientPreview && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 font-semibold text-gray-800">
                  Recipient Preview
                </h3>

                <p className="mb-3 text-sm text-gray-600">
                  Valid recipients:{" "}
                  <strong>
                    {recipientMode === "csv"
                      ? personalizedRecipients.length
                      : parseBulkRecipients().validEmails.length}
                  </strong>
                </p>

                {recipientMode === "csv" ? (
                  <div className="space-y-2">
                    {personalizedRecipients.map((recipient, index) => (
                      <div
                        key={`${recipient.email}-${index}`}
                        className="flex flex-col rounded-lg bg-white p-3 sm:flex-row sm:justify-between"
                      >
                        <span className="font-medium text-gray-800">
                          {recipient.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {recipient.email}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {parseBulkRecipients().validEmails.map((email, index) => (
                      <div
                        key={`${email}-${index}`}
                        className="rounded-lg bg-white p-3 text-sm text-gray-700"
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowBulkConfirm(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Continue to Send
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {bulkResults && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">
            Bulk Email Results
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-2xl font-bold">{bulkResults.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>

            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-2xl font-bold text-green-700">
                {bulkResults.sent}
              </p>
              <p className="text-sm text-green-700">Sent</p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-700">
                {bulkResults.failed}
              </p>
              <p className="text-sm text-red-700">Failed</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {bulkResults.results?.map((item, index) => (
              <div
                key={`${item.email}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <span className="break-all text-sm text-gray-700">
                  {item.email}
                </span>

                <span
                  className={`shrink-0 text-sm font-semibold ${
                    item.status === "sent" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.status === "sent" ? "Sent ✓" : "Failed ✕"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Composition Resume Popup */}
      {showResumePrompt && savedComposition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText size={25} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Previous email found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You have an unfinished email from your previous session. Would you
              like to continue writing it?
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Subject
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {savedComposition.subject || "No subject"}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase text-slate-400">
                Message preview
              </p>

              <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                {savedComposition.message || "No message written"}
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDiscardComposition}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleResumeComposition}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* bulk confirmation popup  */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Confirm Bulk Email
            </h2>

            <p className="mt-3 text-gray-600">
              You are about to send this email separately to:
            </p>

            <p className="mt-2 text-lg font-semibold text-blue-600">
              {recipientMode === "csv"
                ? personalizedRecipients.length
                : parseBulkRecipients().validEmails.length}{" "}
              recipients
            </p>

            <p className="mt-3 text-sm text-gray-500">
              Make sure these recipients expect or have agreed to receive your
              email. Each recipient will receive a separate email.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowBulkConfirm(false)}
                disabled={sending}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendBulkEmail}
                disabled={sending}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComposeEmail;
