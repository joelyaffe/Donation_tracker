"use client";

interface DonationSummaryProps {
  totalAmount: number;
  donationCount: number;
}

export default function DonationSummary({ totalAmount, donationCount }: DonationSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
      <h2 className="text-lg font-medium mb-4 opacity-90">Donation Summary</h2>
      <div className="flex justify-between items-end">
        <div>
          <div className="text-4xl font-bold">${totalAmount.toFixed(2)}</div>
          <div className="text-sm opacity-80">total donated</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-semibold">{donationCount}</div>
          <div className="text-sm opacity-80">{donationCount === 1 ? "donation" : "donations"}</div>
        </div>
      </div>
    </div>
  );
}
