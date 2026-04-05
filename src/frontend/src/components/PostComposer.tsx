import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Mood } from "../backend";
import { useCreatePost } from "../hooks/useQueries";
import { MOOD_CONFIGS } from "../lib/moodUtils";

interface PostComposerProps {
  composerRef?: React.RefObject<HTMLDivElement | null>;
  selectedMood?: Mood | null;
}

const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: [
    "happy",
    "joy",
    "excited",
    "great",
    "wonderful",
    "amazing",
    "smile",
    "laugh",
    "celebrate",
    "blessed",
  ],
  sad: [
    "sad",
    "cry",
    "tears",
    "depressed",
    "unhappy",
    "heartbreak",
    "lonely",
    "miss",
    "grief",
    "hurt",
  ],
  stress: [
    "stress",
    "stressed",
    "overwhelm",
    "pressure",
    "burden",
    "exhausted",
    "tired",
    "burned out",
    "overload",
  ],
  love: [
    "love",
    "crush",
    "heart",
    "romantic",
    "boyfriend",
    "girlfriend",
    "dating",
    "kiss",
    "adore",
    "darling",
  ],
  angry: [
    "angry",
    "anger",
    "mad",
    "furious",
    "rage",
    "hate",
    "annoyed",
    "frustrated",
    "livid",
    "outraged",
  ],
  anxious: [
    "anxious",
    "anxiety",
    "worry",
    "nervous",
    "panic",
    "fear",
    "scared",
    "dread",
    "uneasy",
  ],
  hopeful: [
    "hope",
    "hopeful",
    "dream",
    "future",
    "believe",
    "faith",
    "positive",
    "better",
    "optimistic",
  ],
};

function detectEmotion(text: string): Mood | null {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = keywords.filter((kw) => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return null;
  return best[0] as Mood;
}

export default function PostComposer({
  composerRef,
  selectedMood,
}: PostComposerProps) {
  const { mutateAsync: createPost, isPending } = useCreatePost();

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>(selectedMood ?? Mood.happy);
  const [detectedMood, setDetectedMood] = useState<Mood | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    // Auto-grow
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // Emotion detection
    const detected = detectEmotion(value);
    if (detected && detected !== detectedMood) {
      setDetectedMood(detected);
      setMood(detected);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Please write something before posting.");
      return;
    }
    try {
      await createPost({ mood, content: content.trim() });
      setContent("");
      setDetectedMood(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      toast.success("Your feelings have been shared with the world! 💛");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const activeMoodConfig = MOOD_CONFIGS.find((m) => m.key === mood);

  return (
    <div
      ref={composerRef}
      className="card-glass rounded-2xl p-5 shadow-card"
      data-ocid="composer.card"
    >
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span>✍️</span> Share Your Story
        <span className="ml-auto text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
          Anonymous Friend
        </span>
      </h3>

      <div className="flex gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-xs transition-all duration-300"
          style={{
            backgroundColor: activeMoodConfig?.color ?? "#F6D56A",
            opacity: 0.85,
          }}
        >
          {activeMoodConfig?.emoji ?? "😊"}
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder="What's on your mind? Share your feelings freely... Your voice matters here 🌸"
            value={content}
            onChange={handleContentChange}
            className="w-full resize-none rounded-xl border border-border bg-white/60 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 text-sm min-h-[90px] p-3 outline-none focus:ring-2 focus:ring-ring/50 transition-all text-foreground placeholder:text-muted-foreground leading-relaxed overflow-hidden"
            style={{ height: "auto" }}
            data-ocid="composer.textarea"
          />
        </div>
      </div>

      {detectedMood && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
          <span>✨</span>
          <span>Emotion detected:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded-full ${MOOD_CONFIGS.find((m) => m.key === detectedMood)?.chipClass}`}
          >
            {MOOD_CONFIGS.find((m) => m.key === detectedMood)?.emoji}{" "}
            {detectedMood}
          </span>
          <span className="text-muted-foreground/60">— mood auto-selected</span>
        </div>
      )}

      {/* Mood selector */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          How are you feeling?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_CONFIGS.map((config) => (
            <button
              type="button"
              key={config.key}
              onClick={() => {
                setMood(config.key);
                setDetectedMood(null);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                config.chipClass
              } ${
                mood === config.key
                  ? "ring-2 ring-foreground/30 scale-105 shadow-xs"
                  : "opacity-70 hover:opacity-100"
              }`}
              data-ocid="composer.mood_select"
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length > 0
            ? `${content.length} characters`
            : "No limit — write freely"}
        </span>
        <Button
          onClick={handlePost}
          disabled={isPending || !content.trim()}
          className="rounded-full bg-foreground dark:bg-white text-white dark:text-black hover:bg-foreground/80 dark:hover:bg-white/80 font-semibold px-6 transition-all"
          data-ocid="composer.submit_button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
            </>
          ) : (
            "Post ✨"
          )}
        </Button>
      </div>
    </div>
  );
}
