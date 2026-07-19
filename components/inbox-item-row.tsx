"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FolderKanban,
  HeartPulse,
  Pencil,
  Repeat2,
  Trash2,
  X,
} from "lucide-react";
import type { InboxItem } from "@/lib/types";

export function InboxItemRow({
  item,
  onUpdate,
  onDelete,
  onOrganize,
}: {
  item: InboxItem;
  onUpdate: (id: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOrganize: (
    id: string,
    destination: "todo" | "routine" | "tracking" | "project",
  ) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const time = new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.createdAt));

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Änderung konnte nicht gespeichert werden.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const nextText = text.trim();
    if (!nextText) {
      setError("Ein leerer Gedanke kann gelöscht werden.");
      return;
    }
    await run(async () => {
      await onUpdate(item.id, nextText);
      setEditing(false);
    });
  }

  return (
    <article className="rounded-[20px] border border-black/[0.055] bg-white/55 p-4 transition hover:bg-white/75 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <textarea
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-24 w-full resize-none rounded-2xl border border-nook-teal/30 bg-white/80 p-3.5 outline-none ring-4 ring-nook-teal/5"
            />
          ) : (
            <p className="whitespace-pre-wrap leading-7">{item.text}</p>
          )}
          <p className="mt-2 text-xs text-nook-muted">Heute · {time}</p>
        </div>

        <button
          onClick={() => {
            if (editing) {
              setText(item.text);
              setEditing(false);
              setError("");
            } else {
              setEditing(true);
            }
          }}
          disabled={busy}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-nook-muted transition hover:bg-black/5 hover:text-nook-ink"
          aria-label={editing ? "Bearbeiten abbrechen" : "Eintrag bearbeiten"}
        >
          {editing ? <X size={17} /> : <Pencil size={16} />}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {editing ? (
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-2xl bg-nook-teal px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? "Speichert …" : "Änderung speichern"}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
          <ActionButton
            icon={<CheckCircle2 size={15} />}
            label="Als To-do"
            disabled={busy}
            onClick={() => run(() => onOrganize(item.id, "todo"))}
          />
          <ActionButton
            icon={<Repeat2 size={15} />}
            label="Als Routine"
            disabled={busy}
            onClick={() => run(() => onOrganize(item.id, "routine"))}
          />
          <ActionButton
            icon={<HeartPulse size={15} />}
            label="Tracking"
            disabled={busy}
            onClick={() => run(() => onOrganize(item.id, "tracking"))}
          />
          <ActionButton
            icon={<FolderKanban size={15} />}
            label="Projekt"
            disabled={busy}
            onClick={() => run(() => onOrganize(item.id, "project"))}
          />
          <button
            onClick={() => {
              if (window.confirm("Diesen Inbox-Eintrag wirklich löschen?")) {
                void run(() => onDelete(item.id));
              }
            }}
            disabled={busy}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-nook-muted transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            aria-label="Eintrag löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/55 px-3 py-2 text-xs text-nook-ink/75 transition hover:border-nook-teal/20 hover:bg-nook-teal/5 hover:text-nook-teal disabled:cursor-not-allowed disabled:opacity-35"
    >
      {icon}
      {label}
    </button>
  );
}
