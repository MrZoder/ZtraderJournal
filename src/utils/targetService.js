import { supabase } from "./supabaseClient";
// assuming you already exported your client

export async function getDailyTarget(dateStr) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("daily_targets")
    .select("target")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .single();

  if (error && error.code !== "PGRST116") throw error; // "No rows found"
  return data?.target ?? null;
}

export async function setDailyTarget(dateStr, targetValue) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { error } = await supabase
    .from("daily_targets")
    .upsert([
      {
        user_id: user.id,
        date: dateStr,
        target: targetValue,
      },
    ]);

  if (error) throw error;
}

// Get target for a specific date (e.g., '2025-06-23')
export async function getTargetForDate(date) {
  const { data, error } = await supabase
    .from("daily_targets")
    .select("*")
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") throw error; // 'no rows' is fine
  return data;
}

export async function updateTargetForDate(date, amount) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user_id = user.id;

  const { error } = await supabase
    .from("daily_targets")
    .upsert(
      { user_id, date, target: amount },
      { onConflict: ["user_id", "date"] } // ✅ This must match your unique constraint
    );

  if (error) throw error;
}
