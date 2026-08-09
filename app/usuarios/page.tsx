import { redirect } from "next/navigation";
import { listUsers } from "./actions";
import NewUserForm from "./new-user-form";
import UserRow from "./user-row";
import { getCurrentUser } from "@/lib/auth";

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const users = await listUsers();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
            <div className="text-xs text-slate-500">Usuarios y roles</div>
          </div>
          <NewUserForm />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="mt-1 text-slate-500">Alta, rol y estado de cada usuario del sistema. Solo ADMIN.</p>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Usuario", "Rol", "Estado", ""].map((x) => <th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    active: u.active,
                    lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
                    createdAt: u.createdAt.toISOString(),
                  }}
                  isSelf={u.id === user.userId}
                />
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No hay usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <p className="mt-6 text-xs text-slate-400">Las contraseñas temporales se muestran una sola vez al crear el usuario. No hay recuperación de contraseña por email todavía.</p>
      </div>
    </main>
  );
}
