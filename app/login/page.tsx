import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SmokeBackground } from "@/components/smoke-background";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main data-module="today" className="relative grid min-h-screen place-items-center overflow-hidden bg-nook-background px-4 py-12 text-nook-ink sm:px-6">
      <SmokeBackground />

      <section className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-black/[0.08] bg-nook-card/80 p-7 shadow-nook backdrop-blur-3xl sm:p-9">
        <div className="text-[34px] font-medium tracking-[-0.055em]">nook</div>

        <div className="mt-12">
          <p className="text-sm text-nook-teal">Willkommen zu Hause</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[32px]">
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
