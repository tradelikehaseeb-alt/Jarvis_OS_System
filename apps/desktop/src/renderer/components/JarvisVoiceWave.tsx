/** Animated frequency bars for Jarvis loading / voice response HUD. */
export function JarvisVoiceWave({ testId = "jarvis-voice-wave" }: { readonly testId?: string }) {
  return (
    <div className="jarvis-voice-wave" data-testid={testId} aria-hidden>
      <span className="jarvis-voice-wave__bar" />
      <span className="jarvis-voice-wave__bar" />
      <span className="jarvis-voice-wave__bar" />
      <span className="jarvis-voice-wave__bar" />
      <span className="jarvis-voice-wave__bar" />
      <span className="jarvis-voice-wave__track" />
    </div>
  );
}
