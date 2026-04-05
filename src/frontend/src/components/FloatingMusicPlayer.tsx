import { Music, Pause, Play, Volume2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Mood } from "../backend";
import { MOOD_CONFIGS } from "../lib/moodUtils";

interface FloatingMusicPlayerProps {
  selectedMood: Mood | null;
}

const AMBIENT_VIDEOS: Record<string, string> = {
  happy: "ZbZSe6N_BXs",
  sad: "5qap5aO4i9A",
  stress: "5qap5aO4i9A",
  love: "450p7goxZqg",
  angry: "lFcSrYw2ARc",
  anxious: "5qap5aO4i9A",
  hopeful: "CevxZvSJLk8",
};

const MOOD_LABELS: Record<string, string> = {
  happy: "Joyful Beats",
  sad: "Soothing Lofi",
  stress: "Calm Waves",
  love: "Romantic Vibes",
  angry: "Release Tension",
  anxious: "Grounding Tones",
  hopeful: "Uplifting Flow",
};

export default function FloatingMusicPlayer({
  selectedMood,
}: FloatingMusicPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const moodKey = selectedMood ?? "happy";
  const videoId = AMBIENT_VIDEOS[moodKey];
  const moodConfig = MOOD_CONFIGS.find((m) => m.key === moodKey);
  const trackLabel = MOOD_LABELS[moodKey];

  return (
    <div className="fixed bottom-6 right-6 z-50" data-ocid="floating.card">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-64 card-glass rounded-2xl shadow-card-hover overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: `linear-gradient(135deg, ${moodConfig?.color ?? "#F6D56A"}40, ${moodConfig?.color ?? "#F6D56A"}15)`,
              }}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-foreground" />
                <span className="text-xs font-bold text-foreground">
                  Ambient Player
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                data-ocid="floating.close_button"
              >
                <X className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>

            {/* Now playing */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    backgroundColor: moodConfig?.color ?? "#F6D56A",
                    opacity: 0.85,
                  }}
                >
                  {isPlaying ? (
                    <span className="flex gap-0.5 items-end h-4 pb-0.5">
                      {[0, 0.1, 0.2, 0.3].map((delay) => (
                        <span
                          key={delay}
                          className="w-0.5 bg-white rounded-full animate-music-pulse"
                          style={{
                            height: "10px",
                            animationDelay: `${delay}s`,
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    (moodConfig?.emoji ?? "🎵")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {trackLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {moodConfig?.emoji} {moodConfig?.label} mood
                  </p>
                </div>
              </div>

              {/* Hidden YouTube iframe for audio */}
              {isPlaying && (
                <div className="sr-only">
                  <iframe
                    key={videoId}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0`}
                    title="Ambient music"
                    allow="autoplay; encrypted-media"
                    width="1"
                    height="1"
                  />
                </div>
              )}

              {/* Volume */}
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-current"
                  style={{ accentColor: moodConfig?.color ?? "#F6D56A" }}
                  data-ocid="floating.toggle"
                />
                <span className="text-xs text-muted-foreground w-6">
                  {Math.round(volume * 100)}
                </span>
              </div>

              {/* Play/Pause */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: moodConfig?.color ?? "#F6D56A" }}
                data-ocid="floating.toggle"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Ambient
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Play Ambient
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="minimized"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 rounded-full shadow-card-hover flex items-center justify-center text-2xl transition-all relative"
            style={{ backgroundColor: moodConfig?.color ?? "#F6D56A" }}
            title="Open music player"
            data-ocid="floating.open_modal_button"
          >
            🎵
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
