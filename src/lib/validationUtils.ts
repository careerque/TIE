/**
 * Password validation utilities enforcing enterprise password policies:
 * - At least 8 characters in length
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePasswordStrength(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Please enter a password." };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters in length." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number (0-9)." };
  }
  return { isValid: true };
}
