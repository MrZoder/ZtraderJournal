// src/utils/noteService.js
import { supabase } from "./supabaseClient";

/**
 * Helper: fetch the currently authenticated user's UID.
 */
async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user?.id) throw new Error("User not authenticated.");
  return user.id;
}

/**
 * Fetch notes for a given journal.
 * @param {string} journal_id
 */
export async function fetchNotes(journal_id) {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("journal_id", journal_id)
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add a note to a journal.
 * @param {{ journal_id, text }} note
 */
export async function addNote(note) {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from("notes")
    .insert([{ ...note, user_id }]);

  if (error) throw error;
  return data;
}

/**
 * Update a note by id.
 * @param {number} id
 * @param {{ text: string }} updates
 */
export async function updateNote(id, updates) {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from("notes")
    .update({ ...updates })
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) throw error;
  return data;
}

/**
 * Delete a note by id.
 * @param {number} id
 */
export async function deleteNote(id) {
  const user_id = await getCurrentUserId();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) throw error;
}
