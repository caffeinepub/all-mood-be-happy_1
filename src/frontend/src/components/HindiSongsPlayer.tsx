import { ChevronDown, Music2, RefreshCw, Shuffle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
}

type EmotionCategory = "love" | "sad" | "happy" | "calm";

const HINDI_SONGS: Record<EmotionCategory, Song[]> = {
  love: [
    { id: "GxBSyx85Kp8", title: "Tum Hi Ho", artist: "Arijit Singh" },
    { id: "gHXXXzPDiBA", title: "Kal Ho Naa Ho", artist: "Sonu Nigam" },
    {
      id: "hFEJbL3mBxA",
      title: "Pehla Nasha",
      artist: "Udit Narayan, Sadhana Sargam",
    },
    {
      id: "3bJ-gMRPBJU",
      title: "Tujhe Dekha Toh",
      artist: "Kumar Sanu, Lata Mangeshkar",
    },
    {
      id: "a8bvCyeptnU",
      title: "Aaj Main Upar",
      artist: "Kumar Sanu, Kavita Krishnamurthy",
    },
    { id: "rJ--_R5-WTk", title: "Jaadu Teri Nazar", artist: "Udit Narayan" },
    {
      id: "WEBiuHoEyWk",
      title: "Kuch Kuch Hota Hai",
      artist: "Udit Narayan, Kavita Krishnamurthy",
    },
  ],
  sad: [
    { id: "hFEJbL3mBxA", title: "Aankhon Mein Teri", artist: "Udit Narayan" },
    {
      id: "ZRcU3HFpEkE",
      title: "Tere Bina Zindagi Se",
      artist: "Kishore Kumar",
    },
    { id: "p4D7Y4koyuE", title: "O Sanam", artist: "Lucky Ali" },
    {
      id: "hZdVJlO-6s4",
      title: "Pyar Humein Kis Mod Pe",
      artist: "Lata Mangeshkar, S.P. Balasubrahmanyam",
    },
    {
      id: "rBKhFiQnKGU",
      title: "Ek Pyaar Ka Nagma Hai",
      artist: "Lata Mangeshkar, Mukesh",
    },
    { id: "2yvOAFJMdqI", title: "Channa Mereya", artist: "Arijit Singh" },
  ],
  happy: [
    {
      id: "oTgIw1Y24zk",
      title: "Koi Mil Gaya",
      artist: "Udit Narayan, Alka Yagnik",
    },
    {
      id: "1kBGEFqI0oM",
      title: "Bole Chudiyan",
      artist: "Udit Narayan, Alka Yagnik",
    },
    {
      id: "Z0YnXFEbBF0",
      title: "Dil Dhadakne Do",
      artist: "Shankar Mahadevan",
    },
    {
      id: "uExfiFLGP38",
      title: "Aati Kya Khandala",
      artist: "Aamir Khan, Alka Yagnik",
    },
    { id: "wSBdOoLMj-4", title: "Ole Ole", artist: "Abhijeet" },
    { id: "Ao3C7e3NQVY", title: "Tanha Tanha", artist: "Kavita Krishnamurthy" },
  ],
  calm: [
    { id: "hFEJbL3mBxA", title: "Ek Hasina Thi", artist: "Sonu Nigam" },
    {
      id: "uoqlzjSuuHQ",
      title: "Kabhi Alvida Naa Kehna",
      artist: "Sonu Nigam",
    },
    { id: "wSyxeY4DJWM", title: "Yeh Dil Deewana", artist: "Sonu Nigam" },
    {
      id: "EbwGjUXNqRQ",
      title: "Satrangi Re",
      artist: "Udit Narayan, Kavita Krishnamurthy",
    },
    { id: "4O85ZUaJPAM", title: "Na Jane Kyon", artist: "Lata Mangeshkar" },
    {
      id: "GpDn0LxFVAM",
      title: "Pardesi Pardesi",
      artist: "Udit Narayan, Alka Yagnik",
    },
  ],
};

const EMOTION_TABS: {
  key: EmotionCategory;
  label: string;
  emoji: string;
  color: string;
  badgeClass: string;
  activeClass: string;
  borderClass: string;
  glowColor: string;
}[] = [
  {
    key: "love",
    label: "Love",
    emoji: "💗",
    color: "#f43f5e",
    badgeClass:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    activeClass:
      "bg-rose-500 text-white shadow-lg shadow-rose-500/30 dark:shadow-rose-500/20",
    borderClass: "border-l-rose-400",
    glowColor: "rgba(244,63,94,0.15)",
  },
  {
    key: "sad",
    label: "Sad",
    emoji: "💙",
    color: "#3b82f6",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    activeClass:
      "bg-blue-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20",
    borderClass: "border-l-blue-400",
    glowColor: "rgba(59,130,246,0.15)",
  },
  {
    key: "happy",
    label: "Happy",
    emoji: "🌟",
    color: "#f59e0b",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    activeClass:
      "bg-amber-400 text-white shadow-lg shadow-amber-400/30 dark:shadow-amber-400/20",
    borderClass: "border-l-amber-400",
    glowColor: "rgba(245,158,11,0.15)",
  },
  {
    key: "calm",
    label: "Calm",
    emoji: "🍃",
    color: "#10b981",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    activeClass:
      "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20",
    borderClass: "border-l-emerald-400",
    glowColor: "rgba(16,185,129,0.15)",
  },
];

