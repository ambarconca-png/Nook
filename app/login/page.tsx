import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SmokeBackground } from "@/components/smoke-background";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12 text-nook-ink">
      <SmokeBackground />

      <section className="relative z-10 w-full max-w-[440px] rounded-[28px] border border-white/80 bg-white/72 p-7 shadow-[0_35px_100px_rgba(67,47,42,0.16)] backdrop-blur-3xl sm:p-9">
        <div className="font-serif text-[38px] tracking-[-0.08em]">nook</div>

        <div className="mt-12">
          <p className="text-sm text-nook-teal">Willkommen zu Hause</p>
          <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.045em]">
            Dein ruhiger Ort
            <br />
            für den Alltag.
          </h1>
          <p className="mt-4 max-w-sm leading-7 text-nook-muted">
            Gedanken festhalten, den Tag ordnen und bei dir ankommen.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
