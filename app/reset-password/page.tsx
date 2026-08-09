import ResetPasswordForm from "./reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
        <p className="mt-1 text-sm text-slate-500">Nueva contraseña</p>
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </main>
  );
}
