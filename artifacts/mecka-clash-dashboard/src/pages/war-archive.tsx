import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Trophy } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';
import {
  WARS_EVENT,
  clearWars,
  exportWarsJson,
  importWarsJson,
  readWars,
  warOutcome,
  warTime,
  type ArchivedWar,
} from '@/lib/war-archive';

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
const dateOf = (w: ArchivedWar) => {
  const t = warTime(w.endTime);
  return t ? new Date(t).toLocaleDateString() : '—';
};

const OUTCOME_STYLE: Record<string, string> = {
  win: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  lose: 'border-red-400/30 bg-red-400/10 text-red-300',
  tie: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  live: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function WarCard({ war }: { war: ArchivedWar }) {
  const [open, setOpen] = useState(false);
  const outcome = warOutcome(war);
  const oppByTag = useMemo(() => {
    const map = new Map<string, { pos: number; name: string }>();
    for (const m of war.opponentMembers) map.set(m.tag, { pos: m.pos, name: m.name });
    return map;
  }, [war]);
  const members = useMemo(
    () => war.members.slice().sort((a, b) => a.pos - b.pos),
    [war],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151c]/90">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${OUTCOME_STYLE[outcome]}`}
        >
          {outcome === 'live' ? 'In war' : outcome}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">vs {war.opponent.name || 'Unknown'}</span>
          <span className="block text-xs text-slate-500">
            {dateOf(war)} · {war.teamSize || '?'} vs {war.teamSize || '?'}
          </span>
        </span>

        <span className="text-right text-sm font-black">
          {war.clan.stars} – {war.opponent.stars}
          <span className="block text-[11px] font-medium text-slate-500">
            {war.clan.destruction.toFixed(1)}% – {war.opponent.destruction.toFixed(1)}%
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5 p-4">
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">
              Only the result was saved for this war (from the official war log).
              Player attacks are saved for wars that were open in the app while running.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.tag} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-sm font-bold">
                    #{m.pos} {m.name}{' '}
                    <span className="text-xs font-semibold text-slate-500">TH{m.th}</span>
                  </p>
                  {m.attacks.length === 0 ? (
                    <p className="mt-1 text-xs text-red-300">No attacks used</p>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      {m.attacks
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((a, i) => {
                          const target = oppByTag.get(a.defenderTag);
                          return (
                            <p key={i} className="text-xs text-slate-300">
                              <span className="text-amber-300">{stars(a.stars)}</span>{' '}
                              {a.destruction}%
                              {target ? ` → #${target.pos} ${target.name}` : ''}
                            </p>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WarArchivePage() {
  const [wars, setWars] = useState<ArchivedWar[]>(() => readWars());
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setWars(readWars());
    window.addEventListener(WARS_EVENT, refresh);
    return () => window.removeEventListener(WARS_EVENT, refresh);
  }, []);

  const sorted = useMemo(
    () => wars.slice().sort((a, b) => warTime(b.endTime) - warTime(a.endTime)),
    [wars],
  );

  const summary = useMemo(() => {
    let win = 0;
    let lose = 0;
    let tie = 0;
    let totalStars = 0;

    for (const w of sorted) {
      const o = warOutcome(w);
      if (o === 'win') win++;
      else if (o === 'lose') lose++;
      else if (o === 'tie') tie++;
      if (o !== 'live') totalStars += w.clan.stars;
    }

    const players = new Map<
      string,
      { name: string; wars: number; possible: number; used: number; stars: number; threes: number }
    >();

    for (const w of sorted) {
      if (warOutcome(w) === 'live') continue;
      for (const m of w.members) {
        const p =
          players.get(m.tag) || { name: m.name, wars: 0, possible: 0, used: 0, stars: 0, threes: 0 };
        p.name = m.name || p.name;
        p.wars += 1;
        p.possible += w.attacksPerMember || 2;
        p.used += m.attacks.length;
        for (const a of m.attacks) {
          p.stars += a.stars;
          if (a.stars === 3) p.threes += 1;
        }
        players.set(m.tag, p);
      }
    }

    const board = Array.from(players.entries())
      .map(([tag, p]) => ({ tag, ...p, avg: p.used ? p.stars / p.used : 0 }))
      .sort((a, b) => b.avg - a.avg || b.used - a.used);

    const finished = win + lose + tie;
    return { win, lose, tie, totalStars, finished, board };
  }, [sorted]);

  const copy = async () => {
    const data = exportWarsJson();
    try {
      await navigator.clipboard.writeText(data);
      setMessage('Backup copied. Paste it somewhere safe (a note or a chat with yourself).');
    } catch {
      setText(data);
      setMessage('Could not copy automatically. The backup is in the box below: select all and copy it.');
    }
  };

  const download = () => {
    try {
      const blob = new Blob([exportWarsJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clashiq-wars-backup.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage('Download started. If nothing was saved, use "Copy backup" instead.');
    } catch {
      setMessage('Download is not supported here. Use "Copy backup" instead.');
    }
  };

  const doImport = (value: string) => {
    try {
      const count = importWarsJson(value);
      setMessage(`Imported ${count} war${count === 1 ? '' : 's'}.`);
      setText('');
    } catch {
      setMessage('Could not read that backup.');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar clanName="CLASHIQ" clanTag="" />

        <main className="min-w-0 flex-1">
          <ClashIQInlineBanner />

          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 pt-2 md:px-7">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Command Center
              </Link>

              <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
                <Trophy className="h-6 w-6 text-amber-300" />
                War Archive
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Your clan wars, saved on this device. A war with player attacks is saved
                when the app is opened while the war is running (open it once near the end
                to capture the final attacks). Results of finished wars are also added from
                the official war log.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Wars saved" value={String(sorted.length)} />
              <Stat
                label="Record"
                value={`${summary.win}–${summary.lose}${summary.tie ? `–${summary.tie}` : ''}`}
                sub={
                  summary.finished
                    ? `${Math.round((summary.win / summary.finished) * 100)}% win rate`
                    : undefined
                }
              />
              <Stat label="Stars earned" value={String(summary.totalStars)} sub="finished wars" />
              <Stat label="Players tracked" value={String(summary.board.length)} />
            </div>

            {summary.board.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                  Player stats
                </p>
                <h2 className="text-lg font-black">Attack performance</h2>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Player</th>
                        <th className="py-2 pr-3">Wars</th>
                        <th className="py-2 pr-3">Attacks</th>
                        <th className="py-2 pr-3">Avg ★</th>
                        <th className="py-2">3★</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.board.map(p => (
                        <tr key={p.tag} className="border-t border-white/5">
                          <td className="py-2 pr-3 font-bold">{p.name}</td>
                          <td className="py-2 pr-3">{p.wars}</td>
                          <td className="py-2 pr-3">
                            <span className={p.used < p.possible ? 'text-red-300' : ''}>
                              {p.used}/{p.possible}
                            </span>
                          </td>
                          <td className="py-2 pr-3">{p.avg.toFixed(2)}</td>
                          <td className="py-2">{p.threes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-black">Wars</h2>
              {sorted.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-500">
                  No wars saved yet. Open the app during a war and it will appear here.
                </p>
              ) : (
                sorted.map(w => <WarCard key={w.id} war={w} />)
              )}
            </section>

            <section className="rounded-2xl border border-sky-300/20 bg-[#11151c]/90 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">Backup</p>
              <h2 className="text-lg font-black">Keep your war data safe</h2>
              <p className="mt-1 text-xs text-slate-500">
                The archive lives in this app on this device. If you clear the app's data or
                reinstall it, it is gone, so make a backup now and then.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-110"
                >
                  Copy backup
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10"
                >
                  Download file
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10"
                >
                  Import file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) doImport(await file.text());
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                />
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste a backup here to import it"
                spellCheck={false}
                className="mt-3 h-24 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs outline-none focus:border-amber-300/50"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => doImport(text)}
                  className="h-10 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 text-sm font-bold text-amber-200 disabled:opacity-40"
                >
                  Import pasted backup
                </button>

                {sorted.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirmClear) {
                        setConfirmClear(true);
                        return;
                      }
                      clearWars();
                      setConfirmClear(false);
                      setMessage('Archive cleared.');
                    }}
                    className="h-10 rounded-xl border border-red-400/30 px-4 text-sm font-semibold text-red-300"
                  >
                    {confirmClear ? 'Tap again to delete everything' : 'Clear archive'}
                  </button>
                )}
              </div>

              {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
