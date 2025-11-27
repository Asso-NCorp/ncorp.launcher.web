import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } from "$env/static/private";
import { logger } from "$src/lib/stores/loggerStore";

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "587"),
    secure: parseInt(SMTP_PORT || "587") === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
});

export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    try {
        const info = await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject,
            text,
            html,
        });
        logger.info({ messageId: info.messageId, to }, "Email sent successfully");
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error({ error, to }, "Failed to send email");
        return { success: false, error };
    }
}
