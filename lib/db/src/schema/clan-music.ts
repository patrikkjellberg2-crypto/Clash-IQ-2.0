import { index, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clanMusicTable = pgTable(
  "clan_music",
  {
    id: serial("id").primaryKey(),
    clanTag: text("clan_tag").notNull(),
    youtubeId: text("youtube_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clanYoutubeUnique: unique("clan_music_clan_youtube_unique").on(
      table.clanTag,
      table.youtubeId,
    ),
    byClan: index("clan_music_clan_idx").on(table.clanTag, table.createdAt),
  }),
);

export const insertClanMusicSchema = createInsertSchema(clanMusicTable).omit({
  id: true,
  createdAt: true,
});

export type InsertClanMusic = z.infer<typeof insertClanMusicSchema>;
export type ClanMusic = typeof clanMusicTable.$inferSelect;
