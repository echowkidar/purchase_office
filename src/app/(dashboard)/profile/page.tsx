"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    // we assume phone is available on the user session if added in auth configuration
    // or we might need to fetch the full user profile if not there.
    // For now we try to populate if it exists in session, or empty otherwise.
    if ((session?.user as any)?.phone) {
      setPhone((session.user as any).phone);
    }
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await update({ name, phone }); // update next-auth session
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-amu-green">Update Profile</h1>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400 font-normal">(Cannot be changed)</span>
            </label>
            <input
              type="text"
              value={session?.user?.email || ""}
              readOnly
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={session?.user?.role || ""}
              readOnly
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={session?.user?.departmentName || "N/A"}
              readOnly
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && (
            <p className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle size={14} /> Profile updated successfully.
            </p>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-amu-gold text-amu-green font-bold hover:bg-amu-gold-light transition-all shadow-md flex items-center gap-2"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
