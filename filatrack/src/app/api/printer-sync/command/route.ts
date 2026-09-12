import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Printer } from "@/models/Printer";

// Sondé régulièrement (toutes les ~8s) par l'app desktop pendant qu'elle est
// connectée en MQTT à l'imprimante, pour savoir si une commande (pause,
// reprise, arrêt) a été déposée depuis le site (voir sendPrinterCommand
// dans src/app/actions/printer.ts). Le site ne peut pas contacter
// l'imprimante directement (réseau local de l'utilisateur, non routable
// depuis Railway) : c'est l'app desktop qui, elle, publie la commande en
// MQTT une fois récupérée ici.
//
//   GET /api/printer-sync/command?deviceId=<numéro de série>
//   Authorization: Bearer <clé API>
//
// La commande est retirée (consommée) dès qu'elle est renvoyée : au pire
// une commande peut être perdue si l'app desktop plante juste après l'avoir
// récupérée, ce qui est un compromis acceptable pour cet usage.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Clé API manquante (en-tête Authorization: Bearer <clé>)." }, { status: 401 });
  }

  const apiKeyHash = crypto.createHash("sha256").update(token).digest("hex");

  await connectToDatabase();
  const user = await User.findOne({ apiKeyHash }).select("_id").lean();
  if (!user) {
    return NextResponse.json({ error: "Clé API invalide ou révoquée." }, { status: 401 });
  }

  const deviceId = request.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "Paramètre deviceId manquant." }, { status: 400 });
  }

  const printer = await Printer.findOne({ owner: user._id, deviceId });
  if (!printer) {
    return NextResponse.json({ error: "Imprimante inconnue pour ce compte." }, { status: 404 });
  }

  const command = printer.pendingCommand ?? null;
  if (command) {
    printer.pendingCommand = undefined;
    await printer.save();
  }

  return NextResponse.json({ command });
}
