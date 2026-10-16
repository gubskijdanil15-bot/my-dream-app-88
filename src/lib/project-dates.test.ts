import { test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { addProjectDate, removeProjectDate, projectCalendarDates, type ProjectSchedule } from "./project-dates";

const schedule: ProjectSchedule = { date_mode: "range", start_date: "2026-10-20", end_date: "2026-10-22", specific_dates: ["2026-10-24", "2026-10-20"] };
test("specific days can be added without duplicate dates", () => {
  deepStrictEqual(addProjectDate(["2026-10-24"], "2026-10-20"), ["2026-10-20", "2026-10-24"]);
  deepStrictEqual(addProjectDate(["2026-10-20"], "2026-10-20"), ["2026-10-20"]);
});
test("removing a specific date leaves the other dates unchanged", () => {
  deepStrictEqual(removeProjectDate(schedule.specific_dates, "2026-10-20"), ["2026-10-24"]);
});
test("range mode schedules both endpoints and the days between them", () => {
  deepStrictEqual(projectCalendarDates(schedule, "2026-10-01", "2026-10-31"), ["2026-10-20", "2026-10-21", "2026-10-22"]);
});
test("specific-days mode schedules only the chosen days, ignoring the range", () => {
  deepStrictEqual(projectCalendarDates({ ...schedule, date_mode: "days" }, "2026-10-01", "2026-10-31"), ["2026-10-20", "2026-10-24"]);
});
test("clearing the active schedule removes its calendar events", () => {
  deepStrictEqual(projectCalendarDates({ ...schedule, start_date: null, end_date: null }, "2026-10-01", "2026-10-31"), []);
  deepStrictEqual(projectCalendarDates({ ...schedule, date_mode: "days", specific_dates: [] }, "2026-10-01", "2026-10-31"), []);
});
test("ranges are clipped to the visible month", () => {
  deepStrictEqual(projectCalendarDates({ ...schedule, start_date: "2026-09-29", end_date: "2026-10-02" }, "2026-10-01", "2026-10-31"), ["2026-10-01", "2026-10-02"]);
});