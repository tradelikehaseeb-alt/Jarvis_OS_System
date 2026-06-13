import { describe, expect, it, vi, afterEach } from "vitest";

import {
  HermesAdapterPython,
  buildExecutionScriptContext,
  extractPythonScriptBlocks,
  stripAutomationConversationalFiller,
} from "../hermes-adapter-python";
import type { HermesRequest } from "../../../src/hermes-request";

const sampleRequest: HermesRequest = {
  requestId: "req-py-1",
  taskId: "task-py-1",
  userId: "user-1",
  intent: { kind: "research", description: "Summarize Jarvis OS architecture" },
  contextRef: "ctx-1",
};

describe("HermesAdapterPython", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns failure when agent root is missing", async () => {
    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "",
    });

    const response = await adapter.invoke(sampleRequest);
    expect(response.success).toBe(false);
    expect(response.stub).toBe(false);
    expect(response.error?.code).toBe("HERMES_AGENT_PATH_MISSING");
  });

  it("returns failure when LLM credentials are missing", async () => {
    const adapter = new HermesAdapterPython({
      env: {},
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke(sampleRequest);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("LLM_CREDENTIALS_MISSING");
  });

  it("uses fast Groq path for hello via adapter (no subprocess)", async () => {
    const runner = await import("../hermes-python-process-runner");
    const spawnSpy = vi.spyOn(runner, "runHermesAgentProcess");
    const groq = await import("../hermes-groq-conversational");
    vi.spyOn(groq, "invokeHermesGroqConversational").mockResolvedValue({
      success: true,
      adapterId: "hermes-adapter-python",
      stub: false,
      plan: {
        goal: "hello",
        steps: ["Hello! How can I help you today?"],
        intentKind: "default",
        summary: "Hello! How can I help you today?",
        executionMode: "fast",
      },
      reasoning: {
        summary: "Hello! How can I help you today?",
        confidence: 0.9,
      },
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: { kind: "default", description: "hello" },
    });

    expect(response.success).toBe(true);
    expect(response.plan.executionMode).toBe("fast");
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("uses fast Groq path for default chat intents (no subprocess)", async () => {
    const runner = await import("../hermes-python-process-runner");
    const spawnSpy = vi.spyOn(runner, "runHermesAgentProcess");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [
            { message: { content: "Hello! How can I help you today?" } },
          ],
        }),
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const groq = await import("../hermes-groq-conversational");
    const response = await groq.invokeHermesGroqConversational(
      {
        ...sampleRequest,
        intent: { kind: "default", description: "hello" },
      },
      {
        adapterId: adapter.adapterId,
        env: { GROQ_API_KEY: "test-key", JARVIS_USER_DISPLAY_NAME: "Haseeb" },
        fetchFn: fetchSpy,
      },
    );

    expect(response.success).toBe(true);
    expect(response.plan.summary).toBe("Hello! How can I help you today?");
    expect(spawnSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("uses skills subprocess for price search queries", async () => {
    const runner = await import("../hermes-python-process-runner");
    const spawnSpy = vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse: "iPhone 17 starts around PKR 450,000 on official Apple resellers.",
      stdout: "FINAL RESPONSE:\niPhone 17 starts around PKR 450,000",
      stderr: "",
      exitCode: 0,
      skillCategory: "search",
      userStatusMessage: "Jarvis is searching...",
    });
    const groq = await import("../hermes-groq-conversational");
    const groqSpy = vi.spyOn(groq, "invokeHermesGroqConversational");

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: {
        kind: "default",
        description: "iPhone 17 price Pakistan mein",
      },
    });

    expect(response.success).toBe(true);
    expect(response.plan.executionMode).toBe("skills");
    expect(spawnSpy).toHaveBeenCalled();
    expect(groqSpy).not.toHaveBeenCalled();
    expect(response.plan.summary).toContain("iPhone 17");
  });

  it("maps parsed FINAL RESPONSE into a real plan", async () => {
    const runner = await import("../hermes-python-process-runner");
    vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse: "1. Analyze repo\n2. Draft plan",
      stdout: "FINAL RESPONSE:\n1. Analyze repo\n2. Draft plan",
      stderr: "",
      exitCode: 0,
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: {
        kind: "research",
        description: "search latest AI news and summarize findings",
      },
    });
    expect(response.success).toBe(true);
    expect(response.stub).toBe(false);
    expect(response.plan.executionMode).toBe("skills");
    expect(response.plan.steps.length).toBeGreaterThan(0);
    expect(response.reasoning.confidence).toBeGreaterThan(0.8);
  });

  it("retries skills subprocess with Gemini when Groq rate limits", async () => {
    const runner = await import("../hermes-python-process-runner");
    const geminiSkills = await import("../hermes-gemini-skills");
    const groq = await import("../hermes-groq-conversational");
    const gemini = await import("../hermes-gemini-conversational");

    const runSpy = vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: false,
      finalResponse: "",
      stdout: "rate limit reached HTTP 429",
      stderr: "429 Too Many Requests",
      exitCode: 1,
      errorCode: "HERMES_FINAL_RESPONSE_MISSING",
    });
    const geminiRetrySpy = vi
      .spyOn(geminiSkills, "runHermesAgentProcessWithGemini")
      .mockResolvedValue({
        success: true,
        finalResponse: "Gemini skills result with tools",
        stdout: "FINAL RESPONSE:\nGemini skills result with tools",
        stderr: "",
        exitCode: 0,
      });
    const groqSpy = vi.spyOn(groq, "invokeHermesGroqConversational");
    const geminiChatSpy = vi.spyOn(gemini, "invokeHermesGeminiConversational");

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key", GEMINI_API_KEY: "gem-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: {
        kind: "research",
        description: "search latest AI news and summarize findings",
      },
    });

    expect(runSpy).toHaveBeenCalled();
    expect(geminiRetrySpy).toHaveBeenCalled();
    expect(groqSpy).not.toHaveBeenCalled();
    expect(geminiChatSpy).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(response.plan.executionMode).toBe("skills");
    expect(response.plan.summary).toContain("Gemini skills result");
  });

  it("uses skills subprocess for yes kro after pending automation plan", async () => {
    const runner = await import("../hermes-python-process-runner");
    const spawnSpy = vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse: '{"success": true, "exit_code": 0, "message": "Folder successfully created"}',
      stdout:
        'FINAL RESPONSE:\n{"success": true, "exit_code": 0, "message": "Folder successfully created"}',
      stderr: "",
      exitCode: 0,
      skillCategory: "automate",
      userStatusMessage: "Jarvis is automating your desktop...",
    });
    const groq = await import("../hermes-groq-conversational");
    const groqSpy = vi.spyOn(groq, "invokeHermesGroqConversational");

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: { kind: "automate", description: "yes kro" },
      conversationTurns: [
        { role: "user", message: "create folder TestJarvis on desktop" },
        {
          role: "assistant",
          message:
            "Plan: ```python\nimport os\nos.makedirs('TestJarvis')\nprint('Folder created')\n``` Proceed?",
        },
        { role: "user", message: "yes kro" },
      ],
    });

    expect(response.success).toBe(true);
    expect(response.plan.executionMode).toBe("skills");
    expect(spawnSpy).toHaveBeenCalled();
    expect(groqSpy).not.toHaveBeenCalled();
    const spawnArgs = spawnSpy.mock.calls[0]?.[0];
    expect(spawnArgs?.enabledToolsets).toBe("safe,windows_automation,file");
    expect(spawnArgs?.query).toContain("[JARVIS_EXECUTION_TOKEN_ACTIVE]");
    expect(spawnArgs?.query).toContain("execute_dynamic_windows_script");
    expect(spawnArgs?.query).toContain("CRITICAL EXECUTION PROTOCOL");
    expect(spawnArgs?.query).toContain("import os");
    expect(spawnArgs?.query).not.toContain("Proceed?");
    expect(response.plan.summary).toContain("Folder successfully created");
  });

  it("strips conversational filler from shutdown confirmation context", async () => {
    const runner = await import("../hermes-python-process-runner");
    const spawnSpy = vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse: '{"success": true, "exit_code": 0, "message": "Shutdown initiated"}',
      stdout: 'FINAL RESPONSE:\nShutdown initiated',
      stderr: "",
      exitCode: 0,
      skillCategory: "automate",
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    await adapter.invoke({
      ...sampleRequest,
      intent: { kind: "automate", description: "yes kro" },
      conversationTurns: [
        { role: "user", message: "system shutdown karo" },
        {
          role: "assistant",
          message:
            "Main system ko shutdown karunga. Yeh raha Python script:\n```python\nimport subprocess\nsubprocess.run(['shutdown', '/s', '/t', '1'])\nprint('Shutdown initiated')\n```\nProceed?",
        },
        { role: "user", message: "yes kro" },
      ],
    });

    const spawnArgs = spawnSpy.mock.calls[0]?.[0];
    const query = spawnArgs?.query ?? "";
    expect(query).toContain("shutdown");
    expect(query).toContain("Extracted python_code");
    expect(query).not.toMatch(/Main system ko shutdown/i);
    expect(query).not.toMatch(/Yeh raha Python script/i);
    expect(query).not.toContain("Proceed?");
  });

  it("rejects raw python display after confirmed automation", async () => {
    const runner = await import("../hermes-python-process-runner");
    vi.spyOn(runner, "runHermesAgentProcess").mockResolvedValue({
      success: true,
      finalResponse:
        "```python\nimport os\nos.makedirs('TestJarvis')\nprint('Folder created')\n```",
      stdout: "FINAL RESPONSE:\n```python\nimport os\n```",
      stderr: "",
      exitCode: 0,
      skillCategory: "automate",
    });

    const adapter = new HermesAdapterPython({
      env: { GROQ_API_KEY: "test-key" },
      agentRoot: "C:\\hermes-agent",
    });

    const response = await adapter.invoke({
      ...sampleRequest,
      intent: { kind: "automate", description: "yes kro" },
      conversationTurns: [
        { role: "user", message: "create folder TestJarvis" },
        {
          role: "assistant",
          message: "Here is the script ```python\nimport os\n``` Proceed?",
        },
      ],
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("AUTOMATION_SCRIPT_NOT_EXECUTED");
  });
});

