// Real outbound email via AgentMail (agentmail.to) — the agent owns an inbox and
// actually delivers the chase message. Fire-and-forget: a mail failure never
// breaks the invoice flow.

const BASE = "https://api.agentmail.to/v0";

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.AGENTMAIL_API_KEY;
  const inbox = process.env.AGENTMAIL_INBOX_ID;
  if (!key || !inbox || !to || !to.includes("@")) return false;
  try {
    const res = await fetch(`${BASE}/inboxes/${encodeURIComponent(inbox)}/messages/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
