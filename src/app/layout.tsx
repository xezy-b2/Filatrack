import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilaTrack — Suivi de filaments Bambu Lab",
  description: "Suivi collaboratif du stock de filaments pour ta Bambu Lab P2S.",
  // Installable sur l'écran d'accueil (voir manifest.ts pour Android/Chrome) ;
  // ces champs couvrent en plus le cas Safari/iOS, qui ignore le manifest
  // pour certains réglages et lit ses propres balises <meta>.
  appleWebApp: {
    capable: true,
    title: "FilaTrack",
    statusBarStyle: "default",
  },
  other: {
    // Doublon volontaire de mobile-web-app-capable (généré par appleWebApp
    // ci-dessus) : les Safari plus anciens ne lisent que ce nom préfixé.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <ServiceWorkerRegistration />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
