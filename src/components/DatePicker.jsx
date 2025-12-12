import React, { useState } from "react";
import { Popover } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DatePicker({ selected, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover className="relative">
      <Popover.Button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 rounded-full border border-gray-600 hover:border-yellow-500 transition flex items-center space-x-2"
      >
        <span>{dayjs(selected).format("ddd, MMM D, YYYY")}</span>
      </Popover.Button>

      {open && (
        <Popover.Panel className="absolute z-10 mt-2 bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 rounded-2xl shadow-xl">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            fromYear={2020}
            toYear={dayjs().year() + 1}
            components={{
              IconLeft: ChevronLeft,
              IconRight: ChevronRight,
            }}
            className="bg-transparent text-white"
            styles={{
              head_cell: { color: "#dabe6e" },
              day_selected: { backgroundColor: "#dabe6e", color: "#000" },
              day_today: { boxShadow: `0 0 0 2px #00FFA3` },
            }}
          />

          <button
            onClick={() => {
              const today = new Date();
              onChange(today);
              setOpen(false);
            }}
            className="mt-3 w-full text-center py-1 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition"
          >
            Today
          </button>
        </Popover.Panel>
      )}
    </Popover>
  );
}
