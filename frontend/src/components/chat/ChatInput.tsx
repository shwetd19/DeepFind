import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Globe, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** "hero" = large home-page search box, "compact" = follow-up bar. */
  variant?: "hero" | "compact";
}

export function ChatInput({
  onSubmit,
  disabled,
  placeholder,
  autoFocus,
  variant = "compact",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hero = variant === "hero";

  function autogrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = value.trim();
    if (!query || disabled) return;
    setValue("");
    requestAnimationFrame(autogrow);
    onSubmit(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex flex-col rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow]",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25",
        hero && "shadow-lg"
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={event => {
          setValue(event.target.value);
          autogrow();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Ask anything..."}
        autoFocus={autoFocus}
        rows={hero ? 2 : 1}
        className={cn(
          "resize-none border-0 bg-transparent px-4 pt-3.5 shadow-none focus-visible:ring-0 dark:bg-transparent",
          hero ? "min-h-16 text-base md:text-base" : "min-h-11 text-[15px]"
        )}
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <span className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
          <Globe className="size-3.5 text-primary" />
          Web search
        </span>
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          className="size-9 rounded-full"
          aria-label="Send"
        >
          {disabled ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
