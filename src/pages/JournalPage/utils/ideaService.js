// Lightweight local service for Idea Inbox (no DB required).
// Later, you can swap internals to Supabase while keeping the same API.

const STORAGE_KEY = "ztrader_journal_ideas_v1";

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
  return crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

function nowISO() {
  return new Date().toISOString();
}

// Seed once (purely for dev/demo feel)
function maybeSeed() {
  const rows = readAll();
  if (rows.length) return;
  writeAll([
    {
      id: uuid(),
      title: "NYO Judas → OB Pullback",
      description:
        "Test confluence: HTF bias + killzone. Measure R distribution on A+ filters only.",
      tags: ["A+", "NYO", "OB"],
      status: "Ready",
      priority: 5,
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: uuid(),
      title: "PM Range Fade",
      description: "Observe PM session range expansions → fade only at extremes.",
      tags: ["PM", "Fade"],
      status: "Explore",
      priority: 3,
      created_at: nowISO(),
      updated_at: nowISO(),
    },
    {
      id: uuid(),
      title: "VWAP reclaim + IB break",
      description: "Only trade reclaim with structure shift & session liquidity sweep.",
      tags: ["VWAP", "IB", "Structure"],
      status: "Backlog",
      priority: 2,
      created_at: nowISO(),
      updated_at: nowISO(),
    },
  ]);
}

maybeSeed();

export async function listIdeas({ q = "", status = "", priority = 0 } = {}) {
  const rows = readAll();

  const filtered = rows.filter((r) => {
    const matchesQ = q
      ? (r.title || "").toLowerCase().includes(q.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(q.toLowerCase()) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(q.toLowerCase()))
      : true;
    const matchesStatus = status ? r.status === status : true;
    const matchesPriority = priority ? Number(r.priority) === Number(priority) : true;
    return matchesQ && matchesStatus && matchesPriority;
  });

  // Default sort: updated desc
  filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Simulate async
  return new Promise((res) => setTimeout(() => res(filtered), 150));
}

export async function upsertIdea(row) {
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
        description: "",
        tags: [],
        status: "Backlog",
        priority: 3,
        created_at: now,
        updated_at: now,
        ...row,
      },
      ...rows,
    ];
  } else {
    next = rows.map((r) =>
      r.id === id ? { ...r, ...row, updated_at: now } : r
    );
  }

  writeAll(next);
  return next.find((r) => r.id === id);
}

export async function removeIdea(id) {
  const rows = readAll().filter((r) => r.id !== id);
  writeAll(rows);
  return true;
}
