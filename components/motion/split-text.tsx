import type { CSSProperties, ElementType } from "react";

type SplitTextProps = {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
};

type WordStyle = CSSProperties & {
  "--split-delay": string;
  "--split-duration": string;
};

export function SplitText({
  text,
  tag = "h1",
  className = "",
  delay = 0.055,
  duration = 0.75,
  style,
}: SplitTextProps) {
  const Tag = tag as ElementType;
  const words = text.trim().split(/\s+/);

  return (
    <Tag className={`split-text ${className}`} style={style}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span
            className="split-word"
            style={{
              "--split-delay": `${Math.min(index * delay, 0.65)}s`,
              "--split-duration": `${duration}s`,
            } as WordStyle}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
