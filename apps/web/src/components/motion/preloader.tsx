import { Vault } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SESSION_KEY = "mancave-preloader-shown";

/**
 * Full-screen branded loader, shown once per browser session.
 * Mirrors the hxndev.com "boot sequence" personality.
 */
export function Preloader() {
  const [visible, setVisible] = useState(
    () => !sessionStorage.getItem(SESSION_KEY),
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const start = performance.now();
    const duration = 1400;
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out so the bar sprints early and settles at the end
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(SESSION_KEY, "1");
        setTimeout(() => setVisible(false), 350);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="vault-gradient fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glow-primary grid size-16 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30"
          >
            <Vault className="size-8 text-primary" />
          </motion.span>

          <div className="w-56">
            <div className="mb-3 flex items-baseline justify-between font-mono text-[11px] tracking-[0.3em] uppercase">
              <span className="text-muted-foreground">unlocking the vault</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="h-px w-full overflow-hidden bg-border">
              <div
                className="h-full bg-primary transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
