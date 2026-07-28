export interface CustomerActionState {
  errors?: Record<string, string[]>;
  message?: string;
  status?: "conflict" | "error" | "success";
}

export const initialCustomerActionState: CustomerActionState = {};
