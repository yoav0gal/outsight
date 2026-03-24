export const PATIENT_PASSWORD_MIN_LENGTH = process.env.NODE_ENV === "production" ? 8 : 4;

export function isValidPassword(password: string) {
  return password.length >= PATIENT_PASSWORD_MIN_LENGTH;
}
