"use client";

import { useState, useEffect, useCallback } from "react";
import DonationEntry from "@/components/DonationEntry";
import DonationSummary from "@/components/DonationSummary";
import { Donation } from "@/lib/schema";
import Link from "next/link";

export default function History() {
  const [donationsList, setDonationsList] = useState<Donation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState("");

  const fetchDonations = useCallback(async () => {
    const res = await fetch("/api/donations");
    if (res.ok) {
      const data = await res.json();
      setDonationsList(data);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;

    setIsAdding(true);
    setError(null);
    setLoadingStatus("Parsing donation...");

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

      setLoadingStatus("Saving...");

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

      setTextInput("");
      await fetchDonations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAdding(false);
      setLoadingStatus("");
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/donations?id=${id}`, { method: "DELETE" });
    await fetchDonations();
  };

  const handleExportCSV = () => {
    window.location.href = "/api/export";
  };

  const totalAmount = donationsList.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Donation History</h1>
          </div>
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
        </div>

        {/* Summary */}
        <div className="mb-6">
          <DonationSummary totalAmount={totalAmount} donationCount={donationsList.length} />
        </div>

        {/* Add Donation Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Add a donation
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAdding) {
                  handleSubmit(textInput);
                }
              }}
              placeholder='e.g. "$100 to Salvation Army on Dec 25"'
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isAdding}
            />
            <button
              onClick={() => handleSubmit(textInput)}
              disabled={isAdding || !textInput.trim()}
              className="px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? (
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

          {isAdding && loadingStatus && (
            <div className="mt-3 flex items-center gap-2 text-indigo-600 text-sm">
              <svg
                className="animate-spin h-4 w-4"
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
              {loadingStatus}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Donation List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            All Donations ({donationsList.length} {donationsList.length === 1 ? "record" : "records"})
          </h2>
          {donationsList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No donations recorded yet.
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
