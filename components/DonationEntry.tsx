"use client";

import { Donation } from "@/lib/schema";

interface DonationEntryProps {
  donation: Donation;
  onDelete: (id: number) => void;
}

export default function DonationEntry({ donation, onDelete }: DonationEntryProps) {
  const formatCreatedAt = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">
            {donation.organization}
          </h3>
          <p className="text-gray-500 text-sm italic mt-1">
            &ldquo;{donation.description}&rdquo;
          </p>
        </div>
        <button
          onClick={() => onDelete(donation.id)}
          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-indigo-600">
            ${donation.amount.toFixed(2)}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-600">
            {donation.donationDate
              ? new Date(donation.donationDate + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No date"}
          </span>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Logged {formatCreatedAt(donation.createdAt)}
      </div>
    </div>
  );
}
