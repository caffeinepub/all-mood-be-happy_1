import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import type { Mood } from "./backend";

import { motion } from "motion/react";
import CommunityFeed from "./components/CommunityFeed";
import FloatingMusicPlayer from "./components/FloatingMusicPlayer";
import GlobalChat from "./components/GlobalChat";
import HeroSection from "./components/HeroSection";
import MoodMusicPlayer from "./components/MoodMusicPlayer";
import MoodPicker from "./components/MoodPicker";
import Navbar from "./components/Navbar";
import PostComposer from "./components/PostComposer";
import Sidebar from "./components/Sidebar";

const footerLinks = ["About", "Help", "Privacy Policy", "Contact Us"];
const footerMoods = [
  "😊 Happy",
  "😢 Sad",
  "😤 Stress",
  "🥰 Love",
  "😠 Angry",
  "😰 Anxious",
  "🌟 Hopeful",
];

export default function App() {
  const composerRef = useRef<HTMLDivElement>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });

  // Apply dark class on mount and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const scrollToComposer = () => {
    composerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar
        onShareClick={scrollToComposer}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main>
        {/* Hero */}
        <HeroSection onShareClick={scrollToComposer} />

        {/* Mood Picker */}
        <MoodPicker selectedMood={selectedMood} onSelect={setSelectedMood} />

        {/* Main Content */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <PostComposer
                composerRef={composerRef}
                selectedMood={selectedMood}
              />
              <CommunityFeed selectedMood={selectedMood} />
              <GlobalChat selectedMood={selectedMood} />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-5">
                <Sidebar selectedMood={selectedMood} />
                <MoodMusicPlayer selectedMood={selectedMood} />
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 dark:bg-[rgba(14,12,25,0.95)] backdrop-blur-md border-t border-border/60 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💛</span>
                <span className="font-bold text-foreground">
                  All Mood Be Happy
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A global platform for emotional support, connection, and
                healing. You are never alone. 🌍
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1.5">
              <h5 className="text-xs font-bold text-foreground mb-1">
                Explore
              </h5>
              {footerLinks.map((link) => (
                <a
                  key={link}
                  href="#home"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Moods */}
            <div>
              <h5 className="text-xs font-bold text-foreground mb-2">
                Moods We Support
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {footerMoods.map((mood) => (
                  <span
                    key={mood}
                    className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} All Mood Be Happy. Made with ❤️ for
              the world.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline underline-offset-2"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
      <FloatingMusicPlayer selectedMood={selectedMood} />
    </div>
  );
}
