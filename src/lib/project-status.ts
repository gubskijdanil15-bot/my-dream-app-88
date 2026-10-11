type ProjectStatus = "active" | "completed";

export function completionPatch(status: ProjectStatus, now = new Date()) {
  return { status, completed_at: status === "completed" ? now.toISOString() : null };
}

export function filterProjects<T extends { status: ProjectStatus; completed_at: string | null }>(
  projects: T[], status: ProjectStatus,
): T[] {
  const filtered = projects.filter((project) => project.status === status);
  return status === "completed"
    ? filtered.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    : filtered;
}