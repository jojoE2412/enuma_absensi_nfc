import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];
const DAYS_ID = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function toStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseStr(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}
function formatDisplay(str) {
  if (!str) return "";
  const p = parseStr(str);
  if (!p) return "";
  return `${String(p.day).padStart(2, "0")} ${MONTHS_ID[p.month]} ${p.year}`;
}

export default function DatePicker({ value, onChange, placeholder = "Pilih tanggal", minDate, maxDate }) {
  const today = new Date();
  const parsed = parseStr(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(parsed?.year  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const wrapRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day) { onChange(toStr(viewYear, viewMonth, day)); setOpen(false); }
  function clearValue(e) { e.stopPropagation(); onChange(""); }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);

  function isDisabled(day) {
    const str = toStr(viewYear, viewMonth, day);
    if (minDate && str < minDate) return true;
    if (maxDate && str > maxDate) return true;
    return false;
  }
  function isSelected(day) { return value === toStr(viewYear, viewMonth, day); }
  function isToday(day) {
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={wrapRef} className="relative select-none">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all focus:outline-none"
        style={{
          backgroundColor: open ? "var(--bg-card)" : "var(--bg-input)",
          borderColor: open ? "#3b82f6" : "var(--border-strong)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          boxShadow: open ? "0 0 0 1px #3b82f6" : "none"
        }}
      >
        <CalendarDays className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        <span className="flex-1 truncate">
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span onClick={clearValue} className="p-0.5 rounded transition-colors hover:text-red-500"
            style={{ color: "var(--text-muted)" }}>
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-2 left-0 w-72 rounded-2xl shadow-2xl p-4"
          style={{
            backgroundColor: "var(--bg-panel)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.2)"
          }}
        >
          {/* Header bulan/tahun */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-card)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-card)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Header hari */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ID.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold py-1"
                style={{ color: "var(--text-muted)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const todayCell = isToday(day);

              let bgColor = "transparent";
              let textColor = "var(--text-secondary)";
              let ring = "none";
              let cursor = "pointer";

              if (disabled) {
                textColor = "var(--text-muted)";
                cursor = "not-allowed";
              } else if (selected) {
                bgColor = "#2563eb";
                textColor = "#ffffff";
              } else if (todayCell) {
                bgColor = "var(--bg-card)";
                textColor = "#60a5fa";
                ring = "1px solid rgba(59,130,246,0.5)";
              }

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && selectDay(day)}
                  className="h-8 w-full rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: bgColor, color: textColor, outline: ring, cursor }}
                  onMouseEnter={e => {
                    if (!disabled && !selected) e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  }}
                  onMouseLeave={e => {
                    if (!disabled && !selected) e.currentTarget.style.backgroundColor = todayCell ? "var(--bg-card)" : "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Tombol Hari Ini */}
          <button
            type="button"
            onClick={() => {
              const todayValue = toStr(today.getFullYear(), today.getMonth(), today.getDate());
              if ((minDate && todayValue < minDate) || (maxDate && todayValue > maxDate)) return;
              onChange(todayValue);
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
              setOpen(false);
            }}
            className="mt-3 w-full py-1.5 rounded-xl text-xs font-semibold transition-all border border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
          >
            Hari Ini ({String(today.getDate()).padStart(2,"0")} {MONTHS_ID[today.getMonth()]} {today.getFullYear()})
          </button>
        </div>
      )}
    </div>
  );
}
