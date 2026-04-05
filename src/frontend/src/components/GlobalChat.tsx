import { MessageSquare, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Mood } from "../backend";
import { MOOD_CONFIGS } from "../lib/moodUtils";

interface GlobalChatProps {
  selectedMood: Mood | null;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  isOwn: boolean;
  timestamp: number;
  mood: string;
}

const ADJECTIVES = [
  "Calm",
  "Brave",
  "Kind",
  "Gentle",
  "Bright",
  "Warm",
  "Cool",
  "Sweet",
  "Soft",
  "Bold",
  "Free",
  "Pure",
  "Wise",
  "True",
  "Bliss",
];
const ANIMALS = [
  "Panda",
  "Eagle",
  "Fox",
  "Deer",
  "Owl",
  "Bear",
  "Wolf",
  "Dove",
  "Hawk",
  "Lamb",
  "Lion",
  "Swan",
  "Tiger",
  "Whale",
  "Crane",
];

const AI_RESPONSES: Record<string, string[]> = {
  happy: [
    "Your joy is contagious! Keep spreading that beautiful energy 🌟",
    "Happiness looks great on you! What's your secret? 😊",
    "Love seeing your positive vibes! You're inspiring others today 💛",
    "Your smile can light up the world. Keep shining! ☀️",
    "That happiness energy is pure magic. Cherish this moment! 🌈",
  ],
  sad: [
    "I hear you, and your feelings are completely valid. You're not alone 💙",
    "It's okay to feel sad. Tears are just love with nowhere to go 🌧️",
    "Take one breath at a time. This feeling will pass, I promise 🤗",
    "You reached out, and that took courage. We're here with you 💜",
    "Even the darkest nights end with sunrise. Hang in there ⭐",
  ],
  stress: [
    "Take a slow, deep breath. You've got through tough times before 🌿",
    "One thing at a time. You don't have to solve everything today 🧘",
    "Feeling overwhelmed is your signal to pause, not give up 💚",
    "You're stronger than the stress. Take 5 minutes just for you 🌊",
    "Breathe in peace, breathe out tension. You've got this 🌬️",
  ],
  love: [
    "Love is one of the most beautiful feelings. Cherish it 💕",
    "Whether it's new or old, love is always worth celebrating 🌸",
    "Your heart is brave for opening up to love. That's beautiful 💗",
    "Love changes everything for the better. Enjoy every moment 🥰",
    "You deserve all the love you're feeling right now 💝",
  ],
  angry: [
    "Your anger is valid. Take a moment before reacting 🔥",
    "Count to 10 slowly. Your response is more powerful when calm 🧊",
    "It's okay to feel angry. Channel it into something positive 💪",
    "Even anger has wisdom in it — what is it trying to tell you? 🤔",
    "Take a walk, breathe deep. You'll handle this with grace 🌿",
  ],
  anxious: [
    "Try the 5-4-3-2-1 technique: 5 things you see, 4 you hear... 🌊",
    "Anxiety is a liar. You're safe right now, right here 🏠",
    "Your breathing is your anchor. In for 4, out for 6 💙",
    "This feeling is temporary. You've survived every anxious moment so far 🌟",
    "Ground yourself: feel your feet on the floor. You're okay 🌱",
  ],
  hopeful: [
    "That hope you feel? Hold onto it. It's your compass 🌟",
    "Hope is the foundation of everything beautiful that's coming 🌅",
    "Your optimism is a gift — to yourself and everyone around you ⭐",
    "Keep believing. Great things are taking shape for you 🌈",
    "Hope and action together can move mountains. You're on the right track 💫",
  ],
};

