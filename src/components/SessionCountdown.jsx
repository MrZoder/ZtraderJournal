import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
import { motion } from "framer-motion";

dayjs.extend(utc);
dayjs.extend(duration);

const SESSIONS = {
  Asia: { open: "00:00", close: "08:00" },
  London: { open: "08:00", close: "13:00" },
  NewYork: { open: "13:00", close: "00:00" }, // closes at midnight UTC
};

export default function SessionCountdown() {
  const [sessionData, setSessionData] = useState([]);

  const computeSessionStatus = () => {
    const now = dayjs();
    const upcoming = [];

    Object.entries(SESSIONS).forEach(([name, { open, close }]) => {
      const [hOpen, mOpen] = open.split(":").map(Number);
      const [hClose, mClose] = close.split(":" ).map(Number);

      let openUTC = dayjs.utc().hour(hOpen).minute(mOpen).second(0).millisecond(0);
      let closeUTC = dayjs.utc().hour(hClose).minute(mClose).second(0).millisecond(0);

      // If close is technically the next day (like NewYork session ending at 00:00 UTC)
      if (closeUTC.isBefore(openUTC)) closeUTC = closeUTC.add(1, "day");

      const openLocal = openUTC.local();
      const closeLocal = closeUTC.local();

      const isOpen = now.isAfter(openLocal) && now.isBefore(closeLocal);
      const nextOpen = now.isBefore(openLocal) ? openLocal : openLocal.add(1, "day");
      const timeUntilOpen = dayjs.duration(nextOpen.diff(now));
      const countdown = `${timeUntilOpen.hours()}h ${timeUntilOpen.minutes()}m`;

      upcoming.push({
        name,
        openTime: openLocal.format("h:mm A"),
        closeTime: closeLocal.format("h:mm A"),
        isOpen,
        countdown,
      });
    });

    setSessionData(upcoming);
  };

  useEffect(() => {
    computeSessionStatus();
    const interval = setInterval(computeSessionStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 shadow-xl">
      <h4 className="text-sm uppercase text-zinc-400 font-semibold mb-3 tracking-wide">
        Next Session Opens
      </h4>
      <ul className="space-y-2">
        {sessionData.map(({ name, openTime, closeTime, isOpen, countdown }) => (
          <motion.li
            key={name}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300 ${isOpen ? "bg-green-900/40 text-green-300" : "bg-zinc-800/50 text-white"}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="capitalize">
              {name} <span className="text-xs text-zinc-400">({openTime} - {closeTime})</span>
            </div>
            <div className="text-right">
              {isOpen ? (
                <span className="text-green-400">Open Now</span>
              ) : (
                <span className="text-zinc-400 text-xs">Opens in {countdown}</span>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}