"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type {
  TrackingEntry,
  TrackingField,
  TrackingTracker,
} from "@/lib/types";

const virtualTrackers: TrackingTracker[] = [
  {
    id: "",
    type: "menstruation",
    name: "Menstruation",
    options: [],
    fields: [],
    color: "rose",
  },
  {
    id: "",
    type: "headache",
    name: "Kopfschmerzen & Migräne",
    options: [],
    fields: [],
    color: "violet",
  },
];

const inputLabels: Record<
  NonNullable<TrackingTracker["inputType"]>,
  string
> = {
  boolean: "Ja / Nein",
  scale: "Skala von 1 bis 10",
  number: "Zahl",
  duration: "Dauer",
  multiselect: "Mehrfachauswahl",
  text: "Freitext",
};

const colorClasses = {
  rose: "bg-rose-100 text-rose-700",
  peach: "bg-orange-100 text-orange-700",
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  teal: "bg-teal-100 text-teal-700",
};

const dotClasses = {
  rose: "bg-rose-400",
  peach: "bg-orange-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  teal: "bg-teal-400",
};

function localDateTimeInput(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
}

function newTrackingField(): TrackingField {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    type: "scale",
    options: [],
  };
}

async function trackingAction<T>(body: Record<string, unknown>) {
  const response = await fetch("/api/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Änderung konnte nicht gespeichert werden.");
  }
  return result;
}

