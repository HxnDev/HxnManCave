import { ArrowRight, Blocks, BookOpen, Gamepad2, Gift, SprayCan } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const categoryIcons = [
  { icon: Blocks, label: "LEGO" },
  { icon: BookOpen, label: "Books" },
  { icon: Gamepad2, label: "Games" },
  { icon: SprayCan, label: "Perfumes" },
  { icon: Gift, label: "Souvenirs" },
];

export function LandingPage() {
  return (
    <div className="grain vault-gradient flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Button asChild variant="outline">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mb-6 font-mono text-xs tracking-[0.35em] text-primary uppercase"
        >
          vault.hxndev.com
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl"
        >
          Everything you own,{" "}
          <span className="text-glow text-primary italic">finally</span> in one
          place.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-balance text-muted-foreground"
        >
          ManCave turns scattered spreadsheets and memory into a living vault of
          your collections — LEGO sets, books, games, perfumes and more, with
          photos, values and instant search.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="group h-12 px-7 text-base">
            <Link to="/login">
              Enter the vault
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.08, delayChildren: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          {categoryIcons.map(({ icon: Icon, label }) => (
            <motion.span
              key={label}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
            >
              <Icon className="size-4 text-primary" />
              {label}
            </motion.span>
          ))}
        </motion.div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-center font-mono text-xs text-muted-foreground/60">
        built by hxndev — part of the hxndev.com ecosystem
      </footer>
    </div>
  );
}
