import { memo, useMemo } from "react";
import { motion } from "framer-motion";

import { panelTransition } from "./motion-presets";

export interface ProgressiveStreamTextProps {
  readonly text: string;
  readonly className?: string;
  readonly testId?: string;
}

/**
 * Progressive streaming text with subtle fade-in per chunk (Phase 92).
 */
export const ProgressiveStreamText = memo(function ProgressiveStreamText({
  text,
  className,
  testId,
}: ProgressiveStreamTextProps) {
  const words = useMemo(
    () => text.split(/(\s+)/).filter((part) => part.length > 0),
    [text],
  );

  if (!text) {
    return null;
  }

  return (
    <p className={className} data-testid={testId}>
      {words.map((word, index) => (
        <motion.span
          key={`${index}-${word}`}
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ ...panelTransition, delay: Math.min(index * 0.015, 0.45) }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
});
