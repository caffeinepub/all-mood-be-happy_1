import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onShareClick: () => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export default function Navbar({
  onShareClick,
  darkMode,
  setDarkMode,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Explore Moods", href: "#mood-picker" },
    { label: "Community", href: "#feed" },
    { label: "Support", href: "#support" },
    { label: "Chat", href: "#global-chat" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[rgba(16,14,30,0.96)] backdrop-blur-md shadow-sm border-b border-white/60 dark:border-white/10 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#home"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <span className="text-2xl">💛</span>
          <div className="leading-tight">
            <span className="font-bold text-base text-foreground tracking-tight">
              All Mood
            </span>
            <span className="block text-xs font-medium text-muted-foreground -mt-0.5">
              Be Happy
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.link"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            data-ocid="nav.toggle"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          <Button
            size="sm"
            className="hidden md:flex rounded-full bg-foreground text-white hover:bg-foreground/80 dark:bg-white dark:text-black dark:hover:bg-white/80 font-semibold px-5 transition-all"
            onClick={onShareClick}
            data-ocid="nav.primary_button"
          >
            Share Feelings
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            data-ocid="nav.toggle"
          >
            <div className="w-5 h-0.5 bg-foreground mb-1" />
            <div className="w-5 h-0.5 bg-foreground mb-1" />
            <div className="w-5 h-0.5 bg-foreground" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/98 dark:bg-[rgba(14,12,25,0.99)] border-t border-border px-4 py-4 flex flex-col gap-3 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/50 last:border-0"
              onClick={() => setMenuOpen(false)}
              data-ocid="nav.link"
            >
              {link.label}
            </a>
          ))}
          <Button
            className="rounded-full bg-foreground text-white dark:bg-white dark:text-black mt-2"
            onClick={() => {
              onShareClick();
              setMenuOpen(false);
            }}
            data-ocid="nav.primary_button"
          >
            Share Feelings
          </Button>
        </div>
      )}
    </header>
  );
}
