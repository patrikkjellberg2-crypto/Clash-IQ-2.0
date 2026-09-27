import { Router, type IRouter } from "express";
import { clanMusicTable, db } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";

const router: IRouter = Router();

function normalizeClanTag(value: unknown): string {
  const tag = String(value ?? "").trim().toUpperCase();
  if (!/^#?[A-Z0-9]{3,15}$/.test(tag)) {
    throw new Error("Invalid clan tag");
  }
  return tag.startsWith("#") ? tag : `#${tag}`;
}

function parseYouTubeId(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }

      const match = url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
      return match?.[1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

router.get("/clan-music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeClanTag(req.query.clanTag);
    const tracks = await db
      .select()
      .from(clanMusicTable)
      .where(eq(clanMusicTable.clanTag, clanTag))
      .orderBy(asc(clanMusicTable.createdAt), asc(clanMusicTable.id));

    res.json({
      clanTag,
      tracks,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
});

router.post("/clan-music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeClanTag(req.body?.clanTag);
    const youtubeId = parseYouTubeId(req.body?.url ?? req.body?.youtubeId);

    if (!youtubeId) {
      res.status(400).json({ error: "Enter a valid YouTube video URL." });
      return;
    }

    const title =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim().slice(0, 160)
        : `YouTube video · ${youtubeId}`;

    const existing = await db
      .select()
      .from(clanMusicTable)
      .where(
        and(
          eq(clanMusicTable.clanTag, clanTag),
          eq(clanMusicTable.youtubeId, youtubeId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      res.status(409).json({ error: "That video is already in the clan playlist." });
      return;
    }

    const [track] = await db
      .insert(clanMusicTable)
      .values({ clanTag, youtubeId, title })
      .returning();

    res.status(201).json(track);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Could not add video",
    });
  }
});

export default router;
