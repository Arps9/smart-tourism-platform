"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const supabase = createClient();

  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      alert("Enter a valid 10-digit number");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    setLoading(false);
    if (error) alert(error.message);
    else router.push("/auth/verify-otp");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Sign In</h2>
        <p className="text-center text-gray-500 mb-6">
          Choose your preferred login method
        </p>

        {/* Google Login */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 mb-3"
          onClick={() => handleLogin("google")}
        >
          <FcGoogle className="text-xl" /> Continue with Google
        </Button>

        {/* GitHub Login */}
        <Button
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 mb-6"
          onClick={() => handleLogin("github")}
        >
          <FaGithub className="text-lg" /> Continue with GitHub
        </Button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">OR CONTINUE WITH PHONE</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Phone Input */}
        <label className="block text-sm text-gray-600 mb-2">Phone Number</label>
        <div className="flex mb-3">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600">
            +91
          </span>
          <Input
            type="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-r-md border-gray-300"
          />
        </div>

        <p className="text-xs text-gray-500 mb-3">Enter your 10-digit mobile number</p>

        <Button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Sending..." : "Send OTP →"}
        </Button>

        <p className="mt-6 text-center text-sm text-gray-500">
          NEW TO DISCOVER INDIA?{" "}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}
