import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

type NotificationType = "badge";

/**
 * Crée une notification in-app pour un utilisateur (affichée via la cloche
 * dans la barre de navigation). Ne throw jamais volontairement au-delà des
 * erreurs Mongoose normales — appelée depuis un chemin critique (déblocage
 * de badge) qui ne doit pas échouer à cause d'une notification.
 */
export async function createNotification(
  userId: string,
  notif: { type: NotificationType; title: string; body?: string }
): Promise<void> {
  await connectToDatabase();
  await Notification.create({ owner: userId, ...notif });
}
