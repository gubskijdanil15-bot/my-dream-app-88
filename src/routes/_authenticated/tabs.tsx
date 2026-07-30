import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';

// Types
export type NoteItem = { id: string; title: string; body: string; created_at: string; updated_at: string };
export type GoalItem = { id: string; title: string; date?: string | null; priority: 'low'|'medium'|'high'; progress: number };
export type PlanTask = { id: string; title: string; priority: 'low'|'medium'|'high'; done: boolean };

// Utils
function uid() { return Math.random().toString(36).slice(2); }

function useLocalList<T>(key: string, initial: T[]) {
  const [list, setList] = useState<T[]>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : initial; } catch { return initial; }
  });
  useEffect(()=>{ try { localStorage.setItem(key, JSON.stringify(list)); } catch {} }, [key, list]);
  return [list, setList] as const;
}

// Tabs root
export function Tabs() {
  const { t } = useLang();
  const [tab, setTab] = useState<'notes'|'goals'|'plan'>('notes');
  const TabBtn = ({k,label}:{k:'notes'|'goals'|'plan';label:string}) => (
    <button onClick={()=>setTab(k)} className={`rounded-full px-4 py-2 text-xs font-bold ${tab===k?'bg-accent text-accent-foreground':'bg-card text-muted-foreground border border-border'}`}>{label}</button>
  );
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="mb-4 flex gap-2">
        <TabBtn k="notes" label={t('ws.notes')} />
        <TabBtn k="goals" label={t('ws.tabPlan')} />
        <TabBtn k="plan" label={t('ws.todayList')} />
      </div>
      {tab==='notes' ? <NotesTab /> : tab==='goals' ? <GoalsTab /> : <PlanTab />}
    </div>
  );
}

// NOTE INPUT — strictly local state, no storage/network until Add
const NoteInput = memo(function NoteInput({ onAdd }:{ onAdd:(note: Pick<NoteItem,'title'|'body'>)=>void }){
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const add = useCallback(()=>{
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) return;
    onAdd({ title: ti || 'Untitled', body: bo });
    setTitle(''); setBody('');
  },[title, body, onAdd]);
  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)_auto]">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={t('ws.quickCapture')} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder={t('ws.writeItOut')} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <button onClick={add} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-accent">{t('ws.add')}</button>
    </div>
  );
});

