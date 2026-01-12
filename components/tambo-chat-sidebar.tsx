"use client";

import * as React from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, ChevronDown, Trash2, MessageSquare } from "lucide-react";
import {
  useTamboThread,
  useTamboThreadInput,
  TamboThreadMessage,
} from "@tambo-ai/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTamboConfig } from "@/components/providers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  extractQueryFromToolResult,
  parseQuerySuggestion,
  QuerySuggestionInline,
} from "@/components/tambo/query-suggestion-inline";

// Demo prompts based on EBMUD water utility data
const DEMO_PROMPTS = [
  "Are there any emergency work orders that I have to deal with?",
  "Any main breaks at Fruitvale Ave?",
  "Show me hydrants that failed inspection in the last year",
  "What are the most common valve exercise issues?",
  "List critical users like hospitals in Oakland",
];

function getMessageText(content: TamboThreadMessage["content"]): string {
  if (!content) return "";

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }

  return "";
}

function isToolResultMessage(message: TamboThreadMessage): boolean {
  // Filter out tool/function messages
  if (message.role === "tool" || message.role === "function") {
    return true;
  }

  // Check if content is an array with tool_use or tool_result blocks
  if (Array.isArray(message.content)) {
    const hasToolBlocks = message.content.some(
      (part: any) => part.type === "tool_use" || part.type === "tool_result"
    );
    if (hasToolBlocks) {
      return true;
    }
  }

  // Check if content looks like raw JSON tool results
  const text = getMessageText(message.content);
  if (!text) return false;

  const trimmed = text.trim();
  if (trimmed.startsWith("[{") || trimmed.startsWith("{\"")) {
    try {
      JSON.parse(trimmed);
      return true; // It's valid JSON, likely a tool result
    } catch {
      return false;
    }
  }

  return false;
}

function MessageBubble({
  message,
  fallbackQuery,
}: {
  message: TamboThreadMessage;
  fallbackQuery?: string;
}) {
  const isUser = message.role === "user";
  const hasComponent = message.renderedComponent != null;
  const componentInfo = (message as {
    component?: { componentName?: string; props?: Record<string, unknown> };
  }).component;
  const componentName = componentInfo?.componentName;
  const componentProps = componentInfo?.props;
  const componentData = componentProps?.data;
  const rawText = getMessageText(message.content);
  const { cleanText, query, title } = rawText
    ? parseQuerySuggestion(rawText)
    : { cleanText: "", query: undefined, title: undefined };
  const text = cleanText;
  const inlineQuery = query?.trim() || fallbackQuery?.trim() || "";
  const hasQueryComponent = componentName === "QuerySuggestion";
  const hasInlineQuery = Boolean(inlineQuery) && !hasQueryComponent;
  const isEmptyDataTable =
    componentName === "DataTable" &&
    (!Array.isArray(componentData) || componentData.length === 0);
  const shouldRenderComponent = hasComponent && !isEmptyDataTable;
  const hasRenderable = shouldRenderComponent || hasInlineQuery;

  // Don't render empty messages
  if (!text && !hasRenderable) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[85%] overflow-hidden",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
          hasRenderable && "max-w-full"
        )}
      >
        {text && (
          <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {text}
          </p>
        )}
        {shouldRenderComponent && (
          <div className="w-full mt-2 overflow-x-auto">
            {message.renderedComponent}
          </div>
        )}
        {hasInlineQuery && (
          <QuerySuggestionInline query={inlineQuery} title={title} />
        )}
      </div>
    </div>
  );
}

function TamboChatContent() {
  const { thread, isIdle, resetThread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleDemoPrompt = (prompt: string) => {
    setValue(prompt);
  };

  const handleClear = () => {
    setValue("");
    resetThread?.();
  };

  const allMessages = thread?.messages || [];

  // Filter out tool result messages and deduplicate
  const messages = React.useMemo(() => {
    const filtered = allMessages.filter((msg) => !isToolResultMessage(msg));

    // Deduplicate messages with similar text content
    const seen = new Set<string>();
    return filtered.filter((msg) => {
      const text = getMessageText(msg.content);
      const key = `${msg.role}-${text.slice(0, 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allMessages]);

  const inlineQueryByMessageId = React.useMemo(() => {
    const map = new Map<string, string>();
    let pendingQuery: string | null = null;

    for (let i = 0; i < allMessages.length; i += 1) {
      const msg = allMessages[i];
      if (msg.role === "tool" || msg.role === "function") {
        const query = extractQueryFromToolResult(msg.content);
        if (query) {
          pendingQuery = query;
          continue;
        }
      }

      if (msg.role === "assistant" && pendingQuery) {
        const key = msg.id ?? `index-${i}`;
        map.set(key, pendingQuery);
        pendingQuery = null;
        continue;
      }

      if (msg.role === "user") {
        pendingQuery = null;
      }
    }

    return map;
  }, [allMessages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Header with dropdown */}
      <div className="flex items-center justify-between px-3 py-3 border-b h-14 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            {DEMO_PROMPTS.map((prompt, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleDemoPrompt(prompt)}
                className="cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{prompt}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClear}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4 min-w-0">
          {!isIdle ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Ask me anything about your ClickHouse data!
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                I can help you write queries, understand your schema, and
                analyze results.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const key = message.id ?? `index-${index}`;
                const fallbackQuery = inlineQueryByMessageId.get(key);
                return (
                  <MessageBubble
                    key={key}
                    message={message}
                    fallbackQuery={fallbackQuery}
                  />
                );
              })}
              {isPending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            placeholder="Ask about your data..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
            disabled={isPending}
          />
          <Button
            type="submit"
            disabled={!value.trim() || isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </form>
      </div>
    </>
  );
}

function TamboNotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-foreground mb-2">
        AI Assistant Not Configured
      </p>
      <p className="text-xs text-muted-foreground">
        Set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_TAMBO_API_KEY</code> in your .env.local file to enable AI features.
      </p>
    </div>
  );
}

export function TamboChatSidebar({ className }: { className?: string }) {
  const { isConfigured } = useTamboConfig();

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {isConfigured ? (
        <TamboChatContent />
      ) : (
        <>
          {/* Header for unconfigured state */}
          <div className="flex items-center gap-2 px-3 py-3 border-b h-14 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <div className="flex-1">
            <TamboNotConfigured />
          </div>
        </>
      )}
    </div>
  );
}
