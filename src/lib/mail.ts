import { Resend } from "resend";

// Envoi d'email via Resend (https://resend.com — offre gratuite largement
// suffisante pour ce cas d'usage : quelques emails de réinitialisation par
// jour). Voir .env.example pour la configuration de RESEND_API_KEY.
//
// Si la clé n'est pas configurée (ex: développement local sans compte
// Resend), on se contente de logger le lien dans la console au lieu
// d'échouer : la fonctionnalité reste testable de bout en bout sans compte
// externe, il suffit d'aller chercher le lien dans les logs du serveur.
const FROM_ADDRESS = process.env.EMAIL_FROM || "FilaTrack <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[mail] RESEND_API_KEY absente : email non envoyé.\n[mail] Lien de réinitialisation pour ${to} : ${resetUrl}`
    );
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Réinitialise ton mot de passe FilaTrack",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h1 style="font-size: 20px;">Réinitialisation de mot de passe</h1>
        <p>
          Tu as demandé à réinitialiser le mot de passe de ton compte FilaTrack.
          Clique sur le lien ci-dessous pour choisir un nouveau mot de passe :
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#ea580c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">
          Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet email :
          ton mot de passe actuel reste inchangé.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[mail] Échec de l'envoi de l'email de réinitialisation :", error);
    throw new Error("L'envoi de l'email a échoué.");
  }
}
