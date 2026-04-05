import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Heart, Loader2, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type FullPost, Reaction } from "../backend";
import {
  useAddComment,
  useGetComments,
  useReactToPost,
} from "../hooks/useQueries";
import {
  formatRelativeTime,
  getAvatarEmoji,
  getMoodConfig,
} from "../lib/moodUtils";

interface PostCardProps {
  post: FullPost;
  index: number;
}

const READ_MORE_THRESHOLD = 200;

export default function PostCard({ post, index }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const moodConfig = getMoodConfig(post.mood);
  const authorStr = post.author.toString();
  const avatarEmoji = getAvatarEmoji(authorStr);

  const isLongContent = post.content.length > READ_MORE_THRESHOLD;
  const displayContent =
    isLongContent && !expanded
      ? `${post.content.slice(0, READ_MORE_THRESHOLD)}...`
      : post.content;

  const { data: comments, isLoading: commentsLoading } = useGetComments(
    showComments ? post.id : null,
  );
  const { mutateAsync: reactToPost, isPending: reacting } = useReactToPost();
  const { mutateAsync: addComment, isPending: commenting } = useAddComment();

  const handleReact = async (reaction: Reaction) => {
    try {
      await reactToPost({ postId: post.id, reaction });
    } catch {
      toast.error("Could not react. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (!replyText.trim()) return;
    try {
      await addComment({ postId: post.id, content: replyText.trim() });
      setReplyText("");
      toast.success("Reply sent! 💬");
    } catch {
      toast.error("Could not add comment. Please try again.");
    }
  };

  const markerIndex = index + 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="card-glass rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all"
      style={{ borderLeft: `4px solid ${moodConfig.color}` }}
      data-ocid={`feed.item.${markerIndex}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-xs"
          style={{ backgroundColor: moodConfig.color, opacity: 0.9 }}
        >
          {avatarEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              Anonymous Friend
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${moodConfig.chipClass}`}
            >
              {moodConfig.emoji} {moodConfig.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {displayContent}
        </p>
        {isLongContent && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold mt-1 transition-colors"
            style={{ color: moodConfig.color }}
            data-ocid={`feed.readmore_button.${markerIndex}`}
          >
            {expanded ? "Show less ▲" : "Read more ▼"}
          </button>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={() => handleReact(Reaction.support)}
          disabled={reacting}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-rose-500 transition-colors rounded-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          data-ocid={`feed.reaction_button.${markerIndex}`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Support</span>
          {post.supportCount > 0n && (
            <span className="font-bold text-foreground">
              {post.supportCount.toString()}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleReact(Reaction.meToo)}
          disabled={reacting}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-500 transition-colors rounded-full px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          data-ocid={`feed.metoo_button.${markerIndex}`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Me Too</span>
          {post.meTooCount > 0n && (
            <span className="font-bold text-foreground">
              {post.meTooCount.toString()}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-purple-500 transition-colors rounded-full px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 ml-auto"
          data-ocid={`feed.reply_button.${markerIndex}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Reply</span>
          {post.commentCount > 0n && (
            <span className="font-bold text-foreground">
              {post.commentCount.toString()}
            </span>
          )}
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-border/50 overflow-hidden"
          >
            {commentsLoading ? (
              <div
                className="flex items-center gap-2 text-xs text-muted-foreground py-2"
                data-ocid={`feed.comments_loading.${markerIndex}`}
              >
                <Loader2 className="w-3 h-3 animate-spin" /> Loading replies...
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {(!comments || comments.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">
                    No replies yet. Be the first! 💬
                  </p>
                )}
                {comments?.map((comment) => (
                  <div
                    key={`${comment.postId}-${comment.author}-${comment.createdAt}`}
                    className="flex gap-2"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        backgroundColor: moodConfig.color,
                        opacity: 0.6,
                      }}
                    >
                      {getAvatarEmoji(comment.author.toString())}
                    </div>
                    <div className="flex-1 bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">
                          Anonymous Friend
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Write a supportive reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 text-xs rounded-xl min-h-[60px] resize-none bg-white/60 dark:bg-white/5"
                data-ocid={`feed.comment_input.${markerIndex}`}
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={commenting || !replyText.trim()}
                className="rounded-xl bg-foreground dark:bg-white text-white dark:text-black self-end"
                data-ocid={`feed.comment_submit.${markerIndex}`}
              >
                {commenting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
