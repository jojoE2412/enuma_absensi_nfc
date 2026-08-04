import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const defaultAuthContext = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  role: null,
  isAdmin: false,
  isOperator: false,
  signIn: async () => {
    throw new Error("Auth context belum siap.");
  },
  signOut: async () => {},
  getAccessToken: async () => {
    throw new Error("Auth context belum siap.");
  },
  authFetch: async () => {
    throw new Error("Auth context belum siap.");
  },
  refreshProfile: async () => {}
};

const AuthContext = createContext(defaultAuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function syncSession(nextSession) {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      await fetchProfile(nextSession.user.id);
    } else {
      setProfile(null);
    }
  }

  // Fetch user profile from Supabase profiles table
  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
      setProfile(null);
    }
  }

  useEffect(() => {
    // 1. Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      syncSession(currentSession).finally(() => setLoading(false));
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        await syncSession(nextSession);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getAccessToken() {
    if (session?.access_token) {
      return session.access_token;
    }

    const { data: { session: freshSession }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!freshSession?.access_token) {
      throw new Error("Sesi login belum siap. Silakan login ulang.");
    }

    await syncSession(freshSession);
    return freshSession.access_token;
  }

  async function authFetch(url, options = {}) {
    const token = await getAccessToken();
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
      ...options,
      headers
    });
  }

  // Login function
  async function signIn(email, password) {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await syncSession(data.session);
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Logout function
  async function signOut() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("SignOut Error:", error.message);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    role: profile?.role || null,
    isAdmin: profile?.role === "admin",
    isOperator: profile?.role === "operator",
    signIn,
    signOut,
    getAccessToken,
    authFetch,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
