import { motion } from "motion/react";
import type { Mood } from "../backend";
import { MOOD_CONFIGS, type MoodConfig } from "../lib/moodUtils";

interface MoodPickerProps {
  selectedMood: Mood | null;
  onSelect: (mood: Mood | null) => void;
}

export default function MoodPicker({
  selectedMood,
  onSelect,
}: MoodPickerProps) {
  const handleSelect = (mood: Mood) => {
    onSelect(selectedMood === mood ? null : mood);
  };

  return (
    <section
      id="mood-picker"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-7"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          How are you feeling today?
        </h2>
        <p className="text-muted-foreground text-sm">
          Select a mood to filter posts and get personalized support
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {MOOD_CONFIGS.map((config: MoodConfig, i: number) => (
          <motion.button
            key={config.key}
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            onClick={() => handleSelect(config.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm cursor-pointer transition-all shadow-xs ${
              config.chipClass
            } ${
              selectedMood === config.key
                ? "ring-2 ring-foreground/40 shadow-card scale-105"
                : "hover:shadow-card opacity-90 hover:opacity-100"
            }`}
            data-ocid="mood.tab"
          >
            <span className="text-lg">{config.emoji}</span>
            {config.label}
          </motion.button>
        ))}
      </motion.div>

      {selectedMood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-4"
        >
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            data-ocid="mood.clear_button"
          >
            Clear filter · Show all moods
          </button>
        </motion.div>
      )}
    </section>
  );
}
