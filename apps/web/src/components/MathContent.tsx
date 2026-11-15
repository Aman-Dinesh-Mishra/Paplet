import katex from "katex";
import "katex/dist/katex.min.css";

type MathContentProps = {
  content: string;
};

const mathPattern =
  /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+\$)/g;

export default function MathContent({ content }: MathContentProps) {
  const parts = content.split(mathPattern);

  return (
    <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {parts.map((part, index) => {
        const isMath =
          /^\$\$[\s\S]+\$\$$/.test(part) ||
          /^\\\[[\s\S]+\\\]$/.test(part) ||
          /^\\\([\s\S]+\\\)$/.test(part) ||
          /^\$[^$\n]+\$$/.test(part);

        if (!isMath) {
          return <span key={index}>{part}</span>;
        }

        const displayMode = part.startsWith("$$") || part.startsWith("\\[");

        const expression = displayMode
          ? part.slice(2, -2)
          : part.startsWith("\\(")
            ? part.slice(2, -2)
            : part.slice(1, -1);

        const html = katex.renderToString(expression, {
          displayMode,
          throwOnError: false,
          trust: false,
        });

        return displayMode ? (
          <div
            key={index}
            style={{ overflowX: "auto", padding: "8px 0" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}
