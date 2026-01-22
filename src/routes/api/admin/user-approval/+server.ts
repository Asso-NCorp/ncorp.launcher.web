import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { db } from "$srv/db";
import { logger } from "better-auth";
import { sendEmail } from "$src/lib/server/email";

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user || (!Array.isArray(locals.user.role) && locals.user.role !== "admin")) {
        return json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return json({ error: "Missing userId or action" }, { status: 400 });
        }

        if (!["approve", "reject"].includes(action)) {
            return json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
        }

        const approvalStatus = action === "approve" ? "approved" : "rejected";

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { approvalStatus },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                approvalStatus: true,
            },
        });

        // Send approval/rejection email
        try {
            if (action === "approve") {
                const subject = "Votre compte a été approuvé - NCORP Launcher";
                const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte Approuvé</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #1a0f33; margin: 0; padding: 0; color: #f2f1f6; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1f0a3d; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #30155c; }
        .header { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.5px; }
        .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); color: #22c55e; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 12px; font-size: 13px; border: 1px solid rgba(34, 197, 94, 0.3); }
        .content { padding: 40px 30px; background-color: #1a0f33; }
        .greeting { font-size: 18px; font-weight: 600; color: #f2f1f6; margin-bottom: 20px; }
        .message { font-size: 15px; line-height: 1.8; color: #d6d6e0; margin-bottom: 20px; }
        .highlight { color: #b88fef; font-weight: 600; }
        .features { background-color: #140825; border: 1px solid #30155c; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .features-title { font-weight: 600; color: #f2f1f6; margin-bottom: 12px; font-size: 14px; }
        .feature-item { font-size: 14px; color: #d6d6e0; margin-bottom: 10px; padding-left: 20px; position: relative; }
        .feature-item:before { content: "▪"; position: absolute; left: 0; color: #b88fef; }
        .button { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(184, 143, 239, 0.3); }
        .button:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(184, 143, 239, 0.4); }
        .footer { background-color: #1a0f33; padding: 25px; text-align: center; font-size: 12px; color: #b088d9; border-top: 1px solid #30155c; }
        .footer-link { color: #b88fef; text-decoration: none; }
        .cta { text-align: center; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 NCORP</div>
            <div class="badge">✓ Compte Approuvé</div>
        </div>
        <div class="content">
            <div class="greeting">Bonjour <span class="highlight">${updatedUser.name || updatedUser.username || updatedUser.email}</span>,</div>
            <p class="message">Excellentes nouvelles ! Votre compte a été approuvé par nos administrateurs. Vous pouvez maintenant accéder à NCORP Launcher et commencer à utiliser toutes les fonctionnalités disponibles.</p>
            <p class="message">Votre compte est maintenant complètement activé et prêt à l'emploi. Bienvenue dans la communauté NCORP !</p>
            <div class="cta">
                <a href="${process.env.PUBLIC_BETTER_AUTH_URL || "https://launcher.n-corp.fr"}" class="button">Accéder à NCORP Launcher</a>
            </div>
            <p class="message">Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter notre équipe d'assistance.</p>
        </div>
        <div class="footer">
            <p style="margin: 0; margin-bottom: 10px;">&copy; ${new Date().getFullYear()} NCORP. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;
                const text = `Bonjour ${updatedUser.name || updatedUser.username || updatedUser.email},\n\nExcellentes nouvelles ! Votre compte a été approuvé par nos administrateurs. Vous pouvez maintenant accéder à NCORP Launcher et commencer à utiliser toutes les fonctionnalités disponibles.\n\nVotre compte est maintenant complètement activé et prêt à l'emploi. Bienvenue dans la communauté NCORP !\n\nSi vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter notre équipe d'assistance.`;

                await sendEmail({
                    to: updatedUser.email,
                    subject,
                    text,
                    html,
                });
            } else {
                // Rejection email
                const subject = "À propos de votre demande - NCORP Launcher";
                const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour de votre demande</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #1a0f33; margin: 0; padding: 0; color: #f2f1f6; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1f0a3d; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 1px solid #30155c; }
        .header { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.5px; }
        .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); color: #f59e0b; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 12px; font-size: 13px; border: 1px solid rgba(245, 158, 11, 0.3); }
        .content { padding: 40px 30px; background-color: #1a0f33; }
        .greeting { font-size: 18px; font-weight: 600; color: #f2f1f6; margin-bottom: 20px; }
        .message { font-size: 15px; line-height: 1.8; color: #d6d6e0; margin-bottom: 20px; }
        .highlight { color: #b88fef; font-weight: 600; }
        .info-box { background-color: #140825; border: 1px solid #30155c; border-left: 3px solid #b88fef; border-radius: 6px; padding: 20px; margin: 25px 0; }
        .info-box-title { font-weight: 600; color: #f2f1f6; margin-bottom: 8px; font-size: 14px; }
        .info-box-text { font-size: 14px; color: #d6d6e0; margin: 0; }
        .button { background: linear-gradient(135deg, #b88fef 0%, #9d5dff 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(184, 143, 239, 0.3); }
        .button:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(184, 143, 239, 0.4); }
        .footer { background-color: #1a0f33; padding: 25px; text-align: center; font-size: 12px; color: #b088d9; border-top: 1px solid #30155c; }
        .footer-link { color: #b88fef; text-decoration: none; }
        .cta { text-align: center; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 NCORP</div>
            <div class="badge">ℹ Mise à jour</div>
        </div>
        <div class="content">
            <div class="greeting">Bonjour <span class="highlight">${updatedUser.name || updatedUser.username || updatedUser.email}</span>,</div>
            <p class="message">Merci de votre intérêt pour NCORP Launcher. Après examen de votre demande, nous regrettons de vous informer qu'elle n'a pas été approuvée à ce moment.</p>
            <div class="info-box">
                <p style="margin-top: 0; margin-bottom: 10px;"><strong>Vous avez des questions ?</strong></p>
                <p style="margin: 0;">N'hésitez pas à contacter notre équipe d'assistance pour plus d'informations ou si vous pensez qu'il s'agit d'une erreur.</p>
            </div>
            <p class="message">Nous vous remercions de votre compréhension.</p>
        </div>
        <div class="footer">
            <p style="margin: 0; margin-bottom: 10px;">&copy; ${new Date().getFullYear()} NCORP. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;
                const text = `Bonjour ${updatedUser.name || updatedUser.username || updatedUser.email},\n\nMerci de votre intérêt pour NCORP Launcher. Après examen de votre demande, nous regrettons de vous informer qu'elle n'a pas été approuvée à ce moment.\n\nSi vous pensez qu'il s'agit d'une erreur ou avez des questions, n'hésitez pas à contacter notre équipe d'assistance pour plus d'informations.\n\nNous vous remercions de votre compréhension.`;

                await sendEmail({
                    to: updatedUser.email,
                    subject,
                    text,
                    html,
                });
            }
        } catch (emailError) {
            logger.error("Failed to send approval email", {
                userId,
                action,
                error: emailError instanceof Error ? emailError.message : emailError,
            });
            // Don't fail the request if email sending fails
        }

        logger.info(`User ${action}d by admin`, {
            userId,
            adminId: locals.user.id,
            approvalStatus,
        });

        return json(
            {
                success: true,
                message: `User ${action}d successfully`,
                user: updatedUser,
            },
            { status: 200 },
        );
    } catch (error) {
        logger.error("Error updating user approval status", {
            error: error instanceof Error ? error.message : error,
        });
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
