import React, { useState } from "react";
import { Plus, Trash2, Mic, Image as ImageIcon, Tag, Smile } from "lucide-react";

export default function DuringTab({ value, onChange }) {
  const events = value?.during?.events || [];
  const set = (arr) => onChange((d) => ({ ...d, during: { ...(d.during||{}), events: arr } }));

  return (
    <div className="glass rounded-2xl p-4">
      <QuickCapture onAdd={(evt)=>set([evt, ...events])} />
      <Timeline items={events} onDelete={(id)=>set(events.filter(e=>e.id!==id))} />
    </div>
  );
}

function QuickCapture({ onAdd }) {
  const [text, setText] = useState("");
  const [tag, setTag]   = useState("General");
  const [mood, setMood] = useState("Neutral");

  const add = () => {
    const body = text.trim();
    if (!body) return;
    onAdd({ id: String(Date.now()), time: new Date().toISOString(), text: body, tag, mood, media: null });
    setText("");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className="input !py-1 !px-2 !text-sm w-auto" value={tag} onChange={(e)=>setTag(e.target.value)}>
          {["General","Setup","Mistake","News","Win","Loss"].map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="input !py-1 !px-2 !text-sm w-auto" value={mood} onChange={(e)=>setMood(e.target.value)}>
          {["Neutral","Calm","Focused","Anxious","Tilt"].map(m=><option key={m}>{m}</option>)}
        </select>
        <input className="input flex-1" placeholder="What’s happening?" value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&add()} />
        <button onClick={add} className="btn"><Plus size={14}/> Add</button>
      </div>
      <div className="mt-2 text-xs text-zinc-400 flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><Mic size={12}/> voice (todo)</span>
        <span className="inline-flex items-center gap-1"><ImageIcon size={12}/> screenshot (todo)</span>
      </div>
      <style>{`.input{border-radius:.75rem;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);padding:.5rem .7rem}.btn{background:linear-gradient(135deg,rgba(16,185,129,.95),rgba(34,211,238,.95));color:#000;padding:.55rem .9rem;border-radius:.7rem;font-weight:700}`}</style>
    </div>
  );
}

function Timeline({ items, onDelete }) {
  if (!items?.length) return <div className="mt-3 text-sm text-zinc-400">No events yet.</div>;
  return (
    <ul className="mt-3 space-y-2">
      {items.map((e)=>(
        <li key={e.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] text-zinc-400">{new Date(e.time).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})} • {e.tag} • {e.mood}</div>
            <div className="text-sm">{e.text}</div>
          </div>
          <button onClick={()=>onDelete(e.id)} className="rounded-md bg-white/5 hover:bg-white/10 p-1 text-rose-300"><Trash2 size={14}/></button>
        </li>
      ))}
    </ul>
  );
}