const PAGE_SIZE = 6;

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function HindiSongsPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmotionCategory>("love");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shuffledSongs, setShuffledSongs] = useState<
    Record<EmotionCategory, Song[]>
  >(() => ({ ...HINDI_SONGS }));

  const currentEmotion =
    EMOTION_TABS.find((t) => t.key === activeTab) ?? EMOTION_TABS[0];
  const allSongs = shuffledSongs[activeTab];
  const visibleSongs = allSongs.slice(0, visibleCount);
  const hasMore = visibleCount < allSongs.length;

  const handleTabChange = (tab: EmotionCategory) => {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
    setPlayingId(null);
  };

  const handlePlay = (songId: string) => {
    setPlayingId((prev) => (prev === songId ? null : songId));
  };

  const handleShuffle = () => {
    setShuffledSongs((prev) => ({
      ...prev,
      [activeTab]: shuffleArray(prev[activeTab]),
    }));
    setVisibleCount(PAGE_SIZE);
    setPlayingId(null);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allSongs.length));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="card-glass rounded-2xl shadow-card overflow-hidden"
      data-ocid="hindi_songs.card"
    >
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        data-ocid="hindi_songs.toggle"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🎸</span>
          <div className="text-left">
            <span className="font-bold text-sm text-foreground block">
              90s Hindi Songs
            </span>
            <span className="text-xs text-muted-foreground">
              Evergreen Bollywood • 4 moods
            </span>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="hindi-songs-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Emotion tabs */}
              <div
                className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
                data-ocid="hindi_songs.tab"
              >
                {EMOTION_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTab === tab.key
                        ? tab.activeClass
                        : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    data-ocid={`hindi_songs.${tab.key}.tab`}
                  >
                    <span>{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                  data-ocid="hindi_songs.shuffle_button"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Shuffle
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <Music2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {allSongs.length} songs
                  </span>
                </div>
              </div>

              {/* Song list */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {visibleSongs.map((song, idx) => {
                    const isPlaying = playingId === song.id;
                    return (
                      <motion.div
                        key={`${activeTab}-${song.id}-${idx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                        className={`rounded-xl border-l-4 transition-all overflow-hidden ${
                          isPlaying
                            ? `${currentEmotion.borderClass} bg-white/50 dark:bg-white/5 shadow-sm`
                            : "border-l-transparent bg-white/30 dark:bg-white/3 hover:bg-white/50 dark:hover:bg-white/5"
                        }`}
                        data-ocid={`hindi_songs.item.${idx + 1}`}
                      >
                        {/* Song card row */}
                        <div className="flex items-center gap-2.5 p-2.5">
                          {/* Index badge */}
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              isPlaying
                                ? "text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                            style={
                              isPlaying
                                ? { backgroundColor: currentEmotion.color }
                                : {}
                            }
                          >
                            {isPlaying ? (
                              <span className="flex gap-px items-end h-3">
                                {[0, 0.1, 0.2].map((delay) => (
                                  <span
                                    key={delay}
                                    className="w-0.5 rounded-full animate-music-pulse"
                                    style={{
                                      height: "8px",
                                      backgroundColor: "white",
                                      animationDelay: `${delay}s`,
                                    }}
                                  />
                                ))}
                              </span>
                            ) : (
                              idx + 1
                            )}
                          </span>

                          {/* Title + Artist */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {song.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          </div>

                          {/* Play button */}
                          <button
                            type="button"
                            onClick={() => handlePlay(song.id)}
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
                              isPlaying
                                ? "text-white"
                                : "bg-muted hover:text-white"
                            }`}
                            style={{
                              backgroundColor: isPlaying
                                ? currentEmotion.color
                                : undefined,
                            }}
                            onMouseEnter={(e) => {
                              if (!isPlaying)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = currentEmotion.color;
                            }}
                            onMouseLeave={(e) => {
                              if (!isPlaying)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = "";
                            }}
                            data-ocid={`hindi_songs.play.${idx + 1}`}
                            aria-label={
                              isPlaying
                                ? `Stop ${song.title}`
                                : `Play ${song.title}`
                            }
                          >
                            {isPlaying ? "⏸" : "▶"}
                          </button>
                        </div>

                        {/* YouTube iframe — lazy loaded only when playing */}
                        <AnimatePresence>
                          {isPlaying && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden px-2.5 pb-2.5"
                              data-ocid={`hindi_songs.player.${idx + 1}`}
                            >
                              <div className="rounded-lg overflow-hidden">
                                <iframe
                                  key={song.id}
                                  width="100%"
                                  height="160"
                                  src={`https://www.youtube.com/embed/${song.id}?autoplay=1`}
                                  title={song.title}
                                  allow="autoplay; encrypted-media"
                                  allowFullScreen
                                  className="rounded-lg border-0 block"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Load More button */}
              {hasMore && (
                <motion.button
                  type="button"
                  onClick={handleLoadMore}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground"
                  data-ocid="hindi_songs.load_more_button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Load More ({allSongs.length - visibleCount} remaining)
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
