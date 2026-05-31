import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  loadDashboardData,
  loadMemoryFacts,
  loadRecentTasks,
  loadUserProfile,
} from "../data-loaders";
import { MOCK_MEMORY, MOCK_TASKS } from "../mock-data";

describe("data loaders", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it("loads dashboard mock data in test", async () => {
    const dashboard = await loadDashboardData();
    expect(dashboard.status).toBe("ok");
    expect(dashboard.factsCount).toBe(MOCK_MEMORY.length);
  });

  it("loads memory facts mock rows in test", async () => {
    const facts = await loadMemoryFacts();
    expect(facts).toEqual(MOCK_MEMORY);
  });

  it("loads recent tasks mock rows in test", async () => {
    const tasks = await loadRecentTasks();
    expect(tasks).toEqual(MOCK_TASKS);
  });

  it("loads user profile from mock facts in test", async () => {
    const profile = await loadUserProfile();
    expect(profile.facts.length).toBe(MOCK_MEMORY.length);
  });
});
