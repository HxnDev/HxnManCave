import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  duration = 0.9,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className="tabular-nums">{format(display)}</span>;
}
