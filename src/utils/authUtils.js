// src/utils/authUtils.js
import { supabase } from "./supabaseClient";

export async function getUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("User not authenticated");
  return user.id;
}
