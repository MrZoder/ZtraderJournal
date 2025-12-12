import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1) Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // 2) Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signUp = (email, password) =>
    supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: "https://ztraderjournal.netlify.app/" }
    );

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  // NEW: send a reset link to the user’s email
const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/auth/update-password",
  });


  const signOut = async () => {
    await supabase.auth.signOut();
    // Immediately clear React state so UI flips back to AuthPage
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, signUp, signIn, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
