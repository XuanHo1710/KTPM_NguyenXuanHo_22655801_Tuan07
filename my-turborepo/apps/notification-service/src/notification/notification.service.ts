import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface BrevoResponse {
  messageId?: string;
  code?: string;
  message?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || '';
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME') || '';

    if (!this.apiKey) {
      this.logger.warn(
        'BREVO_API_KEY is not configured. Emails will not be sent.',
      );
    } else {
      this.logger.log('Brevo email service configured successfully');
    }
  }

  /**
   * Gửi email xác nhận thanh toán thành công
   */
  async sendPaymentConfirmationEmail(
    email: string,
    paymentCode: number,
    amount: number,
    description?: string,
    transactionId?: string,
    paidAt?: string,
  ): Promise<boolean> {
    this.logger.log(`Sending payment confirmation email to: ${email}`);

    const htmlContent = this.generatePaymentConfirmationTemplate(
      paymentCode,
      amount,
      description,
      transactionId,
      paidAt,
    );

    return this.sendEmail({
      to: email,
      subject: `Xác nhận thanh toán #${paymentCode} - Project PC`,
      htmlContent,
    });
  }

  /**
   * Gửi email tùy chỉnh
   */
  async sendCustomEmail(
    email: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject,
      htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;">${content}</div>`,
    });
  }

  /**
   * Gửi email qua Brevo API
   */
  private async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.error('Cannot send email: BREVO_API_KEY is not configured');
      return false;
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent || this.stripHtml(options.htmlContent),
    };

    try {
      this.logger.log(`Sending email to: ${options.to} | Subject: ${options.subject}`);

      const response = await fetch(this.brevoApiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data: BrevoResponse = await response.json();

      if (response.ok) {
        this.logger.log(`Email sent successfully to ${options.to} | MessageId: ${data.messageId}`);
        return true;
      } else {
        this.logger.error(
          `Error sending email: ${data.message || 'Unknown error'} | Code: ${data.code}`,
        );
        return false;
      }
    } catch (error: any) {
      this.logger.error(`Error sending email: ${error.message}`);
      return false;
    }
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Template email xác nhận thanh toán
   */
  private generatePaymentConfirmationTemplate(
    paymentCode: number,
    amount: number,
    description?: string,
    transactionId?: string,
    paidAt?: string,
  ): string {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value);

    const formattedDate = paidAt
      ? new Date(paidAt).toLocaleString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      : new Date().toLocaleString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận thanh toán - Project PC</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f9ff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 64px; text-align: center;">
                <span style="font-size: 32px; color: #fff;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Thanh toán thành công!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px; font-weight: 400;">Project PC</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.
              </p>

              <!-- Payment Info -->
              <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Mã thanh toán</td>
                  <td style="padding: 16px 20px; color: #059669; font-size: 15px; font-weight: 700; text-align: right; border-bottom: 1px solid #e5e7eb; letter-spacing: 0.5px;">#${paymentCode}</td>
                </tr>
                ${transactionId ? `
                <tr>
                  <td style="padding: 16px 20px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Mã giao dịch</td>
                  <td style="padding: 16px 20px; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e5e7eb;">${transactionId}</td>
                </tr>
                ` : ''}
                ${description ? `
                <tr>
                  <td style="padding: 16px 20px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Mô tả</td>
                  <td style="padding: 16px 20px; color: #374151; font-size: 14px; text-align: right; border-bottom: 1px solid #e5e7eb;">${description}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px 20px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Thời gian</td>
                  <td style="padding: 16px 20px; color: #374151; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; color: #6b7280; font-size: 14px; font-weight: 500;">Phương thức</td>
                  <td style="padding: 16px 20px; text-align: right;">
                    <span style="background-color: #059669; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">Thanh toán trực tuyến - Đã thanh toán</span>
                  </td>
                </tr>
              </table>

              <!-- Total Amount -->
              <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; text-align: center; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Tổng thanh toán</p>
                <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 800;">${formatCurrency(amount)}</p>
              </div>

              <!-- Notice -->
              <div style="margin-top: 24px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>Lưu ý:</strong> Đây là email xác nhận tự động. Vui lòng giữ lại email này làm biên lai thanh toán. Nếu bạn có thắc mắc, hãy liên hệ với chúng tôi.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                Cảm ơn bạn đã tin tưởng Project PC!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Project PC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
