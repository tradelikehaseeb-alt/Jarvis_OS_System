/**
 * @deprecated Phase 15 — use {@link FileTaskStore} and {@link TaskStoreFactory} from `../storage`.
 */
export { FileTaskStore as PersistentTaskExecutionStore } from "../storage/file-task-store";
export {
  getSharedTaskStore,
  resetSharedTaskStore,
} from "../storage/task-store-factory";
