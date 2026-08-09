import { listProducts } from "./actions";
import NewProductForm from "./new-product-form";
import ProductRow from "./product-row";
import { getCurrentUser } from "@/lib/auth";

export default async function ProductosPage() {
  const [products, user] = await Promise.all([listProducts(), getCurrentUser()]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Catálogo de productos</div>
          </div>
          {isAdmin && <NewProductForm />}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">Productos</h1>
        <p className="mt-1 text-slate-500">
          Montos, plazos y estado por producto. Estos parámetros son los que limitan las solicitudes en <code>/solicitudes</code> —
          las tasas todavía no están fijadas legalmente (ver docs/REGULATORY-DOSSIER.md), por eso no se configuran acá.
        </p>
        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Producto", "Rango de monto", "Plazos", "Estado", ""].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <ProductRow key={p.id} product={p} canEdit={isAdmin} />
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Todavía no hay productos configurados.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Importante:</strong> estos son parámetros de diseño del MVP. No fijan tasas ni habilitan operaciones financieras reales.
        </div>
      </div>
    </main>
  );
}
