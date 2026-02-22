import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const checkAdmin = async (u: User | null) => {
      setUser(u);
      if (u) {
        try {
          const { data, error } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
          if (error) {
            console.error("has_role check failed:", error.message);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!data);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
      clearTimeout(timeout);
    };

    // Safety timeout — never hang more than 8s
    timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 8000);

    let initialDone = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (initialDone) {
        await checkAdmin(session?.user ?? null);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialDone = true;
      await checkAdmin(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, login, logout };
};
