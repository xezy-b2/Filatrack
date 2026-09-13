"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 640;
const JPEG_QUALITY = 0.85;

// Contrairement à AvatarUploader (recadrage carré centré, pensé pour un
// portrait), ici on redimensionne sans recadrer : une photo de bobine est
// souvent rectangulaire et on ne veut pas couper l'étiquette ou le QR code
// imprimé dessus.
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de préparer l'image."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SpoolImageUploader({
  initialImage,
  onChange,
}: {
  initialImage?: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(initialImage);
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
      setError(null);
      onChange(dataUrl);
    } catch {
      setError("Impossible de traiter cette image, essaie-en une autre.");
    }
  }

  function handleRemove() {
    setPreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URI ou URL externe, pas d'optimisation next/image utile ici
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-400">Aucune photo</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
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
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Supprimer la photo
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
