export {
  executeCreateTask,
  DEFAULT_API_USER_ID,
  type CreateTaskExecutionInput,
  type CreateTaskExecutionOptions,
  type CreateTaskExecutionResult,
} from "./create-task-executor";
export {
  getDefaultTaskExecutionQueue,
  shouldExecuteTaskSynchronously,
  TaskExecutionQueue,
} from "./task-execution-queue";
export {
  enforceAutomationTerminalConfirmation,
  hasAutomationTerminalConfirmation,
  isConversationalPlanningFiller,
  requiresAutomationTerminalConfirmation,
} from "./automation-terminal-confirmation";
export { extractSkillOutput } from "./extract-skill-output";

/** @deprecated Use `../storage` — re-exported for Phase 14 compatibility */
export {
  TaskExecutionStore,
  type TaskExecutionRecord,
} from "./task-execution-store";
/** @deprecated Use `../storage` — re-exported for Phase 14 compatibility */
export {
  PersistentTaskExecutionStore,
  getSharedTaskStore,
} from "./persistent-task-store";
