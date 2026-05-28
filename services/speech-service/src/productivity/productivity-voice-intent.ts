export interface ProductivityVoiceIntent {
  readonly productivity: boolean;
  readonly followUpLikely: boolean;
  readonly userLabel: string;
}

const PRODUCTIVITY_VOICE_PATTERN =
  /\b(email|inbox|organize|priorit|schedule|meeting|remember|brief|research|workspace|summarize|my day)\b/i;

/**
 * Maps voice transcripts to productivity workflow intents (Phase 98).
 */
export function mapVoiceTranscriptToProductivityIntent(
  transcript: string,
): ProductivityVoiceIntent {
  const productivity = PRODUCTIVITY_VOICE_PATTERN.test(transcript);
  const followUpLikely =
    productivity &&
    /\b(and|then|also|after)\b/i.test(transcript);

  let userLabel = "Working…";
  if (/\b(email|inbox|unread)\b/i.test(transcript)) {
    userLabel = "Reviewing emails…";
  } else if (/\b(research|brief|news)\b/i.test(transcript)) {
    userLabel = "Researching…";
  } else if (/\b(organize|priorit|tasks?)\b/i.test(transcript)) {
    userLabel = "Organizing priorities…";
  } else if (/\b(meeting|schedule)\b/i.test(transcript)) {
    userLabel = "Scheduling…";
  } else if (/\bremember\b/i.test(transcript)) {
    userLabel = "Saving preference…";
  }

  return { productivity, followUpLikely, userLabel };
}
