import { describe, expect, it } from "vitest";

import { createDefaultBrowserActionPipeline } from "../create-default-browser-action-pipeline";

const baseRequest = {
  taskId: "task-pipeline-1",
  requestId: "req-pipeline-1",
  stub: true,
};

describe("BrowserActionPipeline", () => {
  const pipeline = createDefaultBrowserActionPipeline();

  it("validates supported stub actions", async () => {
    const validation = await pipeline.validateAction({
      ...baseRequest,
      action: "open-page",
      url: "https://stub.local/page",
    });

    expect(validation.valid).toBe(true);
    expect(validation.action).toBe("open-page");
  });

  it("rejects invalid action requests", async () => {
    const validation = await pipeline.validateAction({
      ...baseRequest,
      action: "click-element",
    });

    expect(validation.valid).toBe(false);
    expect(validation.message).toContain("selector");
  });

  it("executes open-page stub action", async () => {
    const result = await pipeline.executeAction({
      ...baseRequest,
      action: "open-page",
      url: "https://stub.local/page",
    });

    expect(result.success).toBe(true);
    expect(result.stub).toBe(true);
    expect(result.message).toContain("stub-executed");
  });

  it("executes click-element, type-text, and extract-content stubs", async () => {
    const click = await pipeline.executeAction({
      ...baseRequest,
      action: "click-element",
      selector: "#submit",
    });
    expect(click.success).toBe(true);

    const type = await pipeline.executeAction({
      ...baseRequest,
      action: "type-text",
      selector: "#search",
      text: "jarvis",
    });
    expect(type.success).toBe(true);

    const extract = await pipeline.executeAction({
      ...baseRequest,
      action: "extract-content",
      selector: "#main",
    });
    expect(extract.success).toBe(true);
    expect(extract.extractedContent).toContain("[stub-content:");
  });

  it("executes multi-action pipeline sequentially", async () => {
    const pipelineResult = await pipeline.executePipeline([
      {
        ...baseRequest,
        action: "open-page",
        url: "https://stub.local/dashboard",
      },
      {
        ...baseRequest,
        action: "click-element",
        selector: "#login",
      },
      {
        ...baseRequest,
        action: "type-text",
        selector: "#email",
        text: "user@stub.local",
      },
      {
        ...baseRequest,
        action: "extract-content",
        selector: "#status",
      },
    ]);

    expect(pipelineResult.success).toBe(true);
    expect(pipelineResult.results).toHaveLength(4);
    expect(pipelineResult.message).toContain("stub-executed");
  });

  it("stops pipeline on first failed action", async () => {
    const pipelineResult = await pipeline.executePipeline([
      {
        ...baseRequest,
        action: "open-page",
        url: "https://stub.local/page",
      },
      {
        ...baseRequest,
        action: "click-element",
      },
    ]);

    expect(pipelineResult.success).toBe(false);
    expect(pipelineResult.results).toHaveLength(2);
  });
});
