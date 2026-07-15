import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="prose prose-neutral max-w-none dark:prose-invert
        prose-p:leading-relaxed
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-a:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:rounded-md prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5
        prose-code:font-normal prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none
        prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:bg-secondary/60 prose-pre:text-foreground
        prose-blockquote:border-l-primary/50 prose-blockquote:font-normal
        prose-li:my-1
        prose-hr:border-border"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: props => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
