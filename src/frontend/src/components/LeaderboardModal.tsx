import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { formatDate, getLeaderboard } from "../game/leaderboard";
import type { LeaderboardEntry } from "../game/leaderboard";

type FilterMode = "All" | "Solo" | "Duo A" | "Duo B";

const FILTER_TABS: FilterMode[] = ["All", "Solo", "Duo A", "Duo B"];

const RANK_STYLES: Record<
  number,
  { color: string; icon: string; glow: string }
> = {
  1: { color: "#FFD700", icon: "🥇", glow: "rgba(255,215,0,0.4)" },
  2: { color: "#C0C0C0", icon: "🥈", glow: "rgba(192,192,192,0.3)" },
  3: { color: "#CD7F32", icon: "🥉", glow: "rgba(205,127,50,0.3)" },
};

const MODE_COLORS: Record<string, string> = {
  Solo: "#00E6FF",
  "Duo A": "#8A3DFF",
  "Duo B": "#FF3A4E",
};

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({
  open,
  onClose,
}: LeaderboardModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterMode>("All");

  const allEntries = getLeaderboard();
  const filtered: LeaderboardEntry[] =
    activeFilter === "All"
      ? allEntries
      : allEntries.filter((e) => e.mode === activeFilter);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="leaderboard-overlay"
          data-ocid="leaderboard.modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{
            background: "rgba(5,8,18,0.92)",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="flex flex-col w-full mx-4 rounded-sm overflow-hidden"
            style={{
              maxWidth: "480px",
              maxHeight: "80vh",
              background: "rgba(5,8,18,0.98)",
              border: "2px solid rgba(0,230,255,0.5)",
              boxShadow:
                "0 0 60px rgba(0,230,255,0.2), 0 0 120px rgba(138,61,255,0.1)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{
                borderBottom: "1px solid rgba(0,230,255,0.15)",
                background: "rgba(0,230,255,0.04)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h2
                    className="text-base font-black tracking-widest uppercase"
                    style={{
                      color: "#00E6FF",
                      textShadow: "0 0 20px rgba(0,230,255,0.6)",
                      fontFamily: "Orbitron, monospace",
                    }}
                  >
                    Leaderboard
                  </h2>
                  <p className="text-xs" style={{ color: "#9AA7C0" }}>
                    Top 10 survival scores
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="leaderboard.close_button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-sm transition-colors"
                style={{
                  border: "1px solid rgba(154,167,192,0.3)",
                  color: "#9AA7C0",
                  background: "transparent",
                }}
                aria-label="Close leaderboard"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div
              className="flex items-center gap-2 px-6 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(0,230,255,0.1)" }}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab;
                const modeColor =
                  tab === "All" ? "#00E6FF" : (MODE_COLORS[tab] ?? "#00E6FF");
                return (
                  <button
                    key={tab}
                    type="button"
                    data-ocid={`leaderboard.${tab.toLowerCase().replace(" ", "_")}.tab`}
                    onClick={() => setActiveFilter(tab)}
                    className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-sm transition-all"
                    style={{
                      border: `1px solid ${isActive ? modeColor : "rgba(154,167,192,0.2)"}`,
                      color: isActive ? modeColor : "#9AA7C0",
                      background: isActive
                        ? `rgba(${modeColor === "#00E6FF" ? "0,230,255" : modeColor === "#8A3DFF" ? "138,61,255" : "255,58,78"},0.1)`
                        : "transparent",
                      boxShadow: isActive ? `0 0 10px ${modeColor}44` : "none",
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Scores Table */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              {filtered.length === 0 ? (
                <div
                  data-ocid="leaderboard.empty_state"
                  className="flex flex-col items-center justify-center py-16 px-6 gap-3"
                >
                  <span className="text-4xl">🎮</span>
                  <p
                    className="text-sm text-center"
                    style={{ color: "#9AA7C0" }}
                  >
                    No scores yet.
                    <br />
                    Play a match to get on the board!
                  </p>
                </div>
              ) : (
                <table
                  className="w-full text-xs"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        borderBottom: "1px solid rgba(0,230,255,0.1)",
                      }}
                    >
                      <th
                        className="py-2 px-3 text-left font-bold tracking-wider uppercase"
                        style={{ color: "#9AA7C0", width: "40px" }}
                      >
                        #
                      </th>
                      <th
                        className="py-2 px-3 text-left font-bold tracking-wider uppercase"
                        style={{ color: "#9AA7C0" }}
                      >
                        Name
                      </th>
                      <th
                        className="py-2 px-3 text-center font-bold tracking-wider uppercase"
                        style={{ color: "#9AA7C0", width: "56px" }}
                      >
                        Score
                      </th>
                      <th
                        className="py-2 px-3 text-center font-bold tracking-wider uppercase"
                        style={{ color: "#9AA7C0", width: "52px" }}
                      >
                        Mode
                      </th>
                      <th
                        className="py-2 px-3 text-center font-bold tracking-wider uppercase hidden sm:table-cell"
                        style={{ color: "#9AA7C0", width: "56px" }}
                      >
                        Lvl
                      </th>
                      <th
                        className="py-2 px-3 text-right font-bold tracking-wider uppercase hidden sm:table-cell"
                        style={{ color: "#9AA7C0", width: "72px" }}
                      >
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => {
                      const rank = idx + 1;
                      const rankStyle = RANK_STYLES[rank];
                      const modeColor = MODE_COLORS[entry.mode] ?? "#9AA7C0";
                      return (
                        <motion.tr
                          key={`${entry.playerName}-${entry.date}-${idx}`}
                          data-ocid={`leaderboard.item.${rank}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{
                            borderBottom: "1px solid rgba(0,230,255,0.07)",
                            background:
                              rank === 1
                                ? "rgba(255,215,0,0.05)"
                                : rank === 2
                                  ? "rgba(192,192,192,0.04)"
                                  : rank === 3
                                    ? "rgba(205,127,50,0.04)"
                                    : "transparent",
                          }}
                        >
                          <td className="py-2.5 px-3">
                            {rankStyle ? (
                              <span
                                className="text-base"
                                style={{
                                  filter: `drop-shadow(0 0 6px ${rankStyle.glow})`,
                                }}
                              >
                                {rankStyle.icon}
                              </span>
                            ) : (
                              <span
                                className="font-bold"
                                style={{ color: "rgba(154,167,192,0.6)" }}
                              >
                                {rank}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className="font-semibold truncate block max-w-[100px]"
                              style={{
                                color: rankStyle ? rankStyle.color : "#E8EDF5",
                                textShadow: rankStyle
                                  ? `0 0 8px ${rankStyle.glow}`
                                  : "none",
                              }}
                            >
                              {entry.playerName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className="font-black"
                              style={{
                                color: entry.won ? "#00FF88" : "#FF8A6A",
                                fontFamily: "Orbitron, monospace",
                                fontSize: "11px",
                              }}
                            >
                              {entry.score}s
                            </span>
                            <span
                              className="block text-[9px] mt-0.5"
                              style={{
                                color: entry.won
                                  ? "rgba(0,255,136,0.6)"
                                  : "rgba(255,138,106,0.6)",
                              }}
                            >
                              {entry.won ? "WIN" : "LOSS"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold"
                              style={{
                                color: modeColor,
                                border: `1px solid ${modeColor}55`,
                                background: `${modeColor}11`,
                              }}
                            >
                              {entry.mode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center hidden sm:table-cell">
                            <span style={{ color: "#9AA7C0" }}>
                              L{entry.levelId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                            <span style={{ color: "rgba(154,167,192,0.5)" }}>
                              {formatDate(entry.date)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 text-center shrink-0"
              style={{
                borderTop: "1px solid rgba(0,230,255,0.1)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <p
                className="text-[10px]"
                style={{ color: "rgba(154,167,192,0.4)" }}
              >
                Scores stored locally • Top 10 per all-time leaderboard
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
