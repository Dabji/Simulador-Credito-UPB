// ============================================================
// EmailService — Envío de correos con Nodemailer + Brevo SMTP
// Requiere las variables SMTP_HOST, SMTP_USER, SMTP_PASS y
// SMTP_FROM_EMAIL configuradas en el .env.
// ============================================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../logger';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM_EMAIL) {
      throw new Error(
        'EmailService: faltan variables SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL). '
        + 'Revisa el archivo .env.',
      );
    }

    logger.info('EmailService: usando SMTP configurado', { host: env.SMTP_HOST });

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT ?? '587'),
      secure: Number(env.SMTP_PORT ?? '587') === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Envía el correo de recuperación de contraseña con un enlace tokenizado.
   * No incluye información sensible del usuario (solo el enlace con token).
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const info = await this.transporter.sendMail({
      from: `"Simulador UPB" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject: 'Recuperación de contraseña — Simulador Crédito UPB',
      text: [
        'Simulador de Crédito UPB',
        '',
        'Solicitud de restablecimiento de contraseña',
        '',
        'Hola,',
        '',
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Simulador de Crédito UPB.',
        '',
        `Para crear una nueva contraseña, visita el siguiente enlace: ${resetUrl}`,
        '',
        'Este enlace es válido por 1 hora. Después de ese tiempo, deberás solicitar uno nuevo.',
        '',
        'Si no realizaste esta solicitud, puedes ignorar este correo con total seguridad. Tu contraseña no será modificada.',
        '',
        '— Equipo Simulador de Crédito UPB',
        'Universidad Pontificia Bolivariana',
      ].join('\n'),
      html: this.buildResetEmailHtml(resetUrl),
    });

    logger.info('Correo de recuperación enviado', { to, messageId: info.messageId });
  }

  private buildResetEmailHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Recuperación de Contraseña</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- UPB Shield icon -->
                    <div style="width:56px;height:56px;background-color:rgba(255,255,255,0.12);border-radius:50%;margin:0 auto 16px;line-height:56px;font-size:28px;text-align:center;">
                      &#x1f3db;
                    </div>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                      Simulador de Cr&#233;dito UPB
                    </h1>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);font-weight:400;">
                      Universidad Pontificia Bolivariana
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1a2e;">
                Restablecimiento de contrase&#241;a
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#555b6e;line-height:1.6;">
                Recibimos una solicitud para restablecer la contrase&#241;a asociada a tu cuenta.
                Haz clic en el bot&#243;n de abajo para crear una nueva contrase&#241;a.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="#6E11B0" fillcolor="#6E11B0">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:'Segoe UI',sans-serif;font-size:15px;font-weight:bold;">Restablecer Contrase&#241;a</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetUrl}"
                       target="_blank"
                       style="display:inline-block;background-color:#6E11B0;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:28px;letter-spacing:0.3px;mso-hide:all;">
                      Restablecer Contrase&#241;a
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-size:12px;color:#888e9b;">
                Si el bot&#243;n no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#6E11B0;text-decoration:underline;">${resetUrl}</a>
              </p>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e8e9ec;padding-top:20px;">
                    <!-- Expiry notice -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="24" valign="top" style="padding-right:10px;font-size:16px;">&#x23f1;</td>
                        <td>
                          <p style="margin:0;font-size:13px;color:#555b6e;line-height:1.5;">
                            Este enlace es v&#225;lido por <strong>1 hora</strong>. Despu&#233;s de ese tiempo, deber&#225;s solicitar uno nuevo.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9f0;border-left:3px solid #e8a838;border-radius:0 6px 6px 0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#7a6841;line-height:1.5;">
                      <strong>&#x26a0; Aviso de seguridad:</strong> Si no solicitaste este cambio, ignora este correo.
                      Tu contrase&#241;a no ser&#225; modificada y tu cuenta permanece segura.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e8e9ec;">
              <p style="margin:0 0 4px;font-size:12px;color:#888e9b;">
                &#169; ${new Date().getFullYear()} Universidad Pontificia Bolivariana
              </p>
              <p style="margin:0;font-size:11px;color:#aab0bc;">
                Este es un correo autom&#225;tico. Por favor no respondas a este mensaje.
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
}
