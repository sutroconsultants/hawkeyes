"use client";

import * as React from "react";
import { Sparkles, ChevronDown, Trash2, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import type { TamboEditor } from "@/components/tambo/text-editor";
import { useTambo } from "@tambo-ai/react";

// Demo prompts based on East Bay Water Authority data
const DEMO_PROMPTS = [
  "Are there any emergency work orders that I have to deal with?",
  "Any main breaks at Fruitvale Ave?",
  "Show me hydrants that failed inspection in the last year",
  "What are the most common valve exercise issues?",
  "List critical users like hospitals in Oakland",
];

export function TamboChatSidebar({ className }: { className?: string }) {
  const { startNewThread, thread } = useTambo();
  const editorRef = React.useRef<TamboEditor>(null!);

  const hasMessages = thread?.messages && thread.messages.length > 0;

  const handleDemoPrompt = React.useCallback((prompt: string) => {
    if (editorRef.current) {
      editorRef.current.setContent(prompt);
      editorRef.current.focus("end");
    }
  }, []);

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.setContent("");
    }
    startNewThread();
  };

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
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

      {/* Message thread content */}
      <ScrollableMessageContainer className="flex-1 p-4">
        {!hasMessages && (
          <div className="text-muted-foreground text-sm space-y-3">
            <p>
              I can help you query and explore your water utility data.
              Ask me questions like:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Show me all emergency work orders</li>
              <li>What hydrants failed inspection recently?</li>
              <li>Find main breaks on a specific street</li>
            </ul>
          </div>
        )}
        <ThreadContent>
          <ThreadContentMessages />
        </ThreadContent>
      </ScrollableMessageContainer>

      {/* Message input */}
      <div className="border-t p-4 shrink-0">
        <MessageInput inputRef={editorRef}>
          <MessageInputTextarea placeholder="Ask about your data..." />
          <MessageInputToolbar>
            <MessageInputSubmitButton />
          </MessageInputToolbar>
          <MessageInputError />
        </MessageInput>
      </div>
    </div>
  );
}
