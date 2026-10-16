export type ProjectSchedule = {
  date_mode: "range" | "days";
  start_date: string | null;
  end_date: string | null;
  specific_dates: string[];
};

export function addProjectDate(dates: string[], date: string): string[] {
  return [...new Set([...dates, date])].sort();
}

export function removeProjectDate(dates: string[], date: string): string[] {
  return dates.filter((value) => value !== date);
}

/** Returns only scheduled days inside the visible month, including range endpoints. */
export function projectCalendarDates(project: ProjectSchedule, from: string, to: string): string[] {
  if (project.date_mode === "days") {
    return [...new Set(project.specific_dates)].filter((date) => date >= from && date <= to).sort();
  }
  const first = project.start_date ?? project.end_date;
  if (!first) return [];
  const last = project.end_date ?? first;
  const dates: string[] = [];
  const cursor = new Date(`${first < from ? from : first}T00:00:00Z`);
  const limit = last < to ? last : to;
  while (cursor.toISOString().slice(0, 10) <= limit) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}