import { describe, expect, it } from "vitest";

import { classifyChatIntent } from "../intent-classifier";
import { buildTaskIntentFromClassification } from "../map-intent-to-task";

describe("buildTaskIntentFromClassification", () => {
  it("maps search intent to API research kind", () => {
    const classification = classifyChatIntent("Search for docs");
    const intent = buildTaskIntentFromClassification("Search for docs", classification);

    expect(intent.kind).toBe("research");
    expect(intent.parameters?.classifiedIntent).toBe("search");
  });

  it("maps plan intent to API plan kind", () => {
    const classification = classifyChatIntent("Plan my week");
    const intent = buildTaskIntentFromClassification("Plan my week", classification);

    expect(intent.kind).toBe("plan");
    expect(intent.description).toBe("Plan my week");
  });
});
