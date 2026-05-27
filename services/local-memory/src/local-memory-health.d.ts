/**
 * Local memory runtime health snapshot (Phase 62).
 */
export interface LocalMemoryHealth {
    readonly status: "healthy" | "degraded" | "unavailable";
    readonly backend: "memory" | "file" | "sqlite-ready";
    readonly recordCount: number;
    readonly message: string;
    readonly checkedAt: string;
    readonly filePath?: string;
}
//# sourceMappingURL=local-memory-health.d.ts.map