describe("automation execution context sanitizers", () => {
  it("extracts python from fenced blocks", () => {
    const blocks = extractPythonScriptBlocks(
      "Plan:\n```python\nimport os\nos.makedirs('x')\n```",
    );
    expect(blocks).toEqual(["import os\nos.makedirs('x')"]);
  });

  it("strips Urdu/English conversational filler around scripts", () => {
    const cleaned = stripAutomationConversationalFiller(
      "Main system ko shutdown karunga. Yeh raha Python script:\nimport subprocess\nsubprocess.run(['shutdown', '/s', '/t', '1'])",
    );
    expect(cleaned).toContain("import subprocess");
    expect(cleaned).not.toMatch(/Main system/i);
    expect(cleaned).not.toMatch(/Yeh raha/i);
  });

  it("builds script-only execution context for confirmed automation", () => {
    const context = buildExecutionScriptContext([
      { role: "user", message: "folder banao TestJarvis" },
      {
        role: "assistant",
        message:
          "Main ab folder banata hun. Yeh script:\n```python\nimport os\nos.makedirs('TestJarvis')\nprint('Folder created')\n```",
      },
      { role: "user", message: "yes kro" },
    ]);
    expect(context).toContain("Original user intent: folder banao TestJarvis");
    expect(context).toContain("Extracted python_code");
    expect(context).toContain("import os");
    expect(context).not.toMatch(/Main ab folder/i);
  });
});
