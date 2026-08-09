import { redirect } from "next/navigation";

// Fusionado con /productos: era una pantalla demo duplicada con los mismos
// datos hardcodeados. El catálogo real (parametrizado, editable) vive ahí.
export default function ConfiguracionPage() {
  redirect("/productos");
}
