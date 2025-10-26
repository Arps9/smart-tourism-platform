"use client";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Create an Account
        </h2>
        <p className="text-center text-gray-500 mb-6">Start your journey</p>

        <Link href="/auth/login">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 mb-3">
            Continue with Google or GitHub
          </button>
        </Link>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
