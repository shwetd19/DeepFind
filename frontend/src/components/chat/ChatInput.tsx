import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatInput({ onSubmit, disabled, placeholder, autoFocus }: ChatInputProps) {
  const [value, setValue] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = value.trim();
    if (!query || disabled) return;
    setValue("");
    onSubmit(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="relative">
      <Textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Ask anything..."}
        autoFocus={autoFocus}
        rows={2}
        className="min-h-[3.5rem] resize-none pr-14"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="absolute bottom-2.5 right-2.5 rounded-full"
        aria-label="Send"
      >
        {disabled ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
      </Button>
    </form>
  );
}
