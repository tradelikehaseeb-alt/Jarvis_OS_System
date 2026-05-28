export type ScheduledJobKind = "briefing" | "monitor" | "reminder";

export interface ScheduledJob {
  readonly jobId: string;
  readonly kind: ScheduledJobKind;
  readonly cronHint: string;
  readonly userLabel: string;
  readonly enabled: boolean;
}

export interface SchedulerResult {
  readonly schedulerId: string;
  readonly jobs: readonly ScheduledJob[];
  readonly nextRunHint: string;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Schedules continuous and recurring background execution (Phase 99).
 */
export class ContinuousExecutionScheduler {
  private readonly jobs = new Map<string, ScheduledJob>();

  schedule(description: string): SchedulerResult {
    const jobs: ScheduledJob[] = [];

    if (/\b(every morning|daily briefing|prepare my daily)\b/i.test(description)) {
      const job: ScheduledJob = {
        jobId: nextId("sched"),
        kind: "briefing",
        cronHint: "0 8 * * *",
        userLabel: "Preparing briefing…",
        enabled: true,
      };
      jobs.push(job);
      this.jobs.set(job.jobId, job);
    }
    if (/\b(monitor|watch|alert)\b/i.test(description)) {
      const job: ScheduledJob = {
        jobId: nextId("sched"),
        kind: "monitor",
        cronHint: "*/15 * * * *",
        userLabel: "Monitoring…",
        enabled: true,
      };
      jobs.push(job);
      this.jobs.set(job.jobId, job);
    }
    if (/\b(remind|when this task completes)\b/i.test(description)) {
      const job: ScheduledJob = {
        jobId: nextId("sched"),
        kind: "reminder",
        cronHint: "on-completion",
        userLabel: "Reminder set…",
        enabled: true,
      };
      jobs.push(job);
      this.jobs.set(job.jobId, job);
    }

    return {
      schedulerId: nextId("scheduler"),
      jobs,
      nextRunHint: jobs.length > 0 ? jobs[0]?.cronHint ?? "immediate" : "none",
    };
  }

  listEnabled(): readonly ScheduledJob[] {
    return [...this.jobs.values()].filter((job) => job.enabled);
  }

  disable(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }
    this.jobs.set(jobId, { ...job, enabled: false });
    return true;
  }
}

export function createDefaultContinuousExecutionScheduler(): ContinuousExecutionScheduler {
  return new ContinuousExecutionScheduler();
}
