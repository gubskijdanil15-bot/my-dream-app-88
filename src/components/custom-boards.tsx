import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useBoardCards,
  useBoardColumns,
  useBoards,
  useCreateBoard,
  useCreateCard,
  useCreateColumn,
  useDeleteBoard,
  useDeleteCard,
  useDeleteColumn,
  useUpdateBoard,
  useUpdateCard,
  useUpdateColumn,
  type Board,
} from "@/lib/boards-data";

type Props = { ownerId?: string; canEdit: boolean; formOpen: boolean; onCloseForm: () => void };

const field =
  "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

/** Standalone custom Kanban boards: create boards, columns and cards freely. */
export function CustomBoards({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const boards = useBoards(ownerId);
  const createBoard = useCreateBoard(ownerId);
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<Board | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const open = boards.data?.find((b) => b.id === openId) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    try {
      const created = await createBoard.mutateAsync({
        name: value.slice(0, 80),
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      onCloseForm();
      setOpenId(created.id);
    } catch {
      toast.error(t("boards.err"));
    }
  }

  if (open) {
    return (
      <BoardDetail
        board={open}
        canEdit={canEdit}
        ownerId={ownerId}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <div>
      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="animate-entry mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("boards.name")}
            maxLength={80}
            className={field}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("boards.desc")}
            maxLength={200}
            className={field}
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground"
          >
            {t("ws.add")}
          </button>
        </form>
      )}

      {boards.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("boards.empty")}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {boards.data?.map((board) => (
          <article
            key={board.id}
            className="animate-entry rounded-2xl border border-border bg-card p-5"
          >
            {renaming === board.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = renameValue.trim();
                  if (value) updateBoard.mutate({ id: board.id, name: value.slice(0, 80) });
                  setRenaming(null);
                }}
                className="flex gap-2"
              >
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  maxLength={80}
                  className={field}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background"
                >
                  {t("ws.save")}
                </button>
              </form>
            ) : (
              <h3 className="break-words text-base font-bold">{board.name}</h3>
            )}
            {board.description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {board.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOpenId(board.id)}
                className="rounded-full bg-foreground px-4 py-2 text-[11px] font-bold text-background hover:bg-accent"
              >
                {t("boards.open")}
              </button>
              {canEdit && (
                <>
                  <button
                    onClick={() => {
                      setRenaming(board.id);
                      setRenameValue(board.name);
                    }}
                    className="rounded-full border border-border px-4 py-2 text-[11px] font-bold text-muted-foreground hover:border-accent hover:text-accent"
                  >
                    {t("boards.rename")}
                  </button>
                  <button
                    onClick={() => setPending(board)}
                    className="rounded-full border border-border px-4 py-2 text-[11px] font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    {t("ws.delete")}
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        messageKey="confirm.deleteBoard"
        detail={pending?.name}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && deleteBoard.mutate(pending.id)}
      />
    </div>
  );
}

function BoardDetail({
  board,
  canEdit,
  ownerId,
  onBack,
}: {
  board: Board;
  canEdit: boolean;
  ownerId?: string;
  onBack: () => void;
}) {
  const { t } = useLang();
  const columns = useBoardColumns(board.id);
  const cards = useBoardCards(board.id);
  const createColumn = useCreateColumn(ownerId);
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const createCard = useCreateCard(ownerId);
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [columnName, setColumnName] = useState("");
  const [cardDrafts, setCardDrafts] = useState<Record<string, string>>({});
  const [pendingColumn, setPendingColumn] = useState<string | null>(null);
  const [pendingCard, setPendingCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");

  const cols = columns.data ?? [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full border border-border px-4 py-2 text-[11px] font-bold text-muted-foreground hover:border-accent hover:text-accent"
        >
          ← {t("boards.back")}
        </button>
        <h2 className="min-w-0 break-words text-lg font-extrabold">{board.name}</h2>
        <span className="text-[11px] text-muted-foreground">
          {(cards.data ?? []).length} {t("boards.cards")}
        </span>
      </div>

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = columnName.trim();
            if (!value) return;
            createColumn.mutate(
              { board_id: board.id, name: value.slice(0, 60), position: cols.length },
              { onError: () => toast.error(t("boards.err")) },
            );
            setColumnName("");
          }}
          className="mb-5 flex flex-wrap gap-2"
        >
          <input
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder={t("boards.columnName")}
            maxLength={60}
            className={`${field} max-w-xs`}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:bg-accent"
          >
            + {t("boards.addColumn")}
          </button>
        </form>
      )}

      {cols.length === 0 && <p className="text-xs text-muted-foreground">{t("boards.noColumns")}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {cols.map((column) => {
          const items = (cards.data ?? []).filter((c) => c.column_id === column.id);
          return (
            <section
              key={column.id}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card/60 p-3"
            >
              <header className="mb-3 flex items-center gap-2">
                <input
                  defaultValue={column.name}
                  disabled={!canEdit}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && value !== column.name)
                      updateColumn.mutate({ id: column.id, name: value.slice(0, 60) });
                  }}
                  aria-label={t("boards.columnName")}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xs font-bold focus:border-border focus:outline-none"
                />
                <span className="shrink-0 text-[11px] text-muted-foreground">{items.length}</span>
                {canEdit && (
                  <button
                    onClick={() => setPendingColumn(column.id)}
                    aria-label={`${t("ws.delete")} ${column.name}`}
                    className="shrink-0 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                )}
              </header>

              {items.length === 0 && (
                <p className="mb-2 text-[11px] text-muted-foreground">{t("kan.empty")}</p>
              )}

              <ul className="space-y-2">
                {items.map((card) => (
                  <li key={card.id} className="rounded-xl border border-border bg-card p-3">
                    {editingCard === card.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const value = editTitle.trim();
                          if (!value) return;
                          updateCard.mutate({
                            id: card.id,
                            title: value.slice(0, 200),
                            detail: editDetail.trim() || null,
                          });
                          setEditingCard(null);
                        }}
                        className="grid gap-2"
                      >
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          maxLength={200}
                          className={field}
                        />
                        <input
                          value={editDetail}
                          onChange={(e) => setEditDetail(e.target.value)}
                          placeholder={t("boards.cardDetail")}
                          maxLength={400}
                          className={field}
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-bold text-background"
                          >
                            {t("ws.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCard(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
                          >
                            {t("ws.cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="break-words text-sm font-semibold">{card.title}</p>
                        {card.detail && (
                          <p className="mt-1 break-words text-[11px] leading-relaxed text-muted-foreground">
                            {card.detail}
                          </p>
                        )}
                        {canEdit && (
                          <>
                            <select
                              value={card.column_id}
                              onChange={(e) =>
                                updateCard.mutate({ id: card.id, column_id: e.target.value })
                              }
                              aria-label={`${t("boards.moveTo")} — ${card.title}`}
                              className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] focus:outline-none"
                            >
                              {cols.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <div className="mt-2 flex gap-3">
                              <button
                                onClick={() => {
                                  setEditingCard(card.id);
                                  setEditTitle(card.title);
                                  setEditDetail(card.detail ?? "");
                                }}
                                className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
                              >
                                {t("okr.edit")}
                              </button>
                              <button
                                onClick={() => setPendingCard(card.id)}
                                className="text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                              >
                                {t("ws.delete")}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {canEdit && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = (cardDrafts[column.id] ?? "").trim();
                    if (!value) return;
                    createCard.mutate(
                      {
                        board_id: board.id,
                        column_id: column.id,
                        title: value.slice(0, 200),
                        detail: null,
                        position: items.length,
                      },
                      { onError: () => toast.error(t("boards.err")) },
                    );
                    setCardDrafts((prev) => ({ ...prev, [column.id]: "" }));
                  }}
                  className="mt-3"
                >
                  <input
                    value={cardDrafts[column.id] ?? ""}
                    onChange={(e) =>
                      setCardDrafts((prev) => ({ ...prev, [column.id]: e.target.value }))
                    }
                    placeholder={`+ ${t("boards.addCard")}`}
                    maxLength={200}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </form>
              )}
            </section>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!pendingColumn}
        messageKey="confirm.deleteColumn"
        onCancel={() => setPendingColumn(null)}
        onConfirm={() => pendingColumn && deleteColumn.mutate(pendingColumn)}
      />
      <ConfirmDialog
        open={!!pendingCard}
        messageKey="confirm.deleteCard"
        onCancel={() => setPendingCard(null)}
        onConfirm={() => pendingCard && deleteCard.mutate(pendingCard)}
      />
    </div>
  );
}
