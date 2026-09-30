export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        question?: string[];
        answer?: string[];
        confirmAnswer?: string[];
      };
      // Form-level error, shown above the fields.
      message?: string;
      // Form-level success notice.
      notice?: string;
      // Echoed back so the form keeps what the user typed after an error.
      values?: { name?: string; email?: string; question?: string };
      // Forgot password: set once the email is found, to show its security question.
      step?: "answer";
      question?: string;
    }
  | undefined;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
