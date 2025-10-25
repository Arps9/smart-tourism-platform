"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyOtp() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setMessage(error ? error.message : "✅ Logged in successfully!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md p-6 bg-white shadow-lg rounded-xl space-y-4"
      >
        <h1 className="text-xl font-bold text-center text-blue-600">Verify OTP</h1>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-md p-2"
        />
        <input
          type="text"
          placeholder="OTP"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          className="w-full border rounded-md p-2"
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded-md">
          Verify
        </button>
        {message && <p className="text-center text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  );
}