function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}${animal}`;
}

function getStoredNickname(): string {
  const stored = localStorage.getItem("chat_nickname");
  if (stored) return stored;
  const nickname = generateNickname();
  localStorage.setItem("chat_nickname", nickname);
  return nickname;
}

function getStoredMessages(room: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`chat_room_${room}`);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(room: string, messages: ChatMessage[]) {
  const last50 = messages.slice(-50);
  localStorage.setItem(`chat_room_${room}`, JSON.stringify(last50));
}

export default function GlobalChat({ selectedMood }: GlobalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const nickname = getStoredNickname();
  const room = selectedMood ?? "happy";
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getStoredMessages(room),
  );
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const moodConfig = MOOD_CONFIGS.find((m) => m.key === room);

  // When room changes, load messages
  useEffect(() => {
    setMessages(getStoredMessages(room));
  }, [room]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender: nickname,
      isOwn: true,
      timestamp: Date.now(),
      mood: room,
    };

    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(room, updated);
    setInputText("");

    // Scroll to bottom after send
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    // Show typing indicator then AI response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setAiTyping(true);
      setTimeout(() => {
        setAiTyping(false);
        const responses = AI_RESPONSES[room] ?? AI_RESPONSES.happy;
        const reply = responses[Math.floor(Math.random() * responses.length)];
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          text: reply,
          sender: "Support Guide",
          isOwn: false,
          timestamp: Date.now(),
          mood: room,
        };
        const withAi = [...updated, aiMsg];
        setMessages(withAi);
        saveMessages(room, withAi);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }, 1800);
    }, 2000);
  };

  const reportMessage = (id: string) => {
    const filtered = messages.filter((m) => m.id !== id);
    setMessages(filtered);
    saveMessages(room, filtered);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section id="global-chat" className="mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="card-glass rounded-2xl shadow-card overflow-hidden"
        data-ocid="chat.card"
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
          data-ocid="chat.toggle"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                backgroundColor: moodConfig?.color ?? "#A7DEA4",
                opacity: 0.8,
              }}
            >
              💬
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Global Chat Room
                </span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground">
                Chatting as{" "}
                <strong className="text-foreground">{nickname}</strong>
                {selectedMood && (
                  <>
                    {" "}
                    · {moodConfig?.emoji} {moodConfig?.label} room
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-muted-foreground text-sm"
            >
              ▼
            </motion.span>
          </div>
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
              {/* Room selector */}
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground self-center">
                  Room:
                </span>
                {MOOD_CONFIGS.map((config) => (
                  <span
                    key={config.key}
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      room === config.key
                        ? `${config.chipClass} ring-2 ring-foreground/20`
                        : "bg-muted text-muted-foreground opacity-60"
                    }`}
                  >
                    {config.emoji} {config.label}
                  </span>
                ))}
              </div>

              {/* Messages */}
              <div
                className="px-4 h-72 overflow-y-auto flex flex-col gap-3 py-3 scroll-smooth"
                data-ocid="chat.panel"
              >
                {messages.length === 0 && (
                  <div
                    className="flex-1 flex items-center justify-center"
                    data-ocid="chat.empty_state"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">👋</div>
                      <p className="text-sm text-muted-foreground">
                        Start the conversation!
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Be kind, be supportive 💙
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    } group`}
                    data-ocid="chat.row"
                  >
                    <div
                      className={`max-w-[80%] ${
                        msg.isOwn ? "items-end" : "items-start"
                      } flex flex-col gap-0.5`}
                    >
                      <div className="flex items-center gap-1.5">
                        {!msg.isOwn && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {msg.sender}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground/60">
                          {formatTime(msg.timestamp)}
                        </span>
                        {!msg.isOwn && (
                          <button
                            type="button"
                            onClick={() => reportMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
                            title="Report"
                            data-ocid="chat.delete_button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.isOwn
                            ? "text-white rounded-br-sm"
                            : "bg-white/70 dark:bg-white/10 text-foreground rounded-bl-sm"
                        }`}
                        style={
                          msg.isOwn
                            ? {
                                backgroundColor: moodConfig?.color ?? "#A7DEA4",
                              }
                            : {}
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(isTyping || aiTyping) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="text-xs text-muted-foreground">
                        Support Guide
                      </span>
                      <div className="bg-white/70 dark:bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
                        {[0, 0.15, 0.3].map((delay) => (
                          <motion.span
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Number.POSITIVE_INFINITY,
                              delay,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border/40 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder={`Share in the ${moodConfig?.label ?? ""} room...`}
                  className="flex-1 text-sm rounded-xl border border-border bg-white/60 dark:bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-ring/50 text-foreground placeholder:text-muted-foreground"
                  data-ocid="chat.input"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl transition-all disabled:opacity-40"
                  style={{ backgroundColor: moodConfig?.color ?? "#A7DEA4" }}
                  data-ocid="chat.submit_button"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
