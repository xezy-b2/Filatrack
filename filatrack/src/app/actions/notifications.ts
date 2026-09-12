"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
};

const MAX_NOTIFICATIONS = 15;

export async function getNotifications(): Promise<{ notifications: NotificationView[]; unreadCount: number }> {
  const userId = await requireUserId();
  await connectToDatabase();

  const [docs, unreadCount] = await Promise.all([
    Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(MAX_NOTIFICATIONS).lean(),
    Notification.countDocuments({ owner: userId, read: false }),
  ]);

  return {
    notifications: docs.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      body: n.body ?? undefined,
      read: n.read,
      createdAt: new Date(n.createdAt).toISOString(),
    })),
    unreadCount,
  };
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await requireUserId();
  await connectToDatabase();
  await Notification.updateMany({ owner: userId, read: false }, { $set: { read: true } });
}
