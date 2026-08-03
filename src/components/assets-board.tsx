import { useState } from "react";
import { toast } from "sonner";
import { useLang, type TranslationKey } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  EQUIPMENT_CATEGORIES,
  useCreateEquipment,
  useCreateLocation,
  useDeleteEquipment,
  useDeleteLocation,
  useEquipment,
  useLocations,
  useUpdateEquipment,
  type Equipment,
  type EquipmentCategory,
  type Location,
} from "@/lib/production-data";

const catLabel: Record<EquipmentCategory, TranslationKey> = {
  camera: "eq.camera",
  audio: "eq.audio",
  lighting: "eq.lighting",
  grip: "eq.grip",
  other: "eq.other",
};

const field =
  "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

type Props = { ownerId?: string; canEdit: boolean; formOpen: boolean; onCloseForm: () => void };

export function AssetsBoard({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const [section, setSection] = useState<"equipment" | "locations">("equipment");

  return (
    <div>
      <div className="mb-5 flex">
        <div className="inline-flex rounded-full border border-border p-1">
          {(
            [
              ["equipment", "assets.equipment"],
              ["locations", "assets.locations"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              aria-pressed={section === key}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                section === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-accent"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {section === "equipment" ? (
        <EquipmentList
          ownerId={ownerId}
          canEdit={canEdit}
          formOpen={formOpen}
          onCloseForm={onCloseForm}
        />
      ) : (
        <LocationList
          ownerId={ownerId}
          canEdit={canEdit}
          formOpen={formOpen}
          onCloseForm={onCloseForm}
        />
      )}
    </div>
  );
}

function EquipmentList({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const items = useEquipment(ownerId);
  const create = useCreateEquipment(ownerId);
  const update = useUpdateEquipment();
  const remove = useDeleteEquipment();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("camera");
  const [ownerNote, setOwnerNote] = useState("");
  const [assigned, setAssigned] = useState("");
  const [pending, setPending] = useState<Equipment | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    try {
      await create.mutateAsync({
        name: value.slice(0, 120),
        category,
        owner_note: ownerNote.trim() || null,
        assigned_to: assigned.trim() || null,
      });
      setName("");
      setOwnerNote("");
      setAssigned("");
      onCloseForm();
    } catch {
      toast.error(t("ws.errNote"));
    }
  }

  return (
    <div>
      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="animate-entry mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("assets.name")}
            maxLength={120}
            className={field}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
            aria-label={t("assets.equipment")}
            className={field}
          >
            {EQUIPMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(catLabel[c])}
              </option>
            ))}
          </select>
          <input
            value={ownerNote}
            onChange={(e) => setOwnerNote(e.target.value)}
            placeholder={t("assets.owner")}
            maxLength={160}
            className={field}
          />
          <input
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
            placeholder={t("assets.assigned")}
            maxLength={80}
            className={field}
          />
          <button
            type="submit"
            className="justify-self-start rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground sm:col-span-2 xl:col-span-4"
          >
            {t("ws.add")}
          </button>
        </form>
      )}

      {items.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("assets.emptyEquipment")}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.data?.map((item) => (
          <article
            key={item.id}
            className="animate-entry grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <button
              onClick={() => canEdit && update.mutate({ id: item.id, packed: !item.packed })}
              disabled={!canEdit}
              aria-pressed={item.packed}
              aria-label={`${t("assets.packed")} — ${item.name}`}
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                item.packed ? "border-accent bg-accent" : "border-border"
              }`}
            >
              <span
                className={`size-1.5 rounded-full bg-background ${item.packed ? "opacity-100" : "opacity-0"}`}
              />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`min-w-0 break-words text-sm font-bold ${item.packed ? "text-muted-foreground line-through" : ""}`}
                >
                  {item.name}
                </h3>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {t(catLabel[item.category])}
                </span>
              </div>
              {item.owner_note && (
                <p className="mt-1 text-xs text-muted-foreground">{item.owner_note}</p>
              )}
              {item.assigned_to && (
                <p className="mt-0.5 text-[11px] text-accent">
                  {t("assets.assigned")}: {item.assigned_to}
                </p>
              )}
              {canEdit && (
                <button
                  onClick={() => setPending(item)}
                  className="mt-2 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                >
                  {t("ws.delete")}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        messageKey="confirm.deleteEquipment"
        detail={pending?.name}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
    </div>
  );
}

function LocationList({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const items = useLocations(ownerId);
  const create = useCreateLocation(ownerId);
  const remove = useDeleteLocation();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<Location | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    try {
      await create.mutateAsync({
        name: value.slice(0, 120),
        address: address.trim() || null,
        contact: contact.trim() || null,
        notes: notes.trim() || null,
      });
      setName("");
      setAddress("");
      setContact("");
      setNotes("");
      onCloseForm();
    } catch {
      toast.error(t("ws.errNote"));
    }
  }

  return (
    <div>
      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="animate-entry mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("assets.name")}
            maxLength={120}
            className={field}
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("assets.address")}
            maxLength={200}
            className={field}
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("assets.contact")}
            maxLength={120}
            className={field}
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("assets.notes")}
            maxLength={300}
            className={field}
          />
          <button
            type="submit"
            className="justify-self-start rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground sm:col-span-2"
          >
            {t("ws.add")}
          </button>
        </form>
      )}

      {items.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("assets.emptyLocations")}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.data?.map((item) => (
          <article
            key={item.id}
            className="animate-entry rounded-2xl border border-border bg-card p-4"
          >
            <h3 className="break-words text-sm font-bold">{item.name}</h3>
            {item.address && (
              <p className="mt-1 text-xs text-muted-foreground">{item.address}</p>
            )}
            {item.contact && <p className="mt-0.5 text-[11px] text-accent">{item.contact}</p>}
            {item.notes && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.notes}</p>
            )}
            {canEdit && (
              <button
                onClick={() => setPending(item)}
                className="mt-2 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
              >
                {t("ws.delete")}
              </button>
            )}
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        messageKey="confirm.deleteLocation"
        detail={pending?.name}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.id)}
      />
    </div>
  );
}
