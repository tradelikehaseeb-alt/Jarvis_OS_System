export interface ContinuousVoiceIntent {
  readonly continuous: boolean;
  readonly background: boolean;
  readonly userLabel: string;
  readonly spokenNotification?: string;
}

const CONTINUOUS_VOICE_PATTERN =
  /\b(monitor|watch|alert|remind|background|continue|every morning|daily briefing|keep watching|when this task completes)\b/i;

/**
 * Maps voice transcripts to continuous runtime intents (Phase 99).
 */
export function mapVoiceTranscriptToContinuousIntent(
  transcript: string,
): ContinuousVoiceIntent {
  const continuous = CONTINUOUS_VOICE_PATTERN.test(transcript);
  const background = /\b(background|monitor|watch|continue)\b/i.test(transcript);

  let userLabel = "Working…";
  let spokenNotification: string | undefined;

  if (/\b(monitor|alert)\b/i.test(transcript)) {
    userLabel = "Monitoring…";
    spokenNotification = "I'll monitor that and alert you.";
  } else if (/\b(watch|keep watching|news)\b/i.test(transcript)) {
    userLabel = "Watching for updates…";
    spokenNotification = "I'll keep watching and summarize updates.";
  } else if (/\b(remind|when this task completes)\b/i.test(transcript)) {
    userLabel = "Reminder set…";
    spokenNotification = "I'll remind you when it's done.";
  } else if (/\b(background|continue)\b/i.test(transcript)) {
    userLabel = "Running in background…";
    spokenNotification = "Continuing in the background.";
  } else if (/\b(every morning|daily briefing)\b/i.test(transcript)) {
    userLabel = "Preparing briefing…";
    spokenNotification = "Daily briefing scheduled.";
  }

  return { continuous, background, userLabel, spokenNotification };
}
