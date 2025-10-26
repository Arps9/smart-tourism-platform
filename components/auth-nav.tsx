"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <nav className="bg-white border-b shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold text-blue-600">
          Smart Tourism
        </Link>

        {user ? (
          <div className="relative group">
            <button className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-700">
              {user.email?.[0]?.toUpperCase()}
            </button>
            <div className="absolute hidden group-hover:block right-0 mt-2 bg-white border rounded-lg shadow-lg w-40">
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
