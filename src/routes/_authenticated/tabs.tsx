import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';

export type NoteItem = { id: string; title: string; body: string; created_at: string; updated_at: string };
export type GoalItem = { id: string; title: string; date?: string | null; priority: 'low'|'medium'|'high'; progress: number };

function uid() { return Math.random().toString(36).slice(2); }

function useLocalList<T>(key: string, initial: T[]) {
  const [list, setList] = useState<T[]>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : initial; } catch { return initial; }
  });
  useEffect(()=>{ try { localStorage.setItem(key, JSON.stringify(list)); } catch {} }, [key, list]);
  return [list, setList] as const;
}

export function Tabs() {
  const { t } = useLang();
  const [tab, setTab] = useState<'notes'|'goals'>('notes');
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="mb-4 flex gap-2">
        {(['notes','goals'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-xs font-bold ${tab===k?'bg-accent text-accent-foreground':'bg-card text-muted-foreground border border-border'}`}>
            {k==='notes'? t('ws.notes') : t('ws.tabPlan')}
          </button>
        ))}
      </div>
      {tab==='notes' ? <NotesTab /> : <GoalsTab />}
    </div>
  );
}

export function NotesTab() {
  const { t } = useLang();
  const [notes, setNotes] = useLocalList<NoteItem>('pw.notes', []);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const add = () => {
    const title = (titleRef.current?.value || '').trim();
    const body = (bodyRef.current?.value || '').trim();
    if (!title && !body) return;
    const now = new Date().toISOString();
    setNotes((list) => [{ id: uid(), title: title || 'Untitled', body, created_at: now, updated_at: now }, ...list].slice(0,200));
    if (titleRef.current) titleRef.current.value = '';
    if (bodyRef.current) bodyRef.current.value = '';
  };
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="label-mono mb-4">{t('ws.notes')}</h2>
      <div className="mb-3 grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)_auto]">
        <input ref={titleRef} placeholder={t('ws.quickCapture')} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <textarea ref={bodyRef} placeholder={t('ws.writeItOut')} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" 
          onInput={() => {
            if (saveDebounce.current) clearTimeout(saveDebounce.current);
            saveDebounce.current = setTimeout(() => {
              // No autosave to backend — only UI responsiveness guard
            }, 600);
          }}
        />
        <button onClick={add} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-accent">{t('ws.add')}</button>
      </div>
      <ul className="space-y-3">
        {notes.length===0 && (<li className="text-xs text-muted-foreground">{t('ws.emptyNotes')}</li>)}
        {notes.map(n => (
          <li key={n.id} className="rounded-xl border border-border bg-background p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <strong className="truncate text-sm">{n.title}</strong>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{new Date(n.updated_at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-xs text-muted-foreground">{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GoalsTab() {
  const { t } = useLang();
  const [goals, setGoals] = useLocalList<GoalItem>('pw.goals', []);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [priority, setPriority] = useState<GoalItem['priority']>('medium');
  const [progress, setProgress] = useState<number>(0);
  const add = () => {
    const title = (titleRef.current?.value || '').trim();
    const date = dateRef.current?.value || null;
    if (!title) return;
    setGoals((list) => [{ id: uid(), title, date, priority, progress } , ...list].slice(0,200));
    if (titleRef.current) titleRef.current.value = '';
    if (dateRef.current) dateRef.current.value = '';
    setProgress(0);
    setPriority('medium');
  };
  const update = (id: string, patch: Partial<GoalItem>) => setGoals(list => list.map(g => g.id===id ? { ...g, ...patch } : g));
  const remove = (id: string) => setGoals(list => list.filter(g => g.id!==id));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="label-mono mb-4">{t('ws.activeGoals')}</h2>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
        <input ref={titleRef} placeholder={t('ws.goal')} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input ref={dateRef} type="date" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <select value={priority} onChange={(e)=>setPriority(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="high">{t('priority.high')}</option>
          <option value="medium">{t('priority.medium')}</option>
          <option value="low">{t('priority.low')}</option>
        </select>
        <button onClick={add} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-accent">{t('ws.add')}</button>
      </div>

      <ul className="space-y-4">
        {goals.length===0 && (<li className="text-xs text-muted-foreground">{t('ws.emptyGoals')}</li>)}
        {goals.map(g => (
          <li key={g.id} className="space-y-2 rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate text-sm">{g.title}</strong>
                <span className="font-mono text-[10px] text-muted-foreground">{g.date ? `${t('ws.target')}: ${g.date}` : t('ws.ongoing')}</span>
              </div>
              <select value={g.priority} onChange={(e)=>update(g.id,{priority:e.target.value as any})} className="rounded-lg border border-border bg-card px-2 py-1 text-[11px]">
                <option value="high">{t('priority.high')}</option>
                <option value="medium">{t('priority.medium')}</option>
                <option value="low">{t('priority.low')}</option>
              </select>
              <button onClick={()=>remove(g.id)} className="text-[11px] text-muted-foreground hover:text-destructive">{t('ws.del')}</button>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} value={g.progress} onChange={(e)=>update(g.id,{progress: Number(e.target.value)})} />
              <span className="w-10 text-right font-mono text-[10px]">{g.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full bg-accent" style={{ width: `${g.progress}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
