"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import VoiceInput from "@/components/VoiceInput";
import DonationEntry from "@/components/DonationEntry";
import DonationSummary from "@/components/DonationSummary";
import { Donation } from "@/lib/schema";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [donationsList, setDonationsList] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Donation | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchDonations = useCallback(async () => {
    const res = await fetch("/api/donations");
    if (res.ok) {
      const data = await res.json();
      setDonationsList(data);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDonations();
    }
  }, [fetchDonations, status]);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setLastAdded(null);
    setLoadingStatus("Parsing your donation...");

    try {
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!parseRes.ok) {
        const errorData = await parseRes.json();
        throw new Error(errorData.details || "Failed to parse donation");
      }

      const parsed = await parseRes.json();

      setLoadingStatus("Saving donation...");

      const donationRes = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          organization: parsed.organization,
          amount: parsed.amount,
          donationDate: parsed.donationDate,
        }),
      });

      if (!donationRes.ok) {
        throw new Error("Failed to save donation");
      }

      const savedDonation = await donationRes.json();
      setLastAdded(savedDonation);
      setTextInput("");
      await fetchDonations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/donations?id=${id}`, { method: "DELETE" });
    if (lastAdded?.id === id) {
      setLastAdded(null);
    }
    await fetchDonations();
  };

  const handleExportCSV = () => {
    window.location.href = "/api/export";
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const totalAmount = donationsList.reduce((sum, d) => sum + d.amount, 0);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4"
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
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Donation Tracker</h1>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-sm">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-600 hidden sm:inline">
                {session?.user?.name}
              </span>
            </div>
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="Download CSV"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>
            {/* History */}
            <Link
              href="/history"
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="History"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Link>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="Sign out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Donation Summary */}
        <div className="mb-6">
          <DonationSummary totalAmount={totalAmount} donationCount={donationsList.length} />
        </div>

        {/* Voice Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <VoiceInput
            onTranscript={(text) => handleSubmit(text)}
            disabled={isLoading}
          />

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSubmit(textInput);
                }
              }}
              placeholder='e.g. "Donated $50 to Red Cross on Jan 5"'
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmit(textInput)}
              disabled={isLoading || !textInput.trim()}
              className="px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Loading Status */}
          {isLoading && loadingStatus && (
            <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-indigo-50 rounded-xl">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
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
              <span className="text-indigo-700 font-medium">{loadingStatus}</span>
            </div>
          )}

          {/* Success Message */}
          {lastAdded && !isLoading && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-indigo-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-indigo-700 font-semibold">Donation recorded!</span>
              </div>
              <p className="text-indigo-800 text-sm mb-1">
                <span className="font-medium">{lastAdded.organization}</span>
                {" - "}
                <span className="font-bold">${lastAdded.amount.toFixed(2)}</span>
              </p>
              {lastAdded.donationDate && (
                <p className="text-indigo-600 text-xs">
                  Date: {new Date(lastAdded.donationDate + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Donation Entries */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            All Donations ({donationsList.length} {donationsList.length === 1 ? 'record' : 'records'})
          </h2>
          {donationsList.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-gray-400">
              No donations recorded yet. Tap the microphone to get started!
            </div>
          ) : (
            donationsList.map((donation) => (
              <DonationEntry key={donation.id} donation={donation} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
