import mqtt from "mqtt";

// Intégration directe avec le compte cloud Bambu Lab (api.bambulab.com pour
// l'authentification, us.mqtt.bambulab.com pour le MQTT), en complément du
// mode LAN local géré par l'app desktop (src/app/actions/printer.ts +
// /api/printer-sync/command). Contrairement au mode LAN, ce chemin ne
// nécessite ni ordinateur allumé sur le réseau de l'utilisateur ni IP locale
// joignable : le serveur FilaTrack parle directement à Bambu Lab depuis
// n'importe où. Contrepartie assumée : un jeton d'accès au compte Bambu de
// l'utilisateur est stocké côté serveur, chiffré (voir secretCrypto.ts).
//
// Endpoints et format de connexion reconstitués par la communauté
// (reverse engineering du protocole, aucune documentation officielle) :
// https://github.com/Doridian/OpenBambuAPI/blob/main/cloud-http.md
// https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md
// https://github.com/coelacant1/Bambu-Lab-Cloud-API/blob/main/API_AUTHENTICATION.md

const API_BASE = "https://api.bambulab.com/v1";
const MQTT_HOST = "us.mqtt.bambulab.com";
const MQTT_PORT = 8883;
const CONNECT_TIMEOUT_MS = 10_000;
const REPORT_TIMEOUT_MS = 12_000;

export type BambuCloudResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function bambuFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

// Étape 1/2 de la connexion : demande l'envoi d'un code de vérification par
// email. Volontairement pas de mot de passe dans ce flux : plus simple et
// plus sûr à intégrer qu'un formulaire demandant le mot de passe du compte
// Bambu (qui déclenche par ailleurs souvent une double authentification que
// ce module ne gère pas).
export async function requestBambuLoginCode(email: string): Promise<BambuCloudResult<true>> {
  try {
    const { response, body } = await bambuFetch("/user-service/user/sendemail/code", {
      method: "POST",
      body: JSON.stringify({ email, type: "codeLogin" }),
    });
    if (!response.ok) {
      return { ok: false, error: body?.error || `Bambu Lab a répondu ${response.status}.` };
    }
    return { ok: true, data: true };
  } catch {
    return { ok: false, error: "Impossible de joindre les serveurs Bambu Lab." };
  }
}

