export interface BatchAuditState {
  success: boolean;
  error: string | null;
  message: string | null;
}

export const initialBatchAuditState: BatchAuditState = {
  success: false,
  error: null,
  message: null,
};
