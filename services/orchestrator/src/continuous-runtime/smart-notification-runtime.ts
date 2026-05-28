export type NotificationKind = "alert" | "summary" | "reminder" | "completion";

export interface SmartNotification {
  readonly notificationId: string;
  readonly kind: NotificationKind;
  readonly message: string;
  readonly userLabel: string;
  readonly throttled: boolean;
  readonly timestamp: string;
}

const THROTTLE_MS = 30_000;

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Smart notifications with throttling for low-noise proactive assistance (Phase 99).
 */
export class SmartNotificationRuntime {
  private readonly sentAt = new Map<string, number>();

  notify(
    kind: NotificationKind,
    message: string,
    userLabel: string,
    throttleKey?: string,
  ): SmartNotification {
    const key = throttleKey ?? kind;
    const lastSent = this.sentAt.get(key) ?? 0;
    const throttled = Date.now() - lastSent < THROTTLE_MS;

    if (!throttled) {
      this.sentAt.set(key, Date.now());
    }

    return {
      notificationId: nextId("notify"),
      kind,
      message,
      userLabel,
      throttled,
      timestamp: nowIso(),
    };
  }

  buildForWorkflow(
    kind: "monitor" | "watch" | "remind" | "background" | "scheduled-briefing",
    success: boolean,
  ): SmartNotification {
    if (kind === "monitor") {
      return this.notify(
        "alert",
        success ? "Market monitoring active." : "Monitoring paused.",
        success ? "Monitoring…" : "Monitoring paused",
        "monitor",
      );
    }
    if (kind === "watch") {
      return this.notify(
        "summary",
        success ? "Watching for important updates." : "Watch stopped.",
        "Watching for updates…",
        "watch",
      );
    }
    if (kind === "remind") {
      return this.notify(
        "reminder",
        success ? "Reminder set." : "Reminder failed.",
        "Reminder set…",
        "remind",
      );
    }
    if (kind === "scheduled-briefing") {
      return this.notify(
        "summary",
        success ? "Daily briefing scheduled." : "Briefing scheduling failed.",
        "Preparing briefing…",
        "briefing",
      );
    }
    return this.notify(
      "completion",
      success ? "Background workflow running." : "Background workflow stopped.",
      "Running in background…",
      "background",
    );
  }

  clearThrottle(key: string): void {
    this.sentAt.delete(key);
  }
}

export function createDefaultSmartNotificationRuntime(): SmartNotificationRuntime {
  return new SmartNotificationRuntime();
}
