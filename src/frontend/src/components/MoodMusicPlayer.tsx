import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Mood } from "../backend";
import { MOOD_CONFIGS } from "../lib/moodUtils";

interface MoodMusicPlayerProps {
  selectedMood: Mood | null;
}

interface SongEntry {
  id: string;
  title: string;
}

const MOOD_SONGS: Record<string, SongEntry[]> = {
  happy: [
    { id: "ZbZSe6N_BXs", title: "Happy – Pharrell Williams" },
    { id: "y6Sxv-sUYtM", title: "Walking on Sunshine – Katrina" },
    { id: "09R8_2nJtjg", title: "Can't Stop the Feeling – Justin Timberlake" },
    { id: "CevxZvSJLk8", title: "Good as Hell – Lizzo" },
    { id: "fHI8X4OXluQ", title: "Uptown Funk – Bruno Mars" },
  ],
  sad: [
    { id: "lp-EO5I60KA", title: "Someone Like You – Adele" },
    { id: "RBumgq5yVrA", title: "Fix You – Coldplay" },
    { id: "hLQl3WQQoQ0", title: "The Night We Met – Lord Huron" },
    { id: "bo_efYhYU2A", title: "Skinny Love – Bon Iver" },
    { id: "pRpeEdMmmQ0", title: "Let Her Go – Passenger" },
  ],
  stress: [
    { id: "5qap5aO4i9A", title: "Lofi Hip Hop – Chill Beats" },
    { id: "N0O6i1a9SjI", title: "Study Chill – Calm Waves" },
    { id: "lFcSrYw2ARc", title: "Calm Piano – Relaxing Melody" },
    { id: "wMhHNP5qzYw", title: "Nature Sounds – Rain & Birds" },
    { id: "UfcAVejslrU", title: "Ambient Relax – Breathing Space" },
  ],
  love: [
    { id: "450p7goxZqg", title: "Perfect – Ed Sheeran" },
    { id: "8UVNT4wvIGY", title: "All of Me – John Legend" },
    { id: "OPf0YbXqDm0", title: "A Thousand Years – Christina Perri" },
    { id: "cGDNnFGBCnE", title: "Thinking Out Loud – Ed Sheeran" },
    { id: "Ru0GkVgckLk", title: "Can't Help Falling in Love – Elvis" },
  ],
  angry: [
    { id: "kXYiU_JCYtU", title: "Numb – Linkin Park" },
    { id: "N4bFqW_eu2I", title: "In the End – Linkin Park" },
    { id: "bWXazVeeDZ4", title: "Breathe – Telepopmusik" },
    { id: "CDl4-wNFSAc", title: "Let It Be – The Beatles" },
    { id: "sALSE2e0IpI", title: "Don't Fear the Reaper – Blue Öyster Cult" },
  ],
  anxious: [
    { id: "5qap5aO4i9A", title: "Lofi Calm – Study Mix" },
    { id: "wMhHNP5qzYw", title: "Peaceful Piano – Calm Space" },
    { id: "N0O6i1a9SjI", title: "Soft Rain – Ambient Focus" },
    { id: "UfcAVejslrU", title: "Deep Breath – Mindful Tones" },
    { id: "lFcSrYw2ARc", title: "Healing Frequencies – 432 Hz" },
  ],
  hopeful: [
    { id: "CevxZvSJLk8", title: "Good as Hell – Lizzo" },
    { id: "ZbZSe6N_BXs", title: "Happy – Pharrell Williams" },
    { id: "fHI8X4OXluQ", title: "Count on Me – Bruno Mars" },
    { id: "09R8_2nJtjg", title: "Can't Stop the Feeling – Justin Timberlake" },
    { id: "y6Sxv-sUYtM", title: "Here Comes the Sun – Beatles" },
  ],
};

export default function MoodMusicPlayer({
  selectedMood,
}: MoodMusicPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const moodKey = selectedMood ?? "happy";
  const songs = MOOD_SONGS[moodKey] ?? MOOD_SONGS.happy;
  const currentSong = songs[currentIndex];
  const moodConfig = MOOD_CONFIGS.find((m) => m.key === moodKey);

  const nextSong = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(false);
  };

  const handlePlay = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card-glass rounded-2xl shadow-card overflow-hidden"
      data-ocid="music.card"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        data-ocid="music.toggle"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🎵</span>
          <div>
            <span className="font-bold text-sm text-foreground">
              Mood Music
            </span>
            {selectedMood && (
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${moodConfig?.chipClass ?? ""}`}
              >
                {moodConfig?.emoji} {moodConfig?.label}
              </span>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground text-sm"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Song list */}
              <div className="space-y-1.5">
                {songs.map((song, idx) => (
                  <motion.button
                    key={song.id}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handlePlay(idx)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                      currentIndex === idx && isPlaying
                        ? "bg-foreground/10 dark:bg-white/10 ring-1 ring-foreground/20"
                        : "hover:bg-muted"
                    }`}
                    data-ocid={`music.song.${idx + 1}`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        backgroundColor: moodConfig?.color ?? "#F6D56A",
                        opacity: 0.8,
                      }}
                    >
                      {currentIndex === idx && isPlaying ? "▶" : idx + 1}
                    </span>
                    <span className="flex-1 text-foreground/80 truncate">
                      {song.title}
                    </span>
                    {currentIndex === idx && isPlaying && (
                      <span className="flex gap-0.5 items-end h-3">
                        {[0, 0.1, 0.2].map((delay) => (
                          <span
                            key={delay}
                            className="w-0.5 bg-foreground/60 rounded-full animate-music-pulse"
                            style={{
                              height: "8px",
                              animationDelay: `${delay}s`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* YouTube player */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden"
                  data-ocid="music.player"
                >
                  <iframe
                    key={currentSong.id}
                    width="100%"
                    height="180"
                    src={`https://www.youtube.com/embed/${currentSong.id}?autoplay=1`}
                    title={currentSong.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="rounded-xl border-0"
                  />
                </motion.div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all bg-foreground/10 dark:bg-white/10 hover:bg-foreground/20 dark:hover:bg-white/20 text-foreground"
                  data-ocid="music.play_button"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                  <span className="text-muted-foreground">
                    {currentSong.title.split("–")[0].trim()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={nextSong}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                  data-ocid="music.refresh_button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
