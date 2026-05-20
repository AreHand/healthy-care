import type { CalcInput, CalcResult } from "./health";

export interface HistoryEntry {
  id: string;
  createdAt: string; // ISO
  input: CalcInput;
  result: CalcResult;
  unitPreference: "metric" | "imperial";
}

const KEY = "fitlife.history.v1";

export function loadLocalHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalEntry(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  const list = loadLocalHistory();
  list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

export function deleteLocalEntry(id: string) {
  if (typeof window === "undefined") return;
  const list = loadLocalHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearLocalHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
