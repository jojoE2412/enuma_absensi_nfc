export function labelCheckIn(status) {
  if (status === "on_time") return "Tepat Waktu";
  if (status === "late")    return "Terlambat";
  return "-";
}

export function labelCheckOut(status) {
  if (status === "normal")      return "Pulang Normal";
  if (status === "overtime")    return "Lembur";
  if (status === "early_leave") return "Mendahului Pulang";
  return "-";
}

export function badgeCheckIn(status) {
  if (status === "on_time") return "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30";
  if (status === "late")    return "px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30";
  return "text-xs";
}

export function badgeCheckOut(status) {
  if (status === "normal")      return "px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30";
  if (status === "overtime")    return "px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-500 border border-purple-500/30";
  if (status === "early_leave") return "px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30";
  return "text-xs";
}
