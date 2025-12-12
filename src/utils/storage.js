import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

/** CRUD for trades **/
export function getTrades() {
  try {
    const raw = localStorage.getItem("trades");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error parsing trades from localStorage", e);
    return [];
  }
}

export function saveTrade(trade) {
  const trades = getTrades();
  trades.push(trade);
  localStorage.setItem("trades", JSON.stringify(trades));
}

export function updateTrade(updatedTrade) {
  const trades = getTrades().map((t) =>
    t.id === updatedTrade.id ? updatedTrade : t
  );
  localStorage.setItem("trades", JSON.stringify(trades));
}

export function deleteTrade(id) {
  const trades = getTrades().filter((t) => t.id !== id);
  localStorage.setItem("trades", JSON.stringify(trades));
}

/** Daily rules storage **/
export function getDailyRules(dateKey) {
  try {
    const raw = localStorage.getItem("dailyRules");
    const all = raw ? JSON.parse(raw) : {};
    return all[dateKey] || [];
  } catch {
    return [];
  }
}

export function saveDailyRules(dateKey, rules) {
  try {
    const raw = localStorage.getItem("dailyRules");
    const all = raw ? JSON.parse(raw) : {};
    all[dateKey] = rules;
    localStorage.setItem("dailyRules", JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save daily rules", e);
  }
}

/** Analytics **/
// 1. Expectancy
export function computeExpectancy(trades) {
  if (!trades.length) return 0;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const winRate = wins.length / trades.length;
  const lossRate = losses.length / trades.length;
  const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / (wins.length || 1);
  const avgLoss =
    Math.abs(losses.reduce((s, t) => s + t.pnl, 0)) /
    (losses.length || 1);
  return avgWin * winRate - avgLoss * lossRate;
}

// 2. Drawdown & Run-up
export function computeDrawdown(trades) {
  let cum = 0,
    peak = 0,
    maxDD = 0,
    maxRU = 0;
  trades
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(({ pnl }) => {
      cum += pnl;
      maxRU = Math.max(maxRU, cum - peak);
      peak = Math.max(peak, cum);
      maxDD = Math.max(maxDD, peak - cum);
    });
  return { maxDrawdown: maxDD, maxRunup: maxRU };
}

// 3. Streaks
export function computeStreaks(trades) {
  let curW = 0,
    bestW = 0,
    curL = 0,
    bestL = 0;
  trades
    .slice()
    .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
    .forEach(({ pnl }) => {
      if (pnl > 0) {
        curW++;
        curL = 0;
      } else {
        curL++;
        curW = 0;
      }
      bestW = Math.max(bestW, curW);
      bestL = Math.max(bestL, curL);
    });
  return { currentWin: curW, bestWin: bestW, currentLose: curL, bestLose: bestL };
}

// 4. Time-of-day
export function computeTimeOfDay(trades) {
  const buckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: 0,
    total: 0,
  }));
  trades.forEach((t) => {
    const dt = dayjs(`${t.date}T${t.time}`);
    const hr = dt.hour();
    buckets[hr].count++;
    buckets[hr].total += t.pnl;
  });
  return buckets.map((b) => ({
    hour: b.hour,
    count: b.count,
    avg: b.count ? b.total / b.count : 0,
  }));
}

// 5. Journal Insights
export function computeJournalInsights(pnlData) {
  try {
    const raw = localStorage.getItem("dailyRules");
    const all = raw ? JSON.parse(raw) : {};
    return pnlData
      .filter(({ date }) => Array.isArray(all[date]) && all[date].length)
      .map(({ date, total }) => ({
        date,
        rules: all[date].join("; "),
        total,
      }));
  } catch (e) {
    console.error("Error computing journal insights", e);
    return [];
  }
}

// 6. P&L by Session (ET)
export function computePLBySession(trades) {
  const buckets = { Asia: 0, London: 0, NY: 0 };
  trades.forEach((t) => {
    const dtUtc = t.datetime
      ? dayjs.utc(t.datetime)
      : dayjs(`${t.date}T${t.time}`, { parseZone: true }).utc();
    const dtNy = dtUtc.tz("America/New_York");
    const minutes = dtNy.hour() * 60 + dtNy.minute();
    let sess = "Asia";
    if (minutes >= 120 && minutes < 570) sess = "London";
    else if (minutes >= 570 && minutes < 1080) sess = "NY";
    buckets[sess] += t.pnl;
  });
  return Object.entries(buckets).map(([session, total]) => ({
    session,
    total,
  }));
}

