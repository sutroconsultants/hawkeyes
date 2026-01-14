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
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

// Demo prompts based on EBMUD water utility data
const DEMO_PROMPTS = [
  "Are there any emergency work orders that I have to deal with?",
  "Any main breaks at Fruitvale Ave?",
  "Show me hydrants that failed inspection in the last year",
  "What are the most common valve exercise issues?",
  "List critical users like hospitals in Oakland",
];

export function TamboChatSidebar({ className }: { className?: string }) {
  const { startNewThread } = useTambo();
  const { setValue } = useTamboThreadInput();

  const handleDemoPrompt = React.useCallback((prompt: string) => {
    setValue(prompt);
  }, [setValue]);

  const handleClear = () => {
    setValue("");
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
        <ThreadContent>
          <ThreadContentMessages />
        </ThreadContent>
      </ScrollableMessageContainer>

      {/* Message input */}
      <div className="border-t p-4 shrink-0">
        <MessageInput>
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
