import "server-only";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

// Case, surrounding spaces and repeated spaces don't count, so "Sarah" and
// " sarah " are the same answer.
export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/\s+/g, " ").toLowerCase();
}

// Hashed like a password, so a leaked database doesn't reveal answers.
export async function setSecurityQuestion(userId: number, question: string, answer: string) {
  const answerHash = await hashPassword(normalizeAnswer(answer));
  await sql`
    UPDATE users
       SET security_question = ${question}, security_answer_hash = ${answerHash}
     WHERE id = ${userId}
  `;
}

export type SecurityQuestionRecord = {
  id: number;
  question: string | null;
  answerHash: string | null;
};

// Null if no account has this email. question and answerHash are null if the
// account hasn't set up a security question yet.
export async function findSecurityQuestion(email: string): Promise<SecurityQuestionRecord | null> {
  const [row] = await sql<
    { id: number; security_question: string | null; security_answer_hash: string | null }[]
  >`
    SELECT id, security_question, security_answer_hash FROM users WHERE email = ${email}
  `;
  if (!row) return null;
  return { id: row.id, question: row.security_question, answerHash: row.security_answer_hash };
}
