import { useEffect, useMemo, useState } from "react";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ClashIQInlineBanner } from "@/components/clashiq-inline-banner";
import { Link } from "wouter";
import {
  ArrowLeft,
  ListMusic,
  Music2,
  Play,
  Plus,
  RefreshCw,
  Youtube,
} from "lucide-react";

type Track = {
  id: number;
  clanTag: string;
  youtubeId: string;
  title: string;
  createdAt: string;
};

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === "object" ? v as Dict : {});
const s = (v: unknown, fallback = "") => typeof v === "string" ? v : fallback;

export default function ClanMusicPage() {
  const { data, isLoading: dashboardLoading } = useGetClashDashboard();
  const dashboard = d(data);
  const clan = d(dashboard.clan);
  const clanTag = s(dashboard.clanTag, "#2Q0Q82C9R");
  const clanName = s(clan.name, "BHABE DHEMONS");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selected, setSelected] = useState<Track | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clan-music?clanTag=${encodeURIComponent(clanTag)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load playlist.");
      const next = Array.isArray(body.tracks) ? body.tracks as Track[] : [];
      setTracks(next);
      setSelected((current) => current && next.some((track) => track.id === current.id)
        ? current
        : next[0] ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load playlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clanTag) void loadTracks();
  }, [clanTag]);

  const addTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/clan-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag, url, title }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not add video.");
      setUrl("");
      setTitle("");
      await loadTracks();
      setSelected(body);
      setMessage("Added to the clan playlist.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add video.");
    } finally {
      setSaving(false);
    }
  };

  const embedUrl = useMemo(() => {
    if (!selected) return "";
    return `https://www.youtube-nocookie.com/embed/${selected.youtubeId}?playsinline=1&rel=0`;
  }, [selected]);

  return (
    <div className="flex min-h-[100dvh] bg-[#07090d] text-white">
      <AppSidebar clanName={clanName} clanTag={clanTag} />
      <main className="min-w-0 flex-1">
        <ClashIQInlineBanner />
        <header className="border-b border-white/[0.06] bg-[#07090d]/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">
                <ArrowLeft className="size-4" /> Overview
              </Link>
              <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-black tracking-[-.04em]">
                <Music2 className="size-6 text-amber-300" /> Clan Music
              </h1>
              <p className="mt-1 text-xs text-slate-500">Shared YouTube playlist for {clanName}.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadTracks()}
              className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
              aria-label="Refresh playlist"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1200px] gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#06111b]">
            <div className="aspect-video w-full bg-black">
              {selected ? (
                <iframe
                  title={selected.title}
                  src={embedUrl}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <Youtube className="mx-auto size-10 text-slate-600" />
                    <p className="mt-3 font-bold text-slate-300">No music yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add a YouTube video to start the clan playlist.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/[0.06] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/70">Now playing</p>
              <h2 className="mt-1 truncate text-lg font-bold">{selected?.title ?? "Nothing selected"}</h2>
              <p className="mt-1 text-xs text-slate-500">YouTube's embedded player handles playback and any applicable ads.</p>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/[0.07] bg-[#06111b] p-5">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-amber-300" />
                <h2 className="font-bold">Add to playlist</h2>
              </div>
              <form onSubmit={addTrack} className="mt-4 space-y-3">
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Paste YouTube link"
                  required
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-amber-400/50"
                />
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title (optional)"
                  maxLength={160}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-amber-400/50"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {saving ? "Adding…" : "Add video"}
                </button>
              </form>
              {message && <p className="mt-3 text-xs text-slate-400" role="status">{message}</p>}
            </section>

            <section className="rounded-3xl border border-white/[0.07] bg-[#06111b] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListMusic className="size-4 text-amber-300" />
                  <h2 className="font-bold">Clan playlist</h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
                </span>
              </div>

              {loading || dashboardLoading ? (
                <div className="mt-4 text-sm text-slate-500">Loading playlist…</div>
              ) : tracks.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                  The playlist is empty.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {tracks.map((track, index) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelected(track)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${selected?.id === track.id ? "border-amber-400/30 bg-amber-400/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-black/30 text-[10px] font-black text-slate-500">
                        {selected?.id === track.id ? <Play className="size-3 fill-current text-amber-300" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{track.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
