import type { Metadata } from "next";
import "./globals.css";
import TopBar from "./topbar";

export const metadata: Metadata = { title: "CréditosPunta", description: "Gestión de créditos personales" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
