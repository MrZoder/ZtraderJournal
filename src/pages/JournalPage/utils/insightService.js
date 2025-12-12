// Lightweight local service for Insights (no DB). Swap internals later.
// Shape: { id, title, content, tags[], type: 'Lesson'|'Principle'|'Action', impact:1..5, linked_trade_ids:[], created_at, updated_at }

const STORAGE_KEY = "ztrader_journal_insights_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function uuid() {
  return (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + "";
}

function nowISO() {
  return new Date().toISOString();
}

// Seed examples for dev
(function maybeSeed() {
  const rows = readAll();
  if (rows.length) return;
  writeAll([
    {
      id: uuid(),
      title: "Stop revenge trading after first loss",
      content:
        "First loss narrows my focus and increases risk-taking. Rule: after first loss, step away for 10 mins, reevaluate bias, only continue if plan still valid.",
      tags: ["discipline", "risk"],
      type: "Lesson",
      impact: 5,
      linked_trade_ids: [],
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: uuid(),
      title: "Expectancy lives in A+ sessions",
      content:
        "My expectancy spikes when I filter by HTF alignment + session killzone. Only deploy size on A+ days.",
      tags: ["expectancy", "filters"],
      type: "Principle",
      impact: 4,
      linked_trade_ids: [],
      created_at: nowISO(),
      updated_at: nowISO(),
    },
  ]);
})();

export async function listInsights({ q = "", type = "", tag = "" } = {}) {
  const rows = readAll();
  const filtered = rows.filter((r) => {
    const search = q.trim().toLowerCase();
    const inText = search
      ? (r.title || "").toLowerCase().includes(search) ||
        (r.content || "").toLowerCase().includes(search) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(search))
      : true;
    const inType = type ? r.type === type : true;
    const inTag = tag ? (r.tags || []).includes(tag) : true;
    return inText && inType && inTag;
  });
  filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return new Promise((res) => setTimeout(() => res(filtered), 120));
}

export async function upsertInsight(row) {
  const rows = readAll();
  const isNew = !row.id;
  const id = row.id || uuid();
  const now = nowISO();

  let next;
  if (isNew) {
    next = [
      {
        id,
        title: "",
        content: "",
        tags: [],
        type: "Lesson",
        impact: 3,
        linked_trade_ids: [],
        created_at: now,
        updated_at: now,
        ...row,
      },
      ...rows,
    ];
  } else {
    next = rows.map((r) => (r.id === id ? { ...r, ...row, updated_at: now } : r));
  }

  writeAll(next);
  return next.find((r) => r.id === id);
}

export async function removeInsight(id) {
  writeAll(readAll().filter((r) => r.id !== id));
  return true;
}
