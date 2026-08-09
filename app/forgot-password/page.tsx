import ForgotPasswordForm from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">
        <div className="text-2xl font-bold">Créditos<span className="text-sky-600">Punta</span></div>
        <p className="mt-1 text-sm text-slate-500">Recuperar contraseña</p>
        <ForgotPasswordForm />
        <p className="mt-6 text-xs text-slate-400"><a href="/login" className="hover:underline">← Volver a iniciar sesión</a></p>
      </div>
    </main>
  );
}
