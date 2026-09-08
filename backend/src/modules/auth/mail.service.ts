import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  public constructor(private readonly config: ConfigService) {}

  public async sendPasswordReset(email: string, token: string): Promise<void> {
    const host = this.config.get<string>("SMTP_HOST");
    const from = this.config.get<string>("SMTP_FROM");
    const resetUrl = this.config.get<string>("PASSWORD_RESET_URL");
    if (!host || !from || !resetUrl) {
      if (this.config.get<string>("APP_ENVIRONMENT") === "Production") {
        throw new ServiceUnavailableException("Password recovery email is not configured.");
      }
      return;
    }
    const url = new URL(resetUrl);
    url.searchParams.set("token", token);
    const user = this.config.get<string>("SMTP_USER");
    const password = this.config.get<string>("SMTP_PASSWORD");
    const transport = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>("SMTP_PORT") ?? "587"),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });
    await transport.sendMail({
      from,
      to: email,
      subject: "Reset your D Ceylon password",
      text: `Reset your password using this single-use link: ${url.toString()}\n\nIf you did not request this, you can ignore this message.`,
    });
  }
}
