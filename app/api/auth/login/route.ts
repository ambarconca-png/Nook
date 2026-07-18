import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { createSession, deleteExpiredSessions } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Attempt = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, Attempt>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttemptKey(request: Request, email: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${email}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const attempt = attempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    attempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }

  current.count += 1;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !email.includes("@") || !password || password.length > 200) {
      return NextResponse.json(
        { error: "Bitte E-Mail und Passwort prüfen." },
        { status: 400 },
      );
    }

    const attemptKey = getAttemptKey(request, email);
    if (isRateLimited(attemptKey)) {
      return NextResponse.json(
        { error: "Zu viele Versuche. Bitte warte 15 Minuten." },
        { status: 429 },
      );
    }

    const db = getDb();
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      const [{ value: userCount }] = await db
        .select({ value: count() })
        .from(users);

      if (userCount === 0) {
        const adminEmail = process.env.NOOK_ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.NOOK_ADMIN_PASSWORD;
        const adminName = process.env.NOOK_ADMIN_NAME?.trim() || "Ambar";

        if (
          adminEmail &&
          adminPassword &&
          email === adminEmail &&
          password === adminPassword
        ) {
          [user] = await db
            .insert(users)
            .values({
              email,
              name: adminName,
              passwordHash: await hashPassword(password),
            })
            .returning();
        }
      }
    }

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      recordFailure(attemptKey);
      return NextResponse.json(
        { error: "E-Mail oder Passwort ist nicht korrekt." },
        { status: 401 },
      );
    }

    attempts.delete(attemptKey);
    await deleteExpiredSessions();
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      { error: "Anmeldung ist gerade nicht möglich." },
      { status: 500 },
    );
  }
}
