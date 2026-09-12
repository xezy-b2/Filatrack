import packageJson from "../../package.json";

// Année dérivée de la date d'exécution plutôt que codée en dur, pour ne
// jamais avoir à y repenser au changement d'année.
const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
      FilaTrack v{packageJson.version} · © {currentYear} Xezy
    </footer>
  );
}
