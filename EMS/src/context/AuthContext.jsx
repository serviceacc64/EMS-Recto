import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Handle Auth State Changes
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session error:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth event:", event);
      setUser(session?.user ?? null);
      
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Profile Fetching & Loading State
  useEffect(() => {
    // Safety timeout: Never let the app stay stuck in loading for more than 5 seconds
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Auth loading safety timeout reached");
        setLoading(false);
      }
    }, 5000);

    if (user) {
      if (!profile) {
        fetchProfile(user.id);
      } else {
        setLoading(false);
      }
    } else {
      // If no user, we're definitely not loading a profile
      setLoading(false);
    }

    return () => clearTimeout(timeout);
  }, [user, profile]);



  const fetchProfile = async (userId) => {
    try {
      console.log("📡 Fetching profile for:", userId);
      // Using .select() without .single() to be safe
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);

      if (error) {
        console.error("❌ Profile error:", error.message);
      } else if (data && data.length > 0) {
        console.log("✅ Profile loaded:", data[0]);
        setProfile(data[0]);
      } else {
        console.warn("⚠️ No profile found for user");
      }
    } catch (err) {
      console.error("💥 Profile catch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    userRole: profile?.role || null,
    isAdmin: profile?.role === 'super_admin' || profile?.role === 'admin',
    isSuperAdmin: profile?.role === 'super_admin',
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
