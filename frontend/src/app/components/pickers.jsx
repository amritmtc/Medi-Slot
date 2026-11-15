import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

/**
 * Date and time pickers used wherever a date or time must be chosen.
 * The field is a button: clicking it (or its icon) opens a picker, so nothing has to be typed by hand.
 * Values keep the same formats the API already uses: time "HH:MM" (24 h) and date "YYYY-MM-DD".
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n) => String(n).padStart(2, "0");

/** Shared open/close behaviour: outside click and Escape close, and the panel flips upward near the bottom edge. */
function usePicker() {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const toggle = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setUp(window.innerHeight - rect.bottom < 360 && rect.top > 360);
    }
    setOpen((v) => !v);
  };
  return { open, setOpen, up, rootRef, toggle };
}

// A picker panel can sit inside a <label>; stop that label from re-clicking the field when the panel is used.
const keepInside = (event) => event.preventDefault();

/* ───────────── time ───────────── */
function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
  const h24 = match ? Math.min(23, Number(match[1])) : 9;
  const minute = match ? Math.min(59, Number(match[2])) : 0;
  return { h24, minute, period: h24 >= 12 ? "PM" : "AM", hour12: h24 % 12 === 0 ? 12 : h24 % 12 };
}
const toTime = (hour12, minute, period) => `${pad((hour12 % 12) + (period === "PM" ? 12 : 0))}:${pad(minute)}`;
export const formatTime = (value) => {
  const t = parseTime(value);
  return `${pad(t.hour12)}:${pad(t.minute)} ${t.period}`;
};

export function TimeField({ value, onChange, step = 5, ariaLabel = "Time", className = "", align = "left", compact = false }) {
  const { open, setOpen, up, rootRef, toggle } = usePicker();
  const t = parseTime(value);
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  const set = (hour12, minute, period) => onChange(toTime(hour12, minute, period));
  return (
    <div className={"picker " + (compact ? "compact " : "") + className} ref={rootRef}>
      <button type="button" className="picker-field" aria-label={`${ariaLabel}: ${formatTime(value)}`} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        <span>{formatTime(value)}</span>
        <Clock3 size={17} />
      </button>
      {open && (
        <div className={"picker-panel time-panel" + (up ? " up" : "") + (align === "right" ? " right" : "")} role="dialog" aria-label={ariaLabel} onClick={keepInside}>
          <div className="time-cols">
            <div>
              <span className="picker-cap">Hour</span>
              <div className="picker-grid cols-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <button type="button" key={h} className={h === t.hour12 ? "on" : ""} onClick={() => set(h, t.minute, t.period)}>{pad(h)}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="picker-cap">Minute</span>
              <div className="picker-grid cols-3">
                {minutes.map((m) => (
                  <button type="button" key={m} className={m === t.minute ? "on" : ""} onClick={() => set(t.hour12, m, t.period)}>{pad(m)}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="period-row">
            {["AM", "PM"].map((p) => (
              <button type="button" key={p} className={p === t.period ? "on" : ""} onClick={() => set(t.hour12, t.minute, p)}>{p}</button>
            ))}
            <button type="button" className="picker-done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── date ───────────── */
const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based
function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) } : null;
}
export const formatDate = (value) => {
  const p = parseDate(value);
  return p ? `${pad(p.d)} ${MONTHS_SHORT[p.m]} ${p.y}` : "";
};

export function DateField({ value, onChange, min, max, clearable = false, placeholder = "Select date", ariaLabel = "Date", className = "", align = "left" }) {
  const { open, setOpen, up, rootRef, toggle } = usePicker();
  const selected = parseDate(value);
  const today = todayIso();
  const base = selected || parseDate(today);
  const [view, setView] = useState({ y: base.y, m: base.m });
  useEffect(() => { if (open) { const p = parseDate(value) || parseDate(today); setView({ y: p.y, m: p.m }); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const first = new Date(view.y, view.m, 1).getDay(); // 0 = Sunday
  const lead = (first + 6) % 7; // Monday-first grid
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const blocked = (key) => (min && key < min) || (max && key > max);
  const shift = (delta) => setView(({ y, m }) => { const next = new Date(y, m + delta, 1); return { y: next.getFullYear(), m: next.getMonth() }; });
  const pick = (key) => { onChange(key); setOpen(false); };

  return (
    <div className={"picker " + className} ref={rootRef}>
      <button type="button" className="picker-field" aria-label={`${ariaLabel}: ${value ? formatDate(value) : "not set"}`} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        <span className={value ? "" : "placeholder"}>{value ? formatDate(value) : placeholder}</span>
        <CalendarDays size={17} />
      </button>
      {open && (
        <div className={"picker-panel date-panel" + (up ? " up" : "") + (align === "right" ? " right" : "")} role="dialog" aria-label={ariaLabel} onClick={keepInside}>
          <div className="cal-head">
            <button type="button" className="cal-nav" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
            <b>{MONTHS[view.m]} {view.y}</b>
            <button type="button" className="cal-nav" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={16} /></button>
          </div>
          <div className="cal-grid cal-week">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={`gap${i}`} />;
              const key = iso(view.y, view.m, d);
              return (
                <button type="button" key={key} disabled={blocked(key)} className={(key === value ? "on " : "") + (key === today ? "today" : "")} onClick={() => pick(key)}>{d}</button>
              );
            })}
          </div>
          <div className="cal-foot">
            <button type="button" disabled={blocked(today)} onClick={() => pick(today)}>Today</button>
            {clearable && value && <button type="button" onClick={() => pick("")}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}
