// The questions a user can pick from. Shared by the setup form and the server
// action that validates it. Changing a question's wording here won't break
// existing accounts: each user's chosen question is stored as text.
export const SECURITY_QUESTIONS = [
  "What is the first name of your most elder cousin?",
  "What was the name of your first pet?",
  "What was the name of the street you grew up on?",
  "In what city did your parents meet?",
  "What is the first name of your childhood best friend?",
  "What was the make of your first car?",
] as const;

export function isSecurityQuestion(question: string) {
  return (SECURITY_QUESTIONS as readonly string[]).includes(question);
}
