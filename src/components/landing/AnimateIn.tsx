import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "fade";

const hiddenClasses: Record<AnimationVariant, string> = {
  "fade-up": "translate-y-8 opacity-0",
  "fade-down": "-translate-y-8 opacity-0",
  "fade-left": "-translate-x-8 opacity-0",
  "fade-right": "translate-x-8 opacity-0",
  scale: "scale-95 opacity-0",
  fade: "opacity-0",
};

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const AnimateIn = ({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  once = true,
}: AnimateInProps) => {
  const { ref, isInView } = useInView({ once });

  const style: CSSProperties = {
    transitionDelay: `${delay}ms`,
    transitionDuration: `${duration}ms`,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        isInView ? "translate-x-0 translate-y-0 scale-100 opacity-100" : hiddenClasses[variant],
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};
