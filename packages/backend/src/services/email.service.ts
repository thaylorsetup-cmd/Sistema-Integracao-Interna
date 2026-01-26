/**
 * Servico de Email
 * Envio de codigos de verificacao via SMTP
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Envia codigo de verificacao por email
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const mail = getTransporter();

    await mail.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `${code} - Codigo de acesso BBT Connect`,
      html: buildEmailTemplate(code),
      text: `Seu codigo de acesso ao BBT Connect e: ${code}\n\nEste codigo expira em 5 minutos.\n\nSe voce nao solicitou este codigo, ignore este email.`,
    });

    logger.info(`Codigo de verificacao enviado para ${email}`);
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar email para ${email}:`, error);
    return false;
  }
}

function buildEmailTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:12px;border-radius:12px;margin-bottom:16px;">
                <span style="font-size:24px;color:#fff;font-weight:bold;">BBT</span>
              </div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">BBT Connect</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Sistema de Gestao</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="color:#cbd5e1;font-size:15px;line-height:1.5;margin:0 0 24px;text-align:center;">
                Use o codigo abaixo para acessar o sistema:
              </p>
              <!-- Code Box -->
              <div style="background-color:#0f172a;border:2px solid #2563eb;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#fff;font-family:'Courier New',monospace;">${code}</span>
              </div>
              <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;text-align:center;">
                Este codigo expira em <strong style="color:#94a3b8;">5 minutos</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;line-height:1.5;">
                Se voce nao solicitou este codigo, ignore este email.
              </p>
              <p style="color:#334155;font-size:11px;margin:8px 0 0;">
                BBT Connect &copy; ${new Date().getFullYear()}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
