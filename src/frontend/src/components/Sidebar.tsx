import { motion } from "motion/react";
import type { Mood } from "../backend";
import { MOOD_CONFIGS, getMoodConfig } from "../lib/moodUtils";

interface SidebarProps {
  selectedMood: Mood | null;
}

const supportTips = [
  { icon: "🎵", text: "Listen to calming, soothing music" },
  { icon: "📓", text: "Try journaling your thoughts and feelings" },
  { icon: "🤝", text: "Reach out to someone you trust" },
  { icon: "🌬️", text: "Take 5 slow, deep breaths right now" },
  { icon: "☀️", text: "Step outside and get some sunlight" },
];

export default function Sidebar({ selectedMood }: SidebarProps) {
  const solutionMoods = selectedMood
    ? [getMoodConfig(selectedMood)]
    : MOOD_CONFIGS.slice(0, 3);

  return (
    <aside id="support" className="space-y-5">
      {/* Community Support Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="card-glass rounded-2xl p-5 shadow-card"
        style={{
          background: "linear-gradient(135deg, #DDEEFF 0%, #EEF7FF 100%)",
          border: "1px solid #8FC9FF",
        }}
      >
        <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
          <span>💙</span> Community Support
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          You are not alone. Here are some gentle reminders:
        </p>
        <ul className="space-y-2.5">
          {supportTips.map((tip) => (
            <li
              key={tip.text}
              className="flex items-start gap-2 text-xs text-foreground/80"
            >
              <span className="text-base leading-none mt-0.5">{tip.icon}</span>
              {tip.text}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mood Solution Cards */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 px-1">
          {selectedMood ? "Solutions for You" : "Popular Solutions"}
        </h4>
        <div className="space-y-4">
          {solutionMoods.map((config, i) => (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`rounded-2xl p-4 border-2 shadow-xs ${config.solutionCardClass}`}
              data-ocid={`sidebar.solution_card.${i + 1}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.chipClass}`}
                >
                  {config.emoji} {config.label}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground mb-2">
                {config.solutions.title}
              </p>
              <ul className="space-y-1.5">
                {config.solutions.tips.map((tip) => (
                  <li
                    key={tip}
                    className="text-xs text-foreground/75 flex items-start gap-1.5"
                  >
                    <span className="text-foreground/40 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Crisis Support */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl p-4 text-center"
        style={{
          background: "linear-gradient(135deg, #F7C7B8 0%, #FFF0EF 100%)",
          border: "1px solid #F46D63",
        }}
      >
        <div className="text-2xl mb-1">🆘</div>
        <p className="text-xs font-bold text-foreground mb-1">
          Need urgent help?
        </p>
        <p className="text-xs text-muted-foreground">
          If you're in crisis, please reach out to a mental health professional
          or a trusted person near you.
        </p>
      </motion.div>
    </aside>
  );
}
