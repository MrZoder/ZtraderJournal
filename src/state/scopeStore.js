// src/state/scopeStore.js
import { create } from "zustand";

/**
 * Global account scope:
 * - accountId: null means "All Accounts"
 */
export const useScope = create((set) => ({
  accountId: null,
  setAccountId: (accountId) => set({ accountId }),
  clearAccount: () => set({ accountId: null }),
}));
