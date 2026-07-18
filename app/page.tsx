import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient displayName={user.name} />;
}
