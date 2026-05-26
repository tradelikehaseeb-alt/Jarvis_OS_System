import type { SpeechAction } from "./speech-action";
import type { SpeechActionRequest } from "./speech-action-request";
import type { SpeechActionResponse } from "./speech-action-response";

export type SpeechActionHandler = (
  action: SpeechAction,
  request: SpeechActionRequest,
) => SpeechActionResponse;
