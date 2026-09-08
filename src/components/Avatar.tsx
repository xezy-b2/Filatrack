function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

// Petite palette stable dérivée du nom, pour que chaque personne ait toujours
// la même couleur de secours (pas d'aléatoire entre deux rendus).
const PALETTE = [
  "bg-orange-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500",
  "bg-sky-500", "bg-violet-500", "bg-pink-500", "bg-teal-500",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const dimension = `${size}px`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URI base64, pas d'optimisation next/image utile ici
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-black/10 object-cover"
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)}`}
      style={{ width: dimension, height: dimension, fontSize: `${Math.max(10, size * 0.4)}px` }}
    >
      {initials(name)}
    </span>
  );
}
