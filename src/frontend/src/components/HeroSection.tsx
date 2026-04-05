import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

interface HeroSectionProps {
  onShareClick: () => void;
}

const orbitEmojis = [
  {
    emoji: "😊",
    style: { top: "5%", left: "50%", transform: "translateX(-50%)" },
  },
  { emoji: "💙", style: { top: "25%", right: "2%" } },
  { emoji: "🌟", style: { bottom: "20%", right: "5%" } },
  {
    emoji: "🌸",
    style: { bottom: "5%", left: "50%", transform: "translateX(-50%)" },
  },
  { emoji: "🌿", style: { bottom: "20%", left: "5%" } },
  { emoji: "💛", style: { top: "25%", left: "2%" } },
];

export default function HeroSection({ onShareClick }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-16"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 bg-white/70 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6 shadow-xs">
            <span>🌍</span> A safe space for the world
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-5 tracking-tight">
            All Mood{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Be Happy</span>
              <span
                className="absolute inset-x-0 bottom-1 h-3 rounded-full -z-0"
                style={{ background: "#F6D56A", opacity: 0.5 }}
              />
            </span>
            <span className="text-4xl ml-2">💛</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
            A safe space to share your feelings with the world.{" "}
            <strong className="text-foreground font-semibold">
              Express yourself
            </strong>
            , find support, and discover peace. You are never alone. 🌸
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Button
              size="lg"
              className="rounded-full bg-foreground text-white hover:bg-foreground/80 font-bold px-8 py-6 text-base shadow-card transition-all hover:shadow-card-hover"
              onClick={onShareClick}
              data-ocid="hero.primary_button"
            >
              Share Your Feelings ✨
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-2 border-foreground/30 text-foreground hover:border-foreground font-semibold px-8 py-6 text-base"
              onClick={() =>
                document
                  .getElementById("feed")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              data-ocid="hero.secondary_button"
            >
              Explore Community
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-8 justify-center md:justify-start">
            {[
              { value: "10K+", label: "Emotions shared" },
              { value: "50+", label: "Countries" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-extrabold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Decorative Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="flex justify-center md:justify-end"
        >
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
            {/* Background circle */}
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background:
                  "radial-gradient(circle, #D9CCFF 0%, #BFEFE3 50%, #F7C7B8 100%)",
              }}
            />
            {/* Central face */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center animate-float">
                <div className="text-7xl md:text-8xl mb-2">🤗</div>
                <div className="text-sm font-semibold text-foreground/70 bg-white/80 rounded-full px-4 py-1">
                  You're not alone
                </div>
              </div>
            </div>
            {/* Orbiting mood emojis */}
            {orbitEmojis.map((item) => (
              <motion.div
                key={item.emoji}
                className="absolute w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-card text-xl"
                style={item.style}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {item.emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
