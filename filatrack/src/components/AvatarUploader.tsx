"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";

const TARGET_SIZE = 320;
const JPEG_QUALITY = 0.85;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide."));
      img.onload = () => {
        // Recadrage carré centré, puis redimensionnement à TARGET_SIZE.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de préparer l'image."));
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploader({
  name,
  initialAvatar,
}: {
  name: string;
  initialAvatar?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>(initialAvatar);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Merci de choisir un fichier image.");
      return;
    }

    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
      setRemoved(false);
      setError(null);
    } catch {
      setError("Impossible de traiter cette image, essaie-en une autre.");
    }
  }

  function handleRemove() {
    setPreview(undefined);
    setRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={preview} size={72} />

      <div className="flex flex-col gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 w-fit">
          {preview ? "Changer la photo" : "Ajouter une photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-left text-xs text-red-600 hover:underline dark:text-red-400 w-fit"
          >
            Supprimer la photo
          </button>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-xs text-slate-500">JPG/PNG, recadrée et compressée automatiquement.</p>
      </div>

      {/* Champs transmis au Server Action */}
      <input type="hidden" name="avatar" value={!removed && preview !== initialAvatar ? preview ?? "" : ""} />
      <input type="hidden" name="removeAvatar" value={removed ? "true" : "false"} />
    </div>
  );
}