export function TrackingWorkspace({
  initialTrackers,
  initialEntries,
}: {
  initialTrackers: TrackingTracker[];
  initialEntries: TrackingEntry[];
}) {
  const [trackers, setTrackers] = useState(initialTrackers);
  const [entries, setEntries] = useState(initialEntries);
  const [entryTracker, setEntryTracker] = useState<TrackingTracker | null>(null);
  const [activeTracker, setActiveTracker] = useState<TrackingTracker | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState("");
  const [editingEntryId, setEditingEntryId] = useState("");
  const [entryStartedAt, setEntryStartedAt] = useState(localDateTimeInput);
  const [entryEndedAt, setEntryEndedAt] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [entryData, setEntryData] = useState<Record<string, unknown>>({});
  const [entrySaving, setEntrySaving] = useState(false);
  const [entryError, setEntryError] = useState("");

  const [trackerEditorOpen, setTrackerEditorOpen] = useState(false);
  const [trackerName, setTrackerName] = useState("");
  const [trackerFields, setTrackerFields] = useState<TrackingField[]>([
    newTrackingField(),
  ]);
  const [trackerColor, setTrackerColor] =
    useState<TrackingTracker["color"]>("teal");
  const [trackerSaving, setTrackerSaving] = useState(false);
  const [trackerError, setTrackerError] = useState("");

  const visibleTrackers = useMemo(
    () =>
      virtualTrackers.map(
        (preset) =>
          trackers.find((tracker) => tracker.type === preset.type) ?? preset,
      ),
    [trackers],
  );
  const allTrackers = useMemo(
    () => [
      ...visibleTrackers,
      ...trackers.filter((tracker) => tracker.type === "custom"),
    ],
    [trackers, visibleTrackers],
  );

  const lastThirtyDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return entries.filter((entry) => new Date(entry.startedAt) >= start);
  }, [entries]);

  function openEntry(tracker: TrackingTracker, day?: string) {
    setEntryTracker(tracker);
    setEditingEntryId("");
    setEntryStartedAt(
      day
        ? `${day}T${localDateTimeInput().slice(11, 16)}`
        : localDateTimeInput(),
    );
    setEntryEndedAt("");
    setEntryNotes("");
    setEntryData({});
    setEntryError("");
  }

  function openEntryForEditing(
    entry: TrackingEntry,
    tracker: TrackingTracker,
  ) {
    setEntryTracker(tracker);
    setEditingEntryId(entry.id);
    setEntryStartedAt(localDateTimeInput(new Date(entry.startedAt)));
    setEntryEndedAt(
      entry.endedAt ? localDateTimeInput(new Date(entry.endedAt)) : "",
    );
    setEntryNotes(entry.notes);
    setEntryData(entry.data);
    setEntryError("");
  }

  async function saveEntry() {
    if (!entryTracker) return;
    setEntrySaving(true);
    setEntryError("");
    try {
      if (editingEntryId) {
        const result = await trackingAction<{ entry: TrackingEntry }>({
          action: "update-tracking-entry",
          id: editingEntryId,
          startedAt: new Date(entryStartedAt).toISOString(),
          endedAt: entryEndedAt
            ? new Date(entryEndedAt).toISOString()
            : undefined,
          data: entryData,
          notes: entryNotes,
        });
        setEntries((current) =>
          current.map((entry) =>
            entry.id === result.entry.id ? result.entry : entry,
          ),
        );
      } else {
        const result = await trackingAction<{
          tracker: TrackingTracker;
          entry: TrackingEntry;
        }>({
          action: "create-tracking-entry",
          trackerId: entryTracker.id || undefined,
          trackerType: entryTracker.type,
          startedAt: new Date(entryStartedAt).toISOString(),
          endedAt: entryEndedAt
            ? new Date(entryEndedAt).toISOString()
            : undefined,
          data: entryData,
          notes: entryNotes,
        });
        if (!trackers.some((tracker) => tracker.id === result.tracker.id)) {
          setTrackers((current) => [...current, result.tracker]);
        }
        if (
          activeTracker?.type === result.tracker.type &&
          !activeTracker.id
        ) {
          setActiveTracker(result.tracker);
        }
        setEntries((current) => [result.entry, ...current]);
      }
      setEntryTracker(null);
    } catch (error) {
      setEntryError(
        error instanceof Error
          ? error.message
          : "Eintrag konnte nicht gespeichert werden.",
      );
    } finally {
      setEntrySaving(false);
    }
  }

  async function createCustomTracker() {
    if (!trackerName.trim()) {
      setTrackerError("Bitte gib dem Tracker einen Namen.");
      return;
    }
    setTrackerSaving(true);
    setTrackerError("");
    try {
      const result = await trackingAction<{ tracker: TrackingTracker }>({
        action: "create-custom-tracker",
        name: trackerName,
        inputType: trackerFields[0]?.type ?? "text",
        unit: trackerFields[0]?.unit,
        options: trackerFields[0]?.options ?? [],
        fields: trackerFields,
        color: trackerColor,
      });
      setTrackers((current) => [...current, result.tracker]);
      setTrackerEditorOpen(false);
      openEntry(result.tracker);
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "Tracker konnte nicht erstellt werden.",
      );
    } finally {
      setTrackerSaving(false);
    }
  }

  async function deleteEntry(entry: TrackingEntry) {
    if (!window.confirm("Möchtest du diesen Tracking-Eintrag löschen?")) return;
    try {
      await trackingAction({ action: "delete-tracking-entry", id: entry.id });
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Eintrag konnte nicht gelöscht werden.",
      );
    }
  }

  async function deleteTracker(tracker: TrackingTracker) {
    if (
      !window.confirm(
        `Möchtest du „${tracker.name}“ mit allen Einträgen löschen?`,
      )
    ) {
      return;
    }
    try {
      await trackingAction({ action: "delete-custom-tracker", id: tracker.id });
      setTrackers((current) =>
        current.filter((item) => item.id !== tracker.id),
      );
      setEntries((current) =>
        current.filter((entry) => entry.trackerId !== tracker.id),
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Tracker konnte nicht gelöscht werden.",
      );
    }
  }

  function trackerForEntry(entry: TrackingEntry) {
    return trackers.find((tracker) => tracker.id === entry.trackerId);
  }

  const selectedDayEntries = entries.filter((entry) => {
    if (zurichDateKey(entry.startedAt) !== selectedDay) return false;
    return !activeTracker || entry.trackerId === activeTracker.id;
  });

  return (
    <>
      <TrackingCalendar
        title="Tracking-Kalender"
        subtitle="Alle Einträge an einem ruhigen Ort. Wähle einen Tag für Details."
        trackers={allTrackers}
        entries={entries}
        onDaySelect={setSelectedDay}
      />

      {activeTracker && (
        <section className="mt-5 rounded-[24px] border border-white/80 bg-white/76 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTracker(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/5 text-nook-muted"
                aria-label="Zurück zur Übersicht"
              >
                <ArrowLeft size={17} />
              </button>
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl ${colorClasses[activeTracker.color]}`}
              >
                {activeTracker.type === "menstruation" ? (
                  <Droplets size={19} />
                ) : activeTracker.type === "headache" ? (
                  <Activity size={19} />
                ) : (
                  <SlidersHorizontal size={18} />
                )}
              </span>
              <div>
                <p className="text-xs text-nook-muted">Tracker</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {activeTracker.name}
                </h2>
              </div>
            </div>
            <button
              onClick={() => openEntry(activeTracker)}
              className="flex items-center gap-2 rounded-2xl bg-nook-ink px-4 py-2.5 text-sm text-white"
            >
              <Plus size={15} />
              Eintrag erfassen
            </button>
          </div>

          <TrackingCalendar
            title={`${activeTracker.name} im Kalender`}
            subtitle="Wähle einen Tag, um Einträge anzusehen oder nachzutragen."
            trackers={[activeTracker]}
            entries={entries.filter(
              (entry) => entry.trackerId === activeTracker.id,
            )}
            onDaySelect={setSelectedDay}
            embedded
          />

          {activeTracker.type === "menstruation" && (
            <CycleCalendar trackers={trackers} entries={entries} />
          )}
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {visibleTrackers.map((tracker) => (
          <button
            key={tracker.type}
            onClick={() => setActiveTracker(tracker)}
            className="group rounded-[24px] border border-white/80 bg-white/72 p-6 text-left shadow-nook backdrop-blur-2xl transition duration-500 hover:-translate-y-0.5 hover:bg-white/82"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl ${colorClasses[tracker.color]}`}
              >
                {tracker.type === "menstruation" ? (
                  <Droplets size={20} strokeWidth={1.7} />
                ) : (
                  <Activity size={20} strokeWidth={1.7} />
                )}
              </span>
              <ChevronRight
                size={18}
                className="text-nook-muted transition group-hover:translate-x-0.5"
              />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em]">
              {tracker.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-nook-muted">
              {tracker.type === "menstruation"
                ? "Blutung, Schmerzen, Stimmung und Symptome festhalten."
                : "Verlauf, Intensität, mögliche Auslöser und Medikamente dokumentieren."}
            </p>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Eigene Tracker
            </h2>
            <p className="mt-1 text-sm text-nook-muted">
              Erfasse genau das, was für dich hilfreich ist.
            </p>
          </div>
          <button
            data-create-tracker="true"
            onClick={() => {
              setTrackerName("");
              setTrackerFields([newTrackingField()]);
              setTrackerError("");
              setTrackerEditorOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-nook-violet/10 px-4 py-2.5 text-sm text-nook-violet"
          >
            <Plus size={15} />
            Tracker erstellen
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trackers
            .filter((tracker) => tracker.type === "custom")
            .map((tracker) => (
              <div
                key={tracker.id}
                className="flex items-center gap-3 rounded-[20px] bg-white/58 p-3"
              >
                <button
                  onClick={() => setActiveTracker(tracker)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${colorClasses[tracker.color]}`}
                  >
                    <SlidersHorizontal size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {tracker.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-nook-muted">
                      {tracker.fields.length === 1
                        ? inputLabels[tracker.fields[0].type]
                        : `${tracker.fields.length} Felder`}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => deleteTracker(tracker)}
                  className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`${tracker.name} löschen`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          {!trackers.some((tracker) => tracker.type === "custom") && (
            <p className="py-4 text-sm text-nook-muted">
              Noch keine eigenen Tracker.
            </p>
          )}
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">
            Letzte Einträge
          </h2>
          <div className="mt-4 divide-y divide-black/5">
            {entries.slice(0, 12).map((entry) => {
              const tracker = trackerForEntry(entry);
              return (
                <div key={entry.id} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {tracker?.name ?? "Tracking"}
                    </p>
                    <p className="mt-1 text-xs text-nook-muted">
                      {new Intl.DateTimeFormat("de-CH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.startedAt))}
                    </p>
                    {entry.notes && (
                      <p className="mt-2 truncate text-sm text-nook-muted">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  {tracker && (
                    <button
                      onClick={() => openEntryForEditing(entry, tracker)}
                      className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5 hover:text-nook-ink"
                      aria-label="Eintrag bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteEntry(entry)}
                    className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-rose-50 hover:text-rose-700"
                    aria-label="Eintrag löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {entries.length === 0 && (
              <p className="py-10 text-center text-sm text-nook-muted">
                Noch keine Einträge. Du bestimmst, was hier sichtbar wird.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-nook-violet/10 text-nook-violet">
              <BarChart3 size={18} />
            </span>
            <div>
              <h2 className="font-semibold">Beobachtungen</h2>
              <p className="text-xs text-nook-muted">Letzte 30 Tage</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
            {lastThirtyDays.length}
          </p>
          <p className="mt-1 text-sm text-nook-muted">
            {lastThirtyDays.length === 1 ? "Eintrag" : "Einträge"} erfasst
          </p>
          <p className="mt-5 text-xs leading-5 text-nook-muted">
            Nook zeigt hier später mögliche Muster als Beobachtungen. Diese
            Hinweise ersetzen keine medizinische Einschätzung oder Diagnose.
          </p>
        </section>
      </div>

      {selectedDay && (
        <Modal onClose={() => setSelectedDay("")}>
          <ModalHeading
            title={new Intl.DateTimeFormat("de-CH", {
              dateStyle: "long",
            }).format(dateFromKey(selectedDay))}
            subtitle={
              activeTracker
                ? activeTracker.name
                : "Einträge aus allen Trackern"
            }
            onClose={() => setSelectedDay("")}
          />
          <div className="space-y-2">
            {selectedDayEntries.map((entry) => {
              const tracker = trackerForEntry(entry);
              if (!tracker) return null;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-[18px] bg-white/58 p-3"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[tracker.color]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tracker.name}
                    </p>
                    <p className="mt-0.5 text-xs text-nook-muted">
                      {new Intl.DateTimeFormat("de-CH", {
                        timeStyle: "short",
                      }).format(new Date(entry.startedAt))}
                      {entry.notes ? ` · ${entry.notes}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDay("");
                      openEntryForEditing(entry, tracker);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5"
                    aria-label="Eintrag bearbeiten"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteEntry(entry)}
                    className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-rose-50 hover:text-rose-700"
                    aria-label="Eintrag löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {selectedDayEntries.length === 0 && (
              <p className="rounded-[18px] bg-white/45 px-4 py-7 text-center text-sm text-nook-muted">
                An diesem Tag ist noch nichts erfasst.
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="mb-3 text-xs text-nook-muted">Eintrag hinzufügen</p>
            <div className="flex flex-wrap gap-2">
              {(activeTracker ? [activeTracker] : allTrackers).map((tracker) => (
                <button
                  key={`${tracker.type}-${tracker.id}`}
                  onClick={() => {
                    setSelectedDay("");
                    openEntry(tracker, selectedDay);
                  }}
                  className={`rounded-2xl px-3.5 py-2 text-xs ${colorClasses[tracker.color]}`}
                >
                  {tracker.name}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {trackerEditorOpen && (
        <Modal onClose={() => setTrackerEditorOpen(false)}>
          <ModalHeading
            title="Eigener Tracker"
            subtitle="Eine einfache Form für etwas, das du beobachten möchtest."
            onClose={() => setTrackerEditorOpen(false)}
          />
          <label className="block text-sm font-medium">
            Name
            <input
              autoFocus
              value={trackerName}
              onChange={(event) => setTrackerName(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none focus:border-nook-violet"
              placeholder="Schlaf, Energie, Wasser …"
            />
          </label>
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Felder</p>
              <p className="mt-1 text-xs text-nook-muted">
                Kombiniere nur, was du wirklich erfassen möchtest.
              </p>
            </div>
            <button
              onClick={() =>
                setTrackerFields((current) => [
                  ...current,
                  newTrackingField(),
                ])
              }
              className="flex items-center gap-2 rounded-2xl bg-nook-violet/10 px-3 py-2 text-xs text-nook-violet"
            >
              <Plus size={14} />
              Feld hinzufügen
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {trackerFields.map((field, fieldIndex) => (
              <div
                key={field.id}
                className="rounded-[20px] border border-black/[0.07] bg-white/58 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-medium">
                      Feldname
                      <input
                        value={field.label}
                        onChange={(event) =>
                          setTrackerFields((current) =>
                            current.map((item, index) =>
                              index === fieldIndex
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-[15px] border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-nook-violet"
                        placeholder="Schlafdauer, Qualität …"
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      Eingabetyp
                      <select
                        value={field.type}
                        onChange={(event) =>
                          setTrackerFields((current) =>
                            current.map((item, index) =>
                              index === fieldIndex
                                ? {
                                    ...item,
                                    type: event.target
                                      .value as TrackingField["type"],
                                    unit: undefined,
                                    options: [],
                                  }
                                : item,
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-[15px] border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-nook-violet"
                      >
                        {Object.entries(inputLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button
                    onClick={() =>
                      setTrackerFields((current) =>
                        current.filter((_, index) => index !== fieldIndex),
                      )
                    }
                    disabled={trackerFields.length === 1}
                    className="mt-5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-nook-muted hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                    aria-label="Feld entfernen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {(field.type === "number" || field.type === "duration") && (
                  <label className="mt-3 block text-xs font-medium">
                    Einheit
                    <input
                      value={field.unit ?? ""}
                      onChange={(event) =>
                        setTrackerFields((current) =>
                          current.map((item, index) =>
                            index === fieldIndex
                              ? { ...item, unit: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="mt-1.5 w-full rounded-[15px] border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-nook-violet"
                      placeholder={
                        field.type === "duration" ? "Stunden" : "ml, kg …"
                      }
                    />
                  </label>
                )}
                {field.type === "multiselect" && (
                  <label className="mt-3 block text-xs font-medium">
                    Auswahlmöglichkeiten
                    <input
                      value={field.options.join(", ")}
                      onChange={(event) =>
                        setTrackerFields((current) =>
                          current.map((item, index) =>
                            index === fieldIndex
                              ? {
                                  ...item,
                                  options: event.target.value
                                    .split(",")
                                    .map((option) => option.trim()),
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1.5 w-full rounded-[15px] border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-nook-violet"
                      placeholder="ruhig, angespannt, müde"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium">Farbe</p>
          <div className="mt-2 flex gap-3">
            {(["rose", "peach", "violet", "blue", "teal"] as const).map(
              (color) => (
                <button
                  key={color}
                  onClick={() => setTrackerColor(color)}
                  className={[
                    `h-8 w-8 rounded-full ${colorClasses[color]}`,
                    trackerColor === color
                      ? "ring-2 ring-nook-ink ring-offset-2"
                      : "",
                  ].join(" ")}
                  aria-label={`Farbe ${color}`}
                />
              ),
            )}
          </div>
          {trackerError && (
            <p className="mt-3 text-sm text-rose-700">{trackerError}</p>
          )}
          <ModalActions
            saving={trackerSaving}
            onCancel={() => setTrackerEditorOpen(false)}
            onSave={createCustomTracker}
          />
        </Modal>
      )}

      {entryTracker && (
        <Modal onClose={() => setEntryTracker(null)} wide>
          <ModalHeading
            title={
              editingEntryId
                ? `${entryTracker.name} bearbeiten`
                : entryTracker.name
            }
            subtitle={
              editingEntryId
                ? "Passe den Eintrag in Ruhe an."
                : "Nur festhalten, was sich für dich hilfreich anfühlt."
            }
            onClose={() => setEntryTracker(null)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Beginn
              <input
                type="datetime-local"
                value={entryStartedAt}
                onChange={(event) => setEntryStartedAt(event.target.value)}
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
              />
            </label>
            <label className="block text-sm font-medium">
              Ende (optional)
              <input
                type="datetime-local"
                value={entryEndedAt}
                onChange={(event) => setEntryEndedAt(event.target.value)}
                className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
              />
            </label>
          </div>
          <div className="mt-5">
            {entryTracker.type === "menstruation" && (
              <MenstruationFields data={entryData} setData={setEntryData} />
            )}
            {entryTracker.type === "headache" && (
              <HeadacheFields data={entryData} setData={setEntryData} />
            )}
            {entryTracker.type === "custom" && (
              <CustomFields
                tracker={entryTracker}
                data={entryData}
                setData={setEntryData}
              />
            )}
          </div>
          <label className="mt-5 block text-sm font-medium">
            Notizen
            <textarea
              value={entryNotes}
              onChange={(event) => setEntryNotes(event.target.value)}
              className="mt-2 min-h-24 w-full resize-y rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
              placeholder="Was möchtest du zusätzlich festhalten?"
            />
          </label>
          {entryError && (
            <p className="mt-3 text-sm text-rose-700">{entryError}</p>
          )}
          <ModalActions
            saving={entrySaving}
            onCancel={() => setEntryTracker(null)}
            onSave={saveEntry}
          />
        </Modal>
      )}
    </>
  );
}

function zurichDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

function addDays(key: string, days: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  return Math.round(
    (dateFromKey(end).getTime() - dateFromKey(start).getTime()) / 86_400_000,
  );
}

function dateRange(start: string, end: string) {
  const days = Math.max(0, Math.min(60, daysBetween(start, end)));
  return Array.from({ length: days + 1 }, (_, index) => addDays(start, index));
}

function TrackingCalendar({
  title,
  subtitle,
  trackers,
  entries,
  onDaySelect,
  embedded = false,
}: {
  title: string;
  subtitle: string;
  trackers: TrackingTracker[];
  entries: TrackingEntry[];
  onDaySelect: (date: string) => void;
  embedded?: boolean;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = zurichDateKey(new Date());
  const trackerById = new Map(
    trackers.filter((tracker) => tracker.id).map((tracker) => [tracker.id, tracker]),
  );
  const entriesByDay = new Map<string, TrackingEntry[]>();
  entries.forEach((entry) => {
    if (!trackerById.has(entry.trackerId)) return;
    const key = zurichDateKey(entry.startedAt);
    entriesByDay.set(key, [...(entriesByDay.get(key) ?? []), entry]);
  });

  return (
    <section
      className={
        embedded
          ? "mt-6 border-t border-black/5 pt-6"
          : "mb-5 rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-100 text-teal-700">
            <CalendarDays size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-nook-muted">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft size={17} />
          </button>
          <p className="min-w-28 text-center text-sm font-medium sm:min-w-32">
            {new Intl.DateTimeFormat("de-CH", {
              month: "long",
              year: "numeric",
            }).format(visibleMonth)}
          </p>
          <button
            onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
            aria-label="Nächster Monat"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center text-[11px] text-nook-muted">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEntries = entriesByDay.get(key) ?? [];
          const dayTrackers = Array.from(
            new Map(
              dayEntries
                .map((entry) => trackerById.get(entry.trackerId))
                .filter((tracker): tracker is TrackingTracker => Boolean(tracker))
                .map((tracker) => [tracker.id, tracker]),
            ).values(),
          );
          return (
            <button
              key={key}
              onClick={() => onDaySelect(key)}
              className={[
                "relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-xs transition duration-300 hover:bg-white/90 sm:min-h-14",
                dayEntries.length ? "bg-white/78 shadow-sm" : "bg-white/35",
                key === today ? "ring-2 ring-nook-ink/45" : "",
              ].join(" ")}
              aria-label={`${day}. ${dayEntries.length} Einträge`}
            >
              <span>{day}</span>
              {dayTrackers.length > 0 && (
                <span className="absolute bottom-1.5 flex max-w-[80%] gap-1">
                  {dayTrackers.slice(0, 4).map((tracker) => (
                    <span
                      key={tracker.id}
                      className={`h-1.5 w-1.5 rounded-full ${dotClasses[tracker.color]}`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!embedded && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/5 pt-4 text-[11px] text-nook-muted">
          {trackers.map((tracker) => (
            <Legend
              key={`${tracker.type}-${tracker.id}`}
              color={dotClasses[tracker.color]}
              label={tracker.name}
              dot
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CycleCalendar({
  trackers,
  entries,
}: {
  trackers: TrackingTracker[];
  entries: TrackingEntry[];
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const menstrualTracker = trackers.find(
    (tracker) => tracker.type === "menstruation",
  );
  const menstrualEntries = entries
    .filter((entry) => entry.trackerId === menstrualTracker?.id)
    .sort(
      (left, right) =>
        new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime(),
    );
  const starts = menstrualEntries.map((entry) =>
    zurichDateKey(entry.startedAt),
  );
  const cycleLengths = starts
    .slice(1)
    .map((start, index) => daysBetween(starts[index], start))
    .filter((length) => length >= 15 && length <= 45);
  const averageCycle =
    cycleLengths.length > 0
      ? Math.round(
          cycleLengths.reduce((sum, length) => sum + length, 0) /
            cycleLengths.length,
        )
      : 28;
  const periodLengths = menstrualEntries
    .filter((entry) => entry.endedAt)
    .map(
      (entry) =>
        daysBetween(
          zurichDateKey(entry.startedAt),
          zurichDateKey(entry.endedAt as string),
        ) + 1,
    )
    .filter((length) => length >= 1 && length <= 12);
  const averagePeriod =
    periodLengths.length > 0
      ? Math.round(
          periodLengths.reduce((sum, length) => sum + length, 0) /
            periodLengths.length,
        )
      : 5;
  const actualPeriodDays = new Set(
    menstrualEntries.flatMap((entry) => {
      const start = zurichDateKey(entry.startedAt);
      const end = entry.endedAt
        ? zurichDateKey(entry.endedAt)
        : addDays(start, averagePeriod - 1);
      return dateRange(start, end);
    }),
  );
  const symptomDays = new Set(
    menstrualEntries
      .filter(
        (entry) =>
          (Array.isArray(entry.data.symptoms) &&
            entry.data.symptoms.length > 0) ||
          Number(entry.data.pain ?? 0) > 0,
      )
      .map((entry) => zurichDateKey(entry.startedAt)),
  );
  const today = zurichDateKey(new Date());
  const lastStart = starts.at(-1);
  let nextPeriod = lastStart ? addDays(lastStart, averageCycle) : "";
  while (nextPeriod && nextPeriod <= today) {
    nextPeriod = addDays(nextPeriod, averageCycle);
  }
  const ovulation = nextPeriod ? addDays(nextPeriod, -14) : "";
  const fertileStart = ovulation ? addDays(ovulation, -5) : "";
  const fertileEnd = ovulation ? addDays(ovulation, 1) : "";
  const predictedPeriodDays = new Set(
    nextPeriod
      ? dateRange(nextPeriod, addDays(nextPeriod, averagePeriod - 1))
      : [],
  );
  const fertileDays = new Set(
    fertileStart ? dateRange(fertileStart, fertileEnd) : [],
  );
  const deviation =
    cycleLengths.length > 1
      ? Math.sqrt(
          cycleLengths.reduce(
            (sum, length) => sum + (length - averageCycle) ** 2,
            0,
          ) / cycleLengths.length,
        )
      : Infinity;
  const confidence =
    cycleLengths.length >= 5 && deviation <= 2.5
      ? "Höher"
      : cycleLengths.length >= 2 && deviation <= 5
        ? "Mittel"
        : "Niedrig";
  const phase = !lastStart
    ? "Noch nicht berechenbar"
    : actualPeriodDays.has(today)
      ? "Menstruation"
      : fertileDays.has(today)
        ? "Fruchtbares Fenster (Schätzung)"
        : today < fertileStart
          ? "Follikelphase (Schätzung)"
          : "Lutealphase (Schätzung)";

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="mt-5 rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-nook backdrop-blur-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-100 text-rose-700">
            <CalendarDays size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              Zyklusansicht
            </h2>
            <p className="mt-1 text-xs text-nook-muted">
              Prognosen sind Schätzungen, keine medizinische Aussage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setVisibleMonth(new Date(year, month - 1, 1))
            }
            className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft size={17} />
          </button>
          <p className="min-w-32 text-center text-sm font-medium">
            {new Intl.DateTimeFormat("de-CH", {
              month: "long",
              year: "numeric",
            }).format(visibleMonth)}
          </p>
          <button
            onClick={() =>
              setVisibleMonth(new Date(year, month + 1, 1))
            }
            className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
            aria-label="Nächster Monat"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="grid grid-cols-7 text-center text-[11px] text-nook-muted">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
              <span key={day} className="py-2">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isActual = actualPeriodDays.has(key);
              const isPredicted = predictedPeriodDays.has(key);
              const isFertile = fertileDays.has(key);
              const isOvulation = key === ovulation;
              const hasSymptoms = symptomDays.has(key);
              return (
                <div
                  key={key}
                  className={[
                    "relative grid aspect-square min-h-9 place-items-center rounded-xl text-xs sm:min-h-11",
                    isActual
                      ? "bg-rose-200 text-rose-900"
                      : isPredicted
                        ? "border border-dashed border-rose-400 bg-rose-50"
                        : isFertile
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-white/45",
                    key === today ? "ring-2 ring-nook-ink/50" : "",
                  ].join(" ")}
                  title={
                    isActual
                      ? "Erfasster Menstruationstag"
                      : isPredicted
                        ? "Nächste Menstruation (Schätzung)"
                        : isOvulation
                          ? "Eisprung (Schätzung)"
                          : isFertile
                            ? "Fruchtbares Fenster (Schätzung)"
                            : undefined
                  }
                >
                  {day}
                  {isOvulation && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                  {hasSymptoms && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[18px] bg-white/58 px-4 py-3">
            <p className="text-xs text-nook-muted">Heutige Zyklusphase</p>
            <p className="mt-1 text-sm font-medium">{phase}</p>
          </div>
          <div className="rounded-[18px] bg-white/58 px-4 py-3">
            <p className="text-xs text-nook-muted">
              Nächste Menstruation (Schätzung)
            </p>
            <p className="mt-1 text-sm font-medium">
              {nextPeriod
                ? new Intl.DateTimeFormat("de-CH", {
                    dateStyle: "long",
                  }).format(dateFromKey(nextPeriod))
                : "Nach dem ersten Eintrag sichtbar"}
            </p>
          </div>
          <div className="rounded-[18px] bg-white/58 px-4 py-3">
            <p className="text-xs text-nook-muted">Prognosesicherheit</p>
            <p className="mt-1 text-sm font-medium">{confidence}</p>
            <p className="mt-1 text-[11px] leading-4 text-nook-muted">
              {cycleLengths.length
                ? `Basiert auf ${cycleLengths.length + 1} erfassten Zyklusbeginnen.`
                : "Mit weiteren vollständigen Zyklen wird die Schätzung verlässlicher."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/5 pt-4 text-[11px] text-nook-muted">
        <Legend color="bg-rose-200" label="Erfasste Menstruation" />
        <Legend color="border border-dashed border-rose-400 bg-rose-50" label="Nächste Menstruation (Schätzung)" />
        <Legend color="bg-emerald-100" label="Fruchtbares Fenster (Schätzung)" />
        <Legend color="bg-violet-500" label="Eisprung (Schätzung)" dot />
        <Legend color="bg-orange-500" label="Symptome erfasst" dot />
      </div>
      <p className="mt-4 text-[11px] leading-5 text-nook-muted">
        Zyklusprognosen können deutlich abweichen und sind nicht zur Verhütung
        oder medizinischen Beurteilung geeignet.
      </p>
    </section>
  );
}

function Legend({
  color,
  label,
  dot = false,
}: {
  color: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`${dot ? "h-2 w-2 rounded-full" : "h-4 w-4 rounded-md"} ${color}`}
      />
      {label}
    </span>
  );
}

function MenstruationFields({
  data,
  setData,
}: {
  data: Record<string, unknown>;
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Stärke der Blutung"
        value={String(data.flow ?? "")}
        options={["Leicht", "Mittel", "Stark", "Sehr stark"]}
        onChange={(value) => setData((current) => ({ ...current, flow: value }))}
      />
      <ScaleField
        label="Schmerzen"
        value={Number(data.pain ?? 0)}
        onChange={(value) => setData((current) => ({ ...current, pain: value }))}
      />
      <SelectField
        label="Stimmung"
        value={String(data.mood ?? "")}
        options={["Ruhig", "Gut", "Sensibel", "Gereizt", "Niedergeschlagen"]}
        onChange={(value) => setData((current) => ({ ...current, mood: value }))}
      />
      <MultiField
        label="Symptome"
        options={["Krämpfe", "Müdigkeit", "Blähungen", "Kopfschmerzen", "Übelkeit"]}
        values={Array.isArray(data.symptoms) ? (data.symptoms as string[]) : []}
        onChange={(value) =>
          setData((current) => ({ ...current, symptoms: value }))
        }
      />
    </div>
  );
}

function HeadacheFields({
  data,
  setData,
}: {
  data: Record<string, unknown>;
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ScaleField
        label="Intensität"
        value={Number(data.intensity ?? 0)}
        onChange={(value) =>
          setData((current) => ({ ...current, intensity: value }))
        }
      />
      <SelectField
        label="Art des Schmerzes"
        value={String(data.painType ?? "")}
        options={["Pulsierend", "Drückend", "Stechend", "Einseitig", "Beidseitig"]}
        onChange={(value) =>
          setData((current) => ({ ...current, painType: value }))
        }
      />
      <TextField
        label="Mögliche Auslöser"
        value={String(data.triggers ?? "")}
        onChange={(value) =>
          setData((current) => ({ ...current, triggers: value }))
        }
        placeholder="Schlaf, Stress, Wetter …"
      />
      <MultiField
        label="Begleitsymptome"
        options={["Übelkeit", "Lichtempfindlichkeit", "Lärmempfindlichkeit", "Aura", "Schwindel"]}
        values={
          Array.isArray(data.symptoms) ? (data.symptoms as string[]) : []
        }
        onChange={(value) =>
          setData((current) => ({ ...current, symptoms: value }))
        }
      />
      <TextField
        label="Medikamente"
        value={String(data.medication ?? "")}
        onChange={(value) =>
          setData((current) => ({ ...current, medication: value }))
        }
        placeholder="Name und Dosis"
      />
      <SelectField
        label="Wirkung der Medikamente"
        value={String(data.medicationEffect ?? "")}
        options={["Keine", "Leicht", "Gut", "Sehr gut"]}
        onChange={(value) =>
          setData((current) => ({ ...current, medicationEffect: value }))
        }
      />
    </div>
  );
}

function CustomFields({
  tracker,
  data,
  setData,
}: {
  tracker: TrackingTracker;
  data: Record<string, unknown>;
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {tracker.fields.map((field) => (
        <CustomFieldInput
          key={field.id}
          field={field}
          value={data[field.id]}
          onChange={(value) =>
            setData((current) => ({ ...current, [field.id]: value }))
          }
        />
      ))}
    </div>
  );
}

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: TrackingField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <div>
        <p className="text-sm font-medium">{field.label}</p>
        <div className="mt-2 flex gap-3">
          {["Ja", "Nein"].map((label) => (
            <button
              key={label}
              onClick={() => onChange(label === "Ja")}
              className={[
                "rounded-2xl border px-5 py-3 text-sm",
                value === (label === "Ja")
                  ? "border-nook-violet bg-nook-violet/10"
                  : "border-black/10 bg-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (field.type === "scale") {
    return (
      <ScaleField
        label={field.label}
        value={Number(value ?? 0)}
        onChange={onChange}
      />
    );
  }
  if (field.type === "multiselect") {
    return (
      <MultiField
        label={field.label}
        options={field.options.filter(Boolean)}
        values={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
      />
    );
  }
  if (field.type === "text") {
    return (
      <TextField
        label={field.label}
        value={String(value ?? "")}
        onChange={onChange}
        placeholder="Was möchtest du festhalten?"
      />
    );
  }
  return (
    <label className="block text-sm font-medium">
      {field.label} {field.unit ? `(${field.unit})` : ""}
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
      />
    </label>
  );
}

function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}: {value || "–"}
      <input
        type="range"
        min={1}
        max={10}
        value={value || 1}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-nook-violet"
      />
      <span className="mt-1 flex justify-between text-[10px] text-nook-muted">
        <span>1</span>
        <span>10</span>
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
      >
        <option value="">Nicht angegeben</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 outline-none"
        placeholder={placeholder}
      />
    </label>
  );
}

function MultiField({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              onClick={() =>
                onChange(
                  selected
                    ? values.filter((value) => value !== option)
                    : [...values, option],
                )
              }
              className={[
                "rounded-full border px-3 py-2 text-xs transition",
                selected
                  ? "border-nook-violet bg-nook-violet/10 text-nook-violet"
                  : "border-black/10 bg-white",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/25 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className={`my-4 w-full rounded-[28px] bg-nook-card p-6 shadow-nook ${
          wide ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeading({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="mt-1 text-sm text-nook-muted">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-full bg-black/5"
        aria-label="Schließen"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalActions({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5 flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="rounded-2xl bg-black/5 px-4 py-2.5 text-sm"
      >
        Abbrechen
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-2xl bg-nook-violet px-4 py-2.5 text-sm text-white disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? "Speichert …" : "Speichern"}
      </button>
    </div>
  );
}
