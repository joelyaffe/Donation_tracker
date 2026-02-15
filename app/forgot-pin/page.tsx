"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "username" | "answer" | "success";

export default function ForgotPinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/auth/reset-pin?username=${encodeURIComponent(username.toLowerCase())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Username not found");
        return;
      }

      setSecurityQuestion(data.securityQuestion);
      setStep("answer");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPin !== confirmPin) {
      setError("PINs don't match");
      return;
    }

    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.toLowerCase(),
          securityAnswer,
          newPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset PIN");
        return;
      }

      setStep("success");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reset PIN</h1>
          <p className="text-gray-500 mt-2">
            {step === "username" && "Enter your username to get started"}
            {step === "answer" && "Answer your security question"}
            {step === "success" && "Your PIN has been reset"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === "username" && (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your username"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Looking up..." : "Continue"}
              </button>
            </form>
          )}

          {step === "answer" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-indigo-800">{securityQuestion}</p>
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Answer
                </label>
                <input
                  id="answer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1">
                  New PIN (4-6 digits)
                </label>
                <input
                  id="newPin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900"
                  placeholder="••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmNewPin" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New PIN
                </label>
                <input
                  id="confirmNewPin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900"
                  placeholder="••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !securityAnswer || newPin.length < 4 || confirmPin.length < 4}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Resetting..." : "Reset PIN"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="text-4xl">&#10003;</div>
              <p className="text-gray-700">Your PIN has been successfully reset.</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
