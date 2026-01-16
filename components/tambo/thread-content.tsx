"use client";

import {
  Message,
  MessageContent,
  MessageImages,
  MessageRenderedComponentArea,
  ReasoningInfo,
  ToolcallInfo,
  type messageVariants,
} from "@/components/tambo/message";
import { QuerySuggestionView } from "@/components/tambo/query-suggestion";
import { cn } from "@/lib/utils";
import { type TamboThreadMessage, useTambo } from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

function extractQueryFromToolResult(
  content: TamboThreadMessage["content"],
): { query: string; description?: string } | null {
  if (!content) return null;

  const parseQueryObject = (value: unknown): { query: string; description?: string } | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    // Check for suggested query first (from suggest_clickhouse_query tool)
    if (typeof record.suggestedQuery === "string") {
      return {
        query: record.suggestedQuery,
        description: typeof record.description === "string" ? record.description : undefined
      };
    }
    if (typeof record.executedQuery === "string") return { query: record.executedQuery };
    if (typeof record.query === "string") return { query: record.query };
    if (typeof record.sql === "string") return { query: record.sql };
    return null;
  };

  const parseQueryText = (text: string): { query: string; description?: string } | null => {
    try {
      const parsed = JSON.parse(text);
      return parseQueryObject(parsed);
    } catch {
      return null;
    }
  };

  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const part = block as { type?: string; content?: unknown; text?: string };

      if (part.type === "tool_result" && part.content) {
        if (typeof part.content === "string") {
          const result = parseQueryText(part.content);
          if (result) return result;
        } else {
          const result = parseQueryObject(part.content);
          if (result) return result;
        }
      }

      if (part.type === "text" && typeof part.text === "string") {
        const result = parseQueryText(part.text);
        if (result) return result;
      }
    }
  }

  if (typeof content === "string") {
    return parseQueryText(content);
  }

  return parseQueryObject(content);
}

const getMessageKey = (message: TamboThreadMessage): string =>
  message.id ?? `${message.role}-${message.createdAt ?? "unknown"}`;

/**
 * @typedef ThreadContentContextValue
 * @property {Array} messages - Array of message objects in the thread
 * @property {boolean} isGenerating - Whether a response is being generated
 * @property {string|undefined} generationStage - Current generation stage
 * @property {VariantProps<typeof messageVariants>["variant"]} [variant] - Optional styling variant for messages
 */
interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  isGenerating: boolean;
  generationStage?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * React Context for sharing thread data among sub-components.
 * @internal
 */
const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

/**
 * Hook to access the thread content context.
 * @returns {ThreadContentContextValue} The thread content context value.
 * @throws {Error} If used outside of ThreadContent.
 * @internal
 */
const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent",
    );
  }
  return context;
};

/**
 * Props for the ThreadContent component.
 * Extends standard HTMLDivElement attributes.
 */
export interface ThreadContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** The child elements to render within the container. */
  children?: React.ReactNode;
}

/**
 * The root container for thread content.
 * It establishes the context for its children using data from the Tambo hook.
 * @component ThreadContent
 * @example
 * ```tsx
 * <ThreadContent variant="solid">
 *   <ThreadContent.Messages />
 * </ThreadContent>
 * ```
 */
const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { thread, generationStage, isIdle } = useTambo();
    const isGenerating = !isIdle;

    const contextValue = React.useMemo(
      () => ({
        messages: thread?.messages ?? [],
        isGenerating,
        generationStage,
        variant,
      }),
      [thread?.messages, isGenerating, generationStage, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("w-full", className)}
          data-slot="thread-content-container"
          {...props}
        >
          {children}
        </div>
      </ThreadContentContext.Provider>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

/**
 * Props for the ThreadContentMessages component.
 * Extends standard HTMLDivElement attributes.
 */
export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders the list of messages in the thread.
 * Automatically connects to the context to display messages.
 * @component ThreadContent.Messages
 * @example
 * ```tsx
 * <ThreadContent>
 *   <ThreadContent.Messages />
 * </ThreadContent>
 * ```
 */
const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages: threadMessages, isGenerating, variant } =
    useThreadContentContext();

  const filteredMessages = threadMessages.filter(
    (message) => message.role !== "system" && !message.parentMessageId,
  );

  const fallbackQueryByMessageId = React.useMemo(() => {
    const map = new Map<string, { query: string; description?: string }>();
    let pendingQueryInfo: { query: string; description?: string } | null = null;

    for (let i = 0; i < threadMessages.length; i += 1) {
      const msg = threadMessages[i];
      if (msg.role === "tool") {
        const queryInfo = extractQueryFromToolResult(msg.content);
        if (queryInfo) {
          pendingQueryInfo = queryInfo;
          continue;
        }
      }

      if (msg.role === "assistant" && pendingQueryInfo) {
        const key = getMessageKey(msg);
        map.set(key, pendingQueryInfo);
        pendingQueryInfo = null;
        continue;
      }

      if (msg.role === "user") {
        pendingQueryInfo = null;
      }
    }

    return map;
  }, [threadMessages]);

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {filteredMessages.map((message, index) => {
        const messageKey = getMessageKey(message);
        return (
          <div
            key={messageKey}
            data-slot="thread-content-item"
          >
            <Message
              role={message.role === "assistant" ? "assistant" : "user"}
              message={message}
              variant={variant}
              isLoading={isGenerating && index === filteredMessages.length - 1}
              className={cn(
                "flex w-full",
                message.role === "assistant" ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  message.role === "assistant" ? "w-full" : "max-w-3xl",
                )}
              >
                <ReasoningInfo />
                <MessageImages />
                <MessageContent
                  className={
                    message.role === "assistant"
                      ? "text-foreground font-sans"
                      : "text-foreground bg-container hover:bg-backdrop font-sans"
                  }
                />
                <ToolcallInfo />
                <MessageRenderedComponentArea className="w-full" />
                {message.role === "assistant" &&
                  !message.renderedComponent &&
                  (() => {
                    const fallbackQueryInfo = fallbackQueryByMessageId.get(
                      messageKey,
                    );
                    return fallbackQueryInfo ? (
                      <div className="w-full pt-2 px-2">
                        <QuerySuggestionView
                          query={fallbackQueryInfo.query}
                          title="Suggested Query"
                          description={fallbackQueryInfo.description}
                        />
                      </div>
                    ) : null;
                  })()}
              </div>
            </Message>
          </div>
        );
      })}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };
