export interface ActionState {
  success: boolean;
  error: string | null;
}

export const initialActionState: ActionState = { success: false, error: null };
