export const PATIENT_PASSWORD_MIN_LENGTH = 6;

export function isValidPassword(password: string) {
  return password.length >= PATIENT_PASSWORD_MIN_LENGTH;
}
