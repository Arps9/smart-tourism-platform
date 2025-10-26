"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  if (!user)
    return <p className="text-center mt-10 text-gray-600">Loading profile...</p>;

  return (
    <div className="max-w-md mx-auto mt-24">
      <Card className="p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-700 font-bold mb-4">
          {user.email?.[0]?.toUpperCase() || "U"}
        </div>
        <h2 className="text-xl font-semibold mb-2">{user.email}</h2>
        <p className="text-gray-500">{user.phone || "No phone linked"}</p>
      </Card>
    </div>
  );
}
