/**
 * Single step within an orchestrated workflow.
 */
export interface WorkflowStep {
  readonly stepId: string;
  /** Zero-based execution order within the workflow. */
  readonly order: number;
  /** Human-readable step label. */
  readonly name: string;
  /** Assigned agent when step requires reasoning or execution. */
  readonly agentId?: string;
  /** Skill identifier when step invokes a skill directly. */
  readonly skillId?: string;
  /** Step IDs that must complete before this step runs. */
  readonly dependsOn?: readonly string[];
  /** Step-level configuration (sandbox, permissions — Phase 4+). */
  readonly config?: Readonly<Record<string, unknown>>;
}
