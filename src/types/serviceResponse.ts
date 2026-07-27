export interface ServiceResponse<T> {
  success: boolean;
  data?: T | null;
  error?: { message: string } | null;
}

