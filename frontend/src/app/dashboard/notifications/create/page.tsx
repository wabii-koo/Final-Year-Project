"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  AlertCircle,
  Users,
  Calendar,
  Send,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

interface NotificationData {
  title: string;
  content: string;
  priority: "normal" | "emergency";
  recipientGroup:
    | "all_guardians"
    | "all_teachers"
    | "specific_class"
    | "specific_users";
}

export default function CreateNotificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notification, setNotification] = useState<NotificationData>({
    title: "",
    content: "",
    priority: "normal",
    recipientGroup: "all_guardians",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setNotification((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!notification.title.trim()) {
      errors.push("Notification title is required");
    } else if (notification.title.length < 3) {
      errors.push("Title must be at least 3 characters long");
    }

    if (!notification.content.trim()) {
      errors.push("Notification message is required");
    } else if (notification.content.length < 10) {
      errors.push("Message must be at least 10 characters long");
    }

    return errors;
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If emergency, show confirmation first
    if (notification.priority === "emergency" && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      setLoading(false);
      setShowConfirmModal(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      console.log("Sending notification:", notification);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      console.log("API URL:", `${apiUrl}/api/notifications`);

      let response;
      try {
        response = await fetch(`${apiUrl}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(notification),
        });
      } catch (fetchError: any) {
        console.error("Fetch failed:", fetchError);
        setError(
          `Cannot connect to backend server. Please make sure it's running on port 3000. Error: ${fetchError.message}`,
        );
        setLoading(false);
        return;
      }

      console.log("Response status:", response.status);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        const text = await response.text();
        console.error("Response text:", text);
        setError(`Server returned invalid JSON. Status: ${response.status}`);
        setLoading(false);
        return;
      }

      console.log("Response data:", data);

      if (response.ok && data.success) {
        // Broadcast to all other open tabs immediately
        try {
          const bc = new BroadcastChannel("school-updates");
          bc.postMessage({
            type: "notification",
            action: "created",
            title: notification.title,
          });
          bc.close();
        } catch (_) {}

        setSuccess("Notification created successfully!");
        setNotification({
          title: "",
          content: "",
          priority: "normal",
          recipientGroup: "all_guardians",
        });

        // Redirect to notifications list after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/notifications");
        }, 1500);
      } else {
        setError(
          data.error?.message ||
            data.message ||
            `Failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError("Unexpected error: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <button
                  aria-label="Button"
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Create Notification
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Bell className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                Send New Notification
              </h2>
            </div>
            <p className="text-gray-600">
              Create and send notifications to guardians, teachers, or specific
              groups.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">
                    Please fix the following errors:
                  </div>
                  <div className="text-sm whitespace-pre-line">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title *
              </label>
              <input
                type="text"
                name="title"
                value={notification.title}
                onChange={handleChange}
                placeholder="Enter notification title"
                className="input w-full"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Message *
              </label>
              <textarea
                name="content"
                value={notification.content}
                onChange={handleChange}
                placeholder="Enter your notification message here..."
                rows={6}
                className="input w-full"
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={notification.priority === "normal"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Normal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="emergency"
                    checked={notification.priority === "emergency"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-red-600 font-medium">
                    Emergency
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href="/dashboard/notifications">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Emergency Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Confirm Emergency Alert
            </h3>
            <p className="text-gray-600 text-center mb-6">
              You are about to send an{" "}
              <span className="text-red-600 font-bold uppercase">
                Emergency Alert
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900">
                {notification.recipientGroup.replace("_", " ")}
              </span>
              . This will bypass normal priority and provide immediate
              notification.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {loading ? "Sending..." : "Confirm & Send Now"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
