import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useState } from "react";
import type { FullPost, Mood } from "../backend";
import { useGetAllPosts } from "../hooks/useQueries";
import { MOOD_CONFIGS } from "../lib/moodUtils";
import PostCard from "./PostCard";

interface CommunityFeedProps {
  selectedMood: Mood | null;
}

function PostSkeleton() {
  return (
    <div className="card-glass rounded-2xl p-5 shadow-xs">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3 w-32 mb-1.5" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export default function CommunityFeed({ selectedMood }: CommunityFeedProps) {
  const { data: posts, isLoading, isError } = useGetAllPosts();
  const [activeFilter, setActiveFilter] = useState<Mood | null>(selectedMood);

  const effectiveFilter = selectedMood ?? activeFilter;

  const filteredPosts: FullPost[] = effectiveFilter
    ? (posts ?? []).filter((p) => p.mood === effectiveFilter)
    : (posts ?? []);

  const sortedPosts = [...filteredPosts].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  const totalPosts = (posts ?? []).length;

  return (
    <section id="feed">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4"
      >
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>🌍</span> Community Vibe Feed
          </h3>
          <Badge variant="secondary" className="text-xs font-semibold">
            {totalPosts} {totalPosts === 1 ? "post" : "posts"}
          </Badge>
          {effectiveFilter && (
            <span className="text-xs text-muted-foreground">
              · Showing {sortedPosts.length} {effectiveFilter} posts
            </span>
          )}
        </div>

        {/* Emotion filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              effectiveFilter === null
                ? "bg-foreground text-white dark:bg-white dark:text-black shadow-xs scale-105"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
            data-ocid="feed.filter.tab"
          >
            All
          </button>
          {MOOD_CONFIGS.map((config) => (
            <button
              type="button"
              key={config.key}
              onClick={() =>
                setActiveFilter(activeFilter === config.key ? null : config.key)
              }
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                effectiveFilter === config.key
                  ? `${config.chipClass} shadow-xs scale-105 ring-2 ring-foreground/20`
                  : `${config.chipClass} opacity-60 hover:opacity-100`
              }`}
              data-ocid="feed.filter.tab"
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-4">
        {isLoading && (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {isError && (
          <div
            className="card-glass rounded-2xl p-6 text-center"
            data-ocid="feed.error_state"
          >
            <div className="text-3xl mb-2">😔</div>
            <p className="text-muted-foreground text-sm">
              Could not load posts. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && sortedPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-glass rounded-2xl p-10 text-center"
            data-ocid="feed.empty_state"
          >
            <div className="text-5xl mb-3">🌟</div>
            <p className="font-semibold text-foreground mb-1">
              {effectiveFilter
                ? "No posts for this mood yet"
                : "Be the first to share your feelings"}
            </p>
            <p className="text-muted-foreground text-sm">
              {effectiveFilter
                ? "Be the first to share this emotion with the community 💙"
                : "Your story could inspire someone today 🌸"}
            </p>
          </motion.div>
        )}

        {sortedPosts.map((post, i) => (
          <PostCard key={post.id.toString()} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}
