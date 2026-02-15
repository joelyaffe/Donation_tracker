"use client";

import { useState } from "react";
import Link from "next/link";

type UserInfo = {
  id: string;
  name: string | null;
  username: string | null;
  createdAt: number;
  donationCount: number;
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [userList, setUserList] = useState<UserInfo[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async (adminSecret: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users?secret=${encodeURIComponent(adminSecret)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Unauthorized");
        return;
      }
      const data = await res.json();
      setUserList(data.users);
      setAuthenticated(true);
    } catch {
      setError("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(secret);
  };

  const handleDelete = async (userId: string, username: string | null) => {
    if (!confirm(`Delete user "${username || userId}" and all their donations?`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users?secret=${encodeURIComponent(secret)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
        return;
      }

      setUserList((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin</h1>
            <p className="text-gray-500 mt-2">Enter admin secret to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Secret
                </label>
                <input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Enter admin secret"
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
                disabled={isLoading || !secret}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Verifying..." : "Access Admin"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <span className="text-sm text-gray-500">{userList.length} account{userList.length !== 1 ? "s" : ""}</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {userList.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {user.name || "No name"}{" "}
                  <span className="text-gray-400 font-normal">@{user.username || "—"}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {user.donationCount} donation{user.donationCount !== 1 ? "s" : ""}
                  {" · "}
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(user.id, user.username)}
                disabled={deletingId === user.id}
                className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {deletingId === user.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}

          {userList.length === 0 && (
            <p className="text-center text-gray-500 py-8">No accounts found.</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => fetchUsers(secret)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
