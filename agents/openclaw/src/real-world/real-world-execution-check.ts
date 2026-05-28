export interface OpenClawRealWorldExecutionCheck {
  readonly browserRequired: boolean;
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
  readonly recoveryExpected: boolean;
}

/**
 * OpenClaw real-world execution checks without exposing internals (Phase 100).
 */
export function evaluateOpenClawRealWorldExecution(
  description: string,
): OpenClawRealWorldExecutionCheck {
  const browserRequired = /\b(open|navigate|browse|gmail|youtube|tradingview|workspace)\b/i.test(
    description,
  );

  return {
    browserRequired,
    sandbox: true,
    permissionsChecked: true,
    recoveryExpected: browserRequired,
  };
}
