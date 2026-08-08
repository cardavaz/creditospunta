const clients = [
  { id: "CP-0001", name: "María Rodríguez", document: "4.123.456-7", income: "$48.000", status: "Activo", score: 812 },
  { id: "CP-0002", name: "Juan Pérez", document: "3.987.654-2", income: "$55.000", status: "Activo", score: 756 },
  { id: "CP-0003", name: "Lucía Martínez", document: "5.234.567-1", income: "$42.000", status: "Activo", score: 684 },
  { id: "CP-0004", name: "Carlos Gómez", document: "4.876.321-9", income: "$61.000", status: "Bloqueado", score: 431 },
];

export default function ClientesPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div><div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div><div className="text-xs text-slate-500">Gestión de clientes · Demo</div></div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Nuevo cliente</button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><h1 className="text-3xl font-bold">Clientes</h1><p className="mt-1 text-slate-500">Consulta y administración de la cartera de clientes.</p></div>
          <input aria-label="Buscar cliente" placeholder="Buscar por nombre o CI..." className="rounded-lg border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
        </div>
        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["Cliente","CI","Ingreso mensual","Score Atlas","Estado",""].map(x=><th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr></thead>
            <tbody>{clients.map(c=><tr key={c.id} className="border-t hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold">{c.name}</div><div className="text-xs text-slate-400">{c.id}</div></td><td className="px-5 py-4">{c.document}</td><td className="px-5 py-4">{c.income}</td><td className="px-5 py-4"><span className={"font-bold "+(c.score>=750?"text-emerald-700":c.score>=600?"text-amber-700":"text-red-700")}>{c.score}</span></td><td className="px-5 py-4"><span className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(c.status==="Activo"?"bg-emerald-100 text-emerald-800":"bg-red-100 text-red-800")}>{c.status}</span></td><td className="px-5 py-4 text-right"><button className="font-semibold text-sky-700">Ver ficha →</button></td></tr>)}</tbody>
          </table>
        </section>
        <p className="mt-6 text-xs text-slate-400">Datos ficticios para pruebas. El módulo todavía no guarda información en una base de datos.</p>
      </div>
    </main>
  );
}