export function NotesTab() {
  const { t } = useLang();
  const [notes, setNotes] = useLocalList<NoteItem>('pw.notes', []);
  const handleAdd = useCallback((n: Pick<NoteItem,'title'|'body'>)=>{
    const now = new Date().toISOString();
    setNotes(list => [{ id: uid(), title: n.title, body: n.body, created_at: now, updated_at: now}, ...list].slice(0,200));
  },[setNotes]);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="label-mono mb-4">{t('ws.notes')}</h2>
      <NoteInput onAdd={handleAdd} />
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

// GOALS — composer is local-only; list updates only on actions
const GoalComposer = memo(function GoalComposer({ onAdd }:{ onAdd:(g: Omit<GoalItem,'id'|'progress'> & { progress?: number })=>void }){
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>('');
  const [priority, setPriority] = useState<GoalItem['priority']>('medium');
  const [progress, setProgress] = useState<number>(0);
  const add = useCallback(()=>{
    const ti = title.trim(); if (!ti) return;
    onAdd({ title: ti, date: date || null, priority, progress });
    setTitle(''); setDate(''); setPriority('medium'); setProgress(0);
  },[title,date,priority,progress,onAdd]);
  return (
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={t('ws.goal')} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <input value={date} onChange={(e)=>setDate(e.target.value)} type="date" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <select value={priority} onChange={(e)=>setPriority(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="high">{t('priority.high')}</option>
        <option value="medium">{t('priority.medium')}</option>
        <option value="low">{t('priority.low')}</option>
      </select>
      <button onClick={add} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-accent">{t('ws.add')}</button>
      <div className="col-span-full flex items-center gap-3">
        <input type="range" min={0} max={100} value={progress} onChange={(e)=>setProgress(Number(e.target.value))} />
        <span className="w-10 text-right font-mono text-[10px]">{progress}%</span>
      </div>
    </div>
  );
});

export function GoalsTab() {
  const { t } = useLang();
  const [goals, setGoals] = useLocalList<GoalItem>('pw.goals', []);
  const add = useCallback((g: Omit<GoalItem,'id'>)=>{
    setGoals(list => [{ id: uid(), ...g, progress: Math.max(0, Math.min(100, g.progress ?? 0)) }, ...list].slice(0,200));
  },[setGoals]);
  const update = useCallback((id: string, patch: Partial<GoalItem>) => setGoals(list => list.map(x => x.id===id? { ...x, ...patch }: x)), [setGoals]);
  const remove = useCallback((id: string) => setGoals(list => list.filter(x => x.id!==id)), [setGoals]);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="label-mono mb-4">{t('ws.activeGoals')}</h2>
      <GoalComposer onAdd={add} />
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
              <input type="range" min={0} max={100} value={g.progress} onChange={(e)=>update(g.id,{progress:Number(e.target.value)})} />
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

// PLAN — isolated local state inputs
const PlanInput = memo(function PlanInput({ onAdd }:{ onAdd:(t: Pick<PlanTask,'title'|'priority'>)=>void }){
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PlanTask['priority']>('medium');
  const add = useCallback(()=>{
    const ti = title.trim(); if (!ti) return;
    onAdd({ title: ti, priority }); setTitle(''); setPriority('medium');
  },[title, priority, onAdd]);
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={t('ws.addTask')} className="w-full min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto sm:text-sm" />
      <select value={priority} onChange={(e)=>setPriority(e.target.value as any)} className="flex-1 rounded-xl border border-border bg-card px-2 py-2 text-xs focus:outline-none sm:flex-none">
        <option value="high">{t('priority.high')}</option>
        <option value="medium">{t('priority.medium')}</option>
        <option value="low">{t('priority.low')}</option>
      </select>
      <button onClick={add} className="flex-1 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent sm:flex-none">{t('ws.add')}</button>
    </div>
  );
});

export function PlanTab(){
  const { t } = useLang();
  const [tasks, setTasks] = useLocalList<PlanTask>('pw.plan', []);
  const add = useCallback((p: Pick<PlanTask,'title'|'priority'>)=>{
    setTasks(list => [{ id: uid(), title: p.title, priority: p.priority, done: false }, ...list].slice(0,300));
  },[setTasks]);
  const toggle = useCallback((id:string)=> setTasks(list => list.map(x => x.id===id ? { ...x, done: !x.done } : x)), [setTasks]);
  const remove = useCallback((id:string)=> setTasks(list => list.filter(x => x.id!==id)), [setTasks]);
  return (
    <section className="animate-entry rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="label-mono mb-6">{t('ws.todayList')}</h2>
      <PlanInput onAdd={add} />
      <div className="space-y-1">
        {tasks.length===0 && (<p className="py-3 text-xs text-muted-foreground">{t('ws.emptyTasks')}</p>)}
        {tasks.map(task => (
          <div key={task.id} className="group flex items-center gap-3 border-b border-border/40 py-3">
            <button onClick={()=>toggle(task.id)} aria-label={task.title} className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${task.done ? 'border-accent bg-accent' : 'border-border hover:border-accent'}`}>
              <span className={`size-1.5 rounded-full bg-background ${task.done ? 'opacity-100' : 'opacity-0'}`} />
            </button>
            <span className={`min-w-0 flex-1 break-words text-sm transition-all ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">{task.priority}</span>
            <button onClick={()=>remove(task.id)} className="shrink-0 font-mono text-[10px] tracking-wide text-muted-foreground/60 transition-colors hover:text-accent" aria-label={`${t('ws.del')} ${task.title}`}>{t('ws.del')}</button>
          </div>
        ))}
      </div>
    </section>
  );
}
