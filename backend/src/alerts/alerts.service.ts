import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private buildTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  @Cron('0 8 * * *', { timeZone: 'Europe/Brussels' })
  async handleDailyAlerts() {
    this.logger.log('Cron alertes — vérification des garanties expirant bientôt…');
    await this.checkAndSendAlerts();
  }

  async checkAndSendAlerts(): Promise<{ sent: number; skipped: number }> {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      this.logger.warn('SMTP non configuré — alertes désactivées. Renseignez SMTP_* dans .env.');
      return { sent: 0, skipped: 0 };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    const { data: products, error } = await this.supabase
      .getAdminClient()
      .from('products')
      .select('*')
      .gte('warranty_end', todayStr)
      .lte('warranty_end', in30DaysStr);

    if (error) {
      this.logger.error('Erreur requête produits :', error.message);
      return { sent: 0, skipped: 0 };
    }

    if (!products?.length) {
      this.logger.log('Aucune garantie expirant dans les 30 prochains jours.');
      return { sent: 0, skipped: 0 };
    }

    let sent = 0;
    let skipped = 0;
    const cutoff = new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString();

    for (const product of products) {
      const { data: existing } = await this.supabase
        .getAdminClient()
        .from('alerts')
        .select('id')
        .eq('product_id', product.id)
        .eq('alert_type', '30_days')
        .gte('sent_at', cutoff)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const {
        data: { user },
        error: userErr,
      } = await this.supabase.getAdminClient().auth.admin.getUserById(product.user_id);

      if (userErr || !user?.email) {
        this.logger.warn(`Email introuvable pour user_id=${product.user_id}`);
        skipped++;
        continue;
      }

      try {
        await this.sendAlertEmail(user.email, product);
      } catch (err: any) {
        this.logger.error(`Échec envoi email — product ${product.id} : ${err.message}`);
        skipped++;
        continue;
      }

      await this.supabase.getAdminClient().from('alerts').insert({
        product_id: product.id,
        user_id: product.user_id,
        alert_type: '30_days',
      });

      this.logger.log(`Email envoyé à ${user.email} — "${product.name}"`);
      sent++;
    }

    this.logger.log(`Résultat : ${sent} envoyé(s), ${skipped} ignoré(s).`);
    return { sent, skipped };
  }

  private async sendAlertEmail(to: string, product: any) {
    const transporter = this.buildTransporter();
    const warrantyEnd = new Date(product.warranty_end);
    const daysLeft = Math.ceil(
      (warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const formattedDate = warrantyEnd.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const productUrl = `${process.env.FRONTEND_URL}/products/${product.id}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: `⚠️ Garantie "${product.name}" expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      html: this.buildEmailHtml(product, daysLeft, formattedDate, productUrl),
    });
  }

  private buildEmailHtml(
    product: any,
    daysLeft: number,
    formattedDate: string,
    productUrl: string,
  ): string {
    const brandLine = product.brand
      ? `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${product.brand}${product.model ? ' · ' + product.model : ''}</p>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- En-tête -->
        <tr>
          <td style="background:#2563eb;padding:20px 32px;">
            <span style="color:#fff;font-size:18px;font-weight:700;">WarrantyVault</span>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#1f2937;">Alerte de garantie</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
              La garantie de l'un de vos produits arrive bientôt à expiration.
            </p>

            <!-- Carte produit -->
            <table width="100%" cellpadding="16" cellspacing="0"
              style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.06em;">Produit</p>
                <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1f2937;">${product.name}</p>
                ${brandLine}
                <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #fde68a;margin-top:12px;">
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#6b7280;">Catégorie</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:500;color:#1f2937;text-align:right;">${product.category}</td>
                  </tr>
                  <tr style="border-top:1px solid #fde68a;">
                    <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #fde68a;">Fin de garantie</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:600;color:#d97706;text-align:right;border-top:1px solid #fde68a;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:13px;color:#6b7280;border-top:1px solid #fde68a;">Jours restants</td>
                    <td style="padding:8px 0;font-size:18px;font-weight:700;color:#d97706;text-align:right;border-top:1px solid #fde68a;">${daysLeft} jour${daysLeft > 1 ? 's' : ''}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Bouton CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${productUrl}"
                  style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                         font-size:15px;font-weight:600;padding:12px 32px;border-radius:6px;">
                  Voir la fiche produit →
                </a>
              </td></tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
              Pensez à renouveler ou prolonger votre garantie avant le ${formattedDate}.
            </p>
          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Email automatique envoyé par WarrantyVault. Ne pas répondre.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
