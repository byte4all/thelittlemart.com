import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

function getTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured");
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? "587");
    const secure =
      process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
    });
  }
  return transporter;
}

export function getOrderMailFrom(): string {
  return (
    process.env.ORDER_MAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    `thelittlemart <${process.env.SMTP_USER?.trim() ?? "noreply@localhost"}>`
  );
}

export function getOrderMailReplyTo(): string | undefined {
  const value =
    process.env.ORDER_MAIL_REPLY_TO?.trim() ||
    process.env.SMTP_REPLY_TO?.trim();
  return value || undefined;
}

export async function sendSmtpEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  }

  const normalizedTo = params.to?.trim().toLowerCase();
  if (!normalizedTo || normalizedTo.endsWith("@user.local")) {
    return { ok: true };
  }

  try {
    const replyTo = getOrderMailReplyTo();
    await getTransporter().sendMail({
      from: getOrderMailFrom(),
      to: normalizedTo,
      subject: params.subject,
      html: params.html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    console.error("SMTP send error:", err);
    return { ok: false, error: message };
  }
}
