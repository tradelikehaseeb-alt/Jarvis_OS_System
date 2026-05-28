# UI Screenshots & GIFs

Reference paths for Jarvis desktop UI assets. Capture after Phase 89–92 command center and voice-native polish.

> Assets are not committed by default — add PNG/GIF files here when capturing for docs or marketing.

## Recommended captures

| File | Scene | Notes |
|------|-------|-------|
| `command-center-idle.png` | Chat / command center at rest | Minimal sidebar, floating input |
| `command-center-executing.png` | Task in progress | Live execution panel, activity stream |
| `voice-native-listening.gif` | Voice-native listening | `LiveSpeechOrb` waveform + partial transcript |
| `voice-native-speaking.gif` | Assistant speaking | Overlay with progressive streaming text |
| `voice-interrupt.png` | Interrupt controller visible | Barge-in during TTS |
| `provider-settings.png` | Settings → Providers | Provider cards, model selector |
| `hermes-plan-collapsed.png` | Planning details collapsed | User-facing "Understanding request…" copy |
| `hermes-plan-expanded.png` | Planning details expanded | Goal + steps (Hermes badge in dev detail only) |

## How to capture

1. Run desktop: `npm run dev --workspace=@jarvis/desktop`
2. Ensure API gateway is up (`local_bridge`) for live execution shots
3. For voice GIFs: enable mic permission or use mock capture (`useRealMicrophone: false`)
4. Export at 1280×800 or native window size; dark theme preferred

## Referencing in docs

```markdown
![Voice-native listening](./screenshots/voice-native-listening.gif)
```

Update this table when UI layout changes (check phase READMEs 89–92).
