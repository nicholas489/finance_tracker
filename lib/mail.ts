import "server-only";

// No email provider is wired up yet. In development the reset link is printed
// to the server console so the flow can be tested end to end. To send real
// email, replace the body of this function with a call to your provider
// (e.g. Resend, SendGrid, or SMTP via nodemailer).
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[mail] Password reset for ${to}:\n  ${resetUrl}\n`);
    return;
  }
  console.error(`[mail] No email provider configured; reset email to ${to} was not sent.`);
}
