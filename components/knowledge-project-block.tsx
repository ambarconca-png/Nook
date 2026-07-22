"use client";

import { useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Link2,
  ListChecks,
  Plus,
  Table2,
  Trash2,
  Type,
  Underline,
} from "lucide-react";
import type { KnowledgeProjectBlock } from "@/lib/types";

type ChecklistContent = {
  items: { text: string; done: boolean }[];
};

type LinkContent = {
  url: string;
  description: string;
};

type TableContent = {
  columns: string[];
  rows: string[][];
};

type TextContent = { html: string };

function parseContent<T>(content: string, fallback: T): T {
  try {
    return { ...fallback, ...JSON.parse(content) } as T;
  } catch {
    return fallback;
  }
}

export function KnowledgeProjectBlockCard({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: KnowledgeProjectBlock;
  onUpdate: (block: KnowledgeProjectBlock) => Promise<void>;
  onDelete: (block: KnowledgeProjectBlock) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [title, setTitle] = useState(block.title);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistContent>(() =>
    parseContent(block.content, { items: [] }),
  );
  const [link, setLink] = useState<LinkContent>(() =>
    parseContent(block.content, { url: "", description: "" }),
  );
  const [table, setTable] = useState<TableContent>(() =>
    parseContent(block.content, {
      columns: ["Spalte 1", "Spalte 2"],
      rows: [["", ""]],
    }),
  );
  const [text] = useState<TextContent>(() =>
    parseContent(block.content, { html: "" }),
  );
  const textEditorRef = useRef<HTMLDivElement>(null);

  const Icon =
    block.type === "text"
      ? Type
      : block.type === "checklist"
      ? ListChecks
      : block.type === "link"
        ? Link2
        : Table2;

  async function save(
    nextContent?: ChecklistContent | LinkContent | TableContent | TextContent,
  ) {
    setSaving(true);
    try {
      const content =
        nextContent ??
        (block.type === "text"
          ? text
          : block.type === "checklist"
          ? checklist
          : block.type === "link"
            ? link
            : table);
      await onUpdate({ ...block, title, content: JSON.stringify(content) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[22px] border border-black/[0.06] bg-white/58 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-nook-violet/10 text-nook-violet">
          <Icon size={17} strokeWidth={1.7} />
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-medium outline-none"
          aria-label="Blocktitel"
        />
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5"
            aria-label={`${block.title} nach oben verschieben`}
          >
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5"
            aria-label={`${block.title} nach unten verschieben`}
          >
            <ChevronDown size={14} />
          </button>
        )}
        <button
          onClick={() => onDelete(block)}
          className="grid h-8 w-8 place-items-center rounded-full text-nook-muted transition hover:bg-rose-50 hover:text-rose-700"
          aria-label="Inhaltsblock löschen"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {block.type === "checklist" && (
        <div className="mt-4 space-y-2">
          {checklist.items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(event) => {
                  const items = checklist.items.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, done: event.target.checked }
                      : current,
                  );
                  const next = { items };
                  setChecklist(next);
                  void save(next);
                }}
                className="h-4 w-4 shrink-0 accent-nook-violet"
              />
              <input
                value={item.text}
                onChange={(event) =>
                  setChecklist((current) => ({
                    items: current.items.map((currentItem, itemIndex) =>
                      itemIndex === index
                        ? { ...currentItem, text: event.target.value }
                        : currentItem,
                    ),
                  }))
                }
                className={[
                  "min-w-0 flex-1 border-b border-black/[0.06] bg-transparent py-2 text-sm outline-none focus:border-nook-violet/40",
                  item.done ? "text-nook-muted line-through" : "",
                ].join(" ")}
                placeholder="Punkt hinzufügen …"
              />
              {index > 0 && (
                <button
                  onClick={() => {
                    const items = [...checklist.items];
                    [items[index - 1], items[index]] = [
                      items[index],
                      items[index - 1],
                    ];
                    const next = { items };
                    setChecklist(next);
                    void save(next);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5"
                  aria-label="Checklistenpunkt nach oben verschieben"
                >
                  <ChevronUp size={14} />
                </button>
              )}
              {index < checklist.items.length - 1 && (
                <button
                  onClick={() => {
                    const items = [...checklist.items];
                    [items[index], items[index + 1]] = [
                      items[index + 1],
                      items[index],
                    ];
                    const next = { items };
                    setChecklist(next);
                    void save(next);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-nook-muted hover:bg-black/5"
                  aria-label="Checklistenpunkt nach unten verschieben"
                >
                  <ChevronDown size={14} />
                </button>
              )}
              <button
                onClick={() =>
                  setChecklist((current) => ({
                    items: current.items.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
                }
                className="text-nook-muted hover:text-rose-700"
                aria-label="Checklistenpunkt entfernen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setChecklist((current) => ({
                items: [...current.items, { text: "", done: false }],
              }))
            }
            className="mt-2 flex items-center gap-2 text-sm text-nook-violet"
          >
            <Plus size={14} />
            Punkt hinzufügen
          </button>
        </div>
      )}

      {block.type === "text" && (
        <div className="mt-4">
          <div className="mb-2 flex gap-1">
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                document.execCommand("bold");
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 text-nook-muted hover:text-nook-violet"
              aria-label="Fett"
            >
              <Bold size={15} />
            </button>
            <button
              onMouseDown={(event) => {
                event.preventDefault();
                document.execCommand("underline");
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 text-nook-muted hover:text-nook-violet"
              aria-label="Unterstrichen"
            >
              <Underline size={15} />
            </button>
          </div>
          <div
            ref={textEditorRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: text.html }}
            onPaste={(event) => {
              event.preventDefault();
              document.execCommand(
                "insertText",
                false,
                event.clipboardData.getData("text/plain"),
              );
            }}
            className="min-h-28 rounded-[16px] border border-black/10 bg-white/65 px-4 py-3 text-sm leading-7 outline-none focus:border-nook-violet"
            data-placeholder="Schreib einfach los …"
            aria-label="Textinhalt"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={() =>
                void save({ html: textEditorRef.current?.innerHTML ?? "" })
              }
              disabled={saving}
              className="rounded-xl bg-nook-violet px-3 py-2 text-xs text-white disabled:opacity-60"
            >
              {saving ? "Speichert …" : "Text speichern"}
            </button>
          </div>
        </div>
      )}

      {block.type === "link" && (
        <div className="mt-4 space-y-3">
          <input
            type="url"
            value={link.url}
            onChange={(event) =>
              setLink((current) => ({ ...current, url: event.target.value }))
            }
            className="w-full rounded-[16px] border border-black/10 bg-white/75 px-4 py-3 text-sm outline-none focus:border-nook-violet"
            placeholder="https://…"
          />
          <textarea
            value={link.description}
            onChange={(event) =>
              setLink((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            className="min-h-20 w-full resize-y rounded-[16px] border border-black/10 bg-white/75 px-4 py-3 text-sm outline-none focus:border-nook-violet"
            placeholder="Warum ist dieser Link wichtig?"
          />
          {/^https?:\/\//i.test(link.url) && (
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-nook-violet"
            >
              <Link2 size={14} />
              Link öffnen
            </a>
          )}
        </div>
      )}

      {block.type === "table" && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {table.columns.map((column, columnIndex) => (
                  <th
                    key={columnIndex}
                    className="min-w-32 border-b border-black/10 p-2 text-left"
                  >
                    <input
                      value={column}
                      onChange={(event) =>
                        setTable((current) => ({
                          ...current,
                          columns: current.columns.map(
                            (currentColumn, index) =>
                              index === columnIndex
                                ? event.target.value
                                : currentColumn,
                          ),
                        }))
                      }
                      className="w-full bg-transparent font-medium outline-none"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {table.columns.map((_, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="border-b border-black/[0.05] p-2"
                    >
                      <input
                        value={row[columnIndex] ?? ""}
                        onChange={(event) =>
                          setTable((current) => ({
                            ...current,
                            rows: current.rows.map((currentRow, index) =>
                              index === rowIndex
                                ? current.columns.map((_, cellIndex) =>
                                    cellIndex === columnIndex
                                      ? event.target.value
                                      : (currentRow[cellIndex] ?? ""),
                                  )
                                : currentRow,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-4">
            <button
              onClick={() =>
                setTable((current) => ({
                  ...current,
                  rows: [
                    ...current.rows,
                    current.columns.map(() => ""),
                  ],
                }))
              }
              className="text-sm text-nook-violet"
            >
              + Zeile
            </button>
            <button
              onClick={() =>
                setTable((current) => ({
                  columns: [
                    ...current.columns,
                    `Spalte ${current.columns.length + 1}`,
                  ],
                  rows: current.rows.map((row) => [...row, ""]),
                }))
              }
              className="text-sm text-nook-violet"
            >
              + Spalte
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => save()}
          disabled={saving}
          className="rounded-2xl bg-nook-violet/10 px-4 py-2 text-sm text-nook-violet disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Speichert …" : "Block speichern"}
        </button>
      </div>
    </section>
  );
}