// Étape 2/2 : échange email + code contre un jeton d'accès, puis récupère
// l'identifiant utilisateur (uid) nécessaire à l'authentification MQTT
// cloud (nom d'utilisateur "u_{uid}").
export async function loginToBambuCloud(
  email: string,
  code: string
): Promise<BambuCloudResult<{ accessToken: string; uid: string }>> {
  try {
    const { response, body } = await bambuFetch("/user-service/user/login", {
      method: "POST",
      body: JSON.stringify({ account: email, code }),
    });
    if (!response.ok || !body?.accessToken) {
      return {
        ok: false,
        error:
          body?.error ||
          "Code invalide ou expiré (ou compte protégé par une double authentification non gérée ici).",
      };
    }
    const accessToken = body.accessToken as string;

    const prefs = await bambuFetch("/design-user-service/my/preference", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const uid = prefs.body?.uid;
    if (!prefs.response.ok || uid == null) {
      return { ok: false, error: "Connexion réussie mais identifiant utilisateur introuvable." };
    }

    return { ok: true, data: { accessToken, uid: String(uid) } };
  } catch {
    return { ok: false, error: "Impossible de joindre les serveurs Bambu Lab." };
  }
}

export type BambuCloudCreds = { uid: string; accessToken: string };

function connectCloudMqtt(creds: BambuCloudCreds) {
  return mqtt.connect(`mqtts://${MQTT_HOST}:${MQTT_PORT}`, {
    username: `u_${creds.uid}`,
    password: creds.accessToken,
    // Le broker cloud présente un certificat public valide (contrairement au
    // certificat auto-signé de l'imprimante en mode LAN) : pas de raison de
    // désactiver la vérification ici.
    rejectUnauthorized: true,
    connectTimeout: CONNECT_TIMEOUT_MS,
    reconnectPeriod: 0, // connexion ponctuelle (une commande ou une lecture), pas de reconnexion auto
  });
}

function friendlyMqttError(err: Error & { code?: number }): string {
  const msg = err?.message || "";
  if (msg.includes("Not authorized") || msg.includes("Bad User") || msg.includes("code: 4") || msg.includes("code: 5")) {
    return "Session Bambu Cloud invalide ou expirée — reconnecte ton compte dans Paramètres.";
  }
  return msg || "Erreur de connexion au cloud Bambu Lab.";
}

// Même format d'entrée que `pendingCommand` (voir src/models/Printer.ts) :
// on traduit vers le payload MQTT réel Bambu Lab avec exactement la même
// logique que l'app desktop (filatrack-desktop/src/bambuBridge.js), pour que
// le chemin local (app desktop) et le chemin cloud (direct) envoient
// rigoureusement la même commande à l'imprimante.
export type PendingCommandLike = {
  type: "pause" | "resume" | "stop" | "set-filament";
  amsId?: number;
  trayId?: number;
  trayInfoIdx?: string;
  trayType?: string;
  trayColor?: string;
  nozzleTempMin?: number;
  nozzleTempMax?: number;
};

export function buildBambuCommandPayload(command: PendingCommandLike): object {
  if (command.type === "pause" || command.type === "resume" || command.type === "stop") {
    return { print: { sequence_id: "0", command: command.type } };
  }
  return {
    print: {
      sequence_id: "0",
      command: "ams_filament_setting",
      ams_id: command.amsId ?? 0,
      tray_id: command.trayId ?? 0,
      tray_info_idx: command.trayInfoIdx || "",
      tray_color: command.trayColor || "000000FF",
      nozzle_temp_min: command.nozzleTempMin ?? 0,
      nozzle_temp_max: command.nozzleTempMax ?? 0,
      tray_type: command.trayType || "",
    },
  };
}

// Envoie une commande MQTT ponctuelle directement au cloud Bambu : connexion,
// publication, fermeture immédiate — pas besoin de garder une connexion
// ouverte pour un simple envoi, contrairement à la lecture de l'AMS
// ci-dessous qui doit attendre une réponse.
export async function sendCloudPrintCommand(
  creds: BambuCloudCreds,
  deviceId: string,
  payload: object
): Promise<BambuCloudResult<true>> {
  return new Promise((resolve) => {
    const client = connectCloudMqtt(creds);
    let settled = false;
    const finish = (result: BambuCloudResult<true>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.end(true);
      resolve(result);
    };
    const timer = setTimeout(
      () => finish({ ok: false, error: "Délai dépassé en contactant le cloud Bambu Lab." }),
      CONNECT_TIMEOUT_MS
    );

    client.on("connect", () => {
      client.publish(`device/${deviceId}/request`, JSON.stringify(payload), (err) => {
        if (err) finish({ ok: false, error: err.message });
        else finish({ ok: true, data: true });
      });
    });
    client.on("error", (err) => finish({ ok: false, error: friendlyMqttError(err) }));
  });
}

// Slots AMS et statut d'impression extraits d'un rapport MQTT — même forme
// que ce que l'app desktop calcule en local (extractSlots/extractPrintStatus
// dans bambuBridge.js), reproduite ici côté serveur pour le chemin cloud.
export type CloudAmsSlot = { index: number; remainPercent: number; trayType?: string; trayColor?: string };
export type CloudPrintStatus = {
  state: "idle" | "running" | "paused" | "finished" | "failed";
  progress?: number;
  remainingMinutes?: number;
  fileName?: string;
};

type BambuReport = {
  print?: {
    ams?: { ams?: Array<{ id?: number; tray?: Array<{ id?: number; remain?: number; tray_type?: string; tray_color?: string }> }> };
    gcode_state?: string;
    mc_percent?: number;
    mc_remaining_time?: number;
    subtask_name?: string;
    gcode_file?: string;
  };
};

function extractSlots(report: BambuReport): CloudAmsSlot[] {
  const amsUnits = report?.print?.ams?.ams;
  if (!Array.isArray(amsUnits)) return [];
  const slots: CloudAmsSlot[] = [];
  for (const unit of amsUnits) {
    const amsId = Number(unit.id ?? 0);
    const trays = Array.isArray(unit.tray) ? unit.tray : [];
    for (const tray of trays) {
      const trayId = Number(tray.id ?? 0);
      const remain = Number(tray.remain);
      if (!Number.isFinite(remain) || remain < 0) continue;
      slots.push({
        index: amsId * 4 + trayId,
        remainPercent: Math.max(0, Math.min(100, remain)),
        trayType: typeof tray.tray_type === "string" ? tray.tray_type : undefined,
        trayColor: typeof tray.tray_color === "string" ? tray.tray_color : undefined,
      });
    }
  }
  return slots;
}

const PRINT_STATE_MAP: Record<string, CloudPrintStatus["state"]> = {
  RUNNING: "running",
  PREPARE: "running",
  SLICING: "running",
  PAUSE: "paused",
  FINISH: "finished",
  FAILED: "failed",
};

function extractPrintStatus(report: BambuReport): CloudPrintStatus | null {
  const print = report?.print;
  if (!print || typeof print.gcode_state !== "string") return null;

  const state = PRINT_STATE_MAP[print.gcode_state.toUpperCase()] ?? "idle";
  const progress = Number(print.mc_percent);
  const remainingMinutes = Number(print.mc_remaining_time);
  const rawFileName =
    (typeof print.subtask_name === "string" && print.subtask_name.trim()) ||
    (typeof print.gcode_file === "string" && print.gcode_file.split("/").pop()) ||
    undefined;

  return {
    state,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : undefined,
    remainingMinutes: Number.isFinite(remainingMinutes) ? Math.max(0, remainingMinutes) : undefined,
    fileName: rawFileName || undefined,
  };
}

// Lit l'état actuel de l'AMS + de l'impression en cours directement depuis le
// cloud Bambu : connexion, demande explicite d'un rapport complet
// ("pushall"), attente du premier paquet exploitable, puis fermeture. Utilisé
// par le bouton "Actualiser depuis le cloud" de /dashboard/printer — une
// alternative ponctuelle à la synchro automatique de l'app desktop, utile
// quand celle-ci ne tourne pas (utilisateur loin de son réseau local).
export async function fetchCloudPrinterState(
  creds: BambuCloudCreds,
  deviceId: string
): Promise<BambuCloudResult<{ slots: CloudAmsSlot[]; printStatus: CloudPrintStatus | null }>> {
  return new Promise((resolve) => {
    const client = connectCloudMqtt(creds);
    let settled = false;
    const finish = (result: BambuCloudResult<{ slots: CloudAmsSlot[]; printStatus: CloudPrintStatus | null }>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.end(true);
      resolve(result);
    };
    const timer = setTimeout(
      () =>
        finish({
          ok: false,
          error: "Pas de réponse de l'imprimante via le cloud (éteinte, hors ligne, ou Wi-Fi coupé ?).",
        }),
      REPORT_TIMEOUT_MS
    );

    client.on("connect", () => {
      client.subscribe(`device/${deviceId}/report`, (err) => {
        if (err) {
          finish({ ok: false, error: err.message });
          return;
        }
        client.publish(`device/${deviceId}/request`, JSON.stringify({ pushing: { sequence_id: "0", command: "pushall" } }));
      });
    });

    client.on("message", (_topic, payload) => {
      let data: BambuReport;
      try {
        data = JSON.parse(payload.toString());
      } catch {
        return;
      }
      const slots = extractSlots(data);
      const printStatus = extractPrintStatus(data);
      if (slots.length === 0 && !printStatus) return; // paquet MQTT sans info utile : on attend le suivant
      finish({ ok: true, data: { slots, printStatus } });
    });

    client.on("error", (err) => finish({ ok: false, error: friendlyMqttError(err) }));
  });
}
