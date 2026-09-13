import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

// Dérive une clé de 32 octets à partir de BAMBU_TOKEN_SECRET, quelle que soit
// sa longueur/forme d'origine — plus simple à configurer côté déploiement
// qu'exiger un format précis (base64 32 octets pile, etc).
function getKey(): Buffer {
  const secret = process.env.BAMBU_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "La variable d'environnement BAMBU_TOKEN_SECRET est manquante. Génère une valeur avec `openssl rand -base64 32` et ajoute-la à .env.local (ou aux variables Railway) pour utiliser la connexion cloud Bambu Lab."
    );
  }
  return crypto.scryptSync(secret, "filatrack-bambu-cloud", 32);
}

// Chiffre un secret avant stockage en base (ex: jeton d'accès au compte cloud
// Bambu Lab, voir src/lib/bambuCloud.ts) — contrairement à un hash (comme
// apiKeyHash/passwordHash, irréversibles), on doit pouvoir le relire en clair
// pour s'en servir comme mot de passe MQTT auprès du cloud Bambu.
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
