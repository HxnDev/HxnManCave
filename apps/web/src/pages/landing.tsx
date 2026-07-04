import {
  ArrowRight,
  Blocks,
  BookOpen,
  Camera,
  ChartPie,
  Gamepad2,
  Gem,
  Gift,
  KeyRound,
  Library,
  ListChecks,
  Search,
  SprayCan,
  Tags,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

/* Decorative mini bookcase: colored "items" standing on wooden shelves */
function HeroBookcase() {
  const shelves: { color: string; heights: number[] }[] = [
    { color: "oklch(0.63 0.22 25)", heights: [48, 64, 40, 56, 44] },
    { color: "oklch(0.7 0.12 195)", heights: [56, 40, 62, 46, 52] },
    { color: "oklch(0.68 0.15 45)", heights: [42, 58, 48, 64, 38] },
  ];
  const itemColors = [
    "oklch(0.63 0.22 25)",
    "oklch(0.65 0.17 300)",
    "oklch(0.7 0.12 195)",
    "oklch(0.68 0.15 45)",
    "oklch(0.72 0.15 162)",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
      className="wood-frame mx-auto w-full max-w-md rounded-2xl p-3"
      aria-hidden
    >
      <div className="bookcase-back overflow-hidden rounded-lg">
        {shelves.map((shelf, shelfIndex) => (
          <div key={shelfIndex}>
            <div className="compartment flex items-end gap-2.5 px-4 pt-5">
              {shelf.heights.map((height, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.8 + shelfIndex * 0.15 + i * 0.06,
                  }}
                  key={i}
                  className="flex-1 rounded-t-sm rounded-b-[2px]"
                  style={{
                    height,
                    background: `linear-gradient(180deg, color-mix(in oklch, ${itemColors[(shelfIndex + i) % itemColors.length]} 85%, white), ${itemColors[(shelfIndex + i) % itemColors.length]})`,
                    boxShadow: "0 6px 10px -4px rgba(0,0,0,0.6)",
                  }}
                />
              ))}
            </div>
            <div className="shelf-plank h-3 w-full" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SectionKicker({ number, children }: { number: string; children: ReactNode }) {
  return (
    <p className="mb-3 font-mono text-xs tracking-[0.3em] text-primary uppercase">
      {number} — {children}
    </p>
  );
}

const features = [
  {
    icon: Library,
    title: "Real shelves",
    text: "Your collections rendered as wooden display shelves — not another boring table.",
  },
  {
    icon: ListChecks,
    title: "Fields that fit",
    text: "LEGO sets get piece counts, perfumes get remaining %, games get platforms. Every category knows its own details.",
  },
  {
    icon: Camera,
    title: "Photo-first",
    text: "Multiple photos per item, compressed automatically, stored privately.",
  },
  {
    icon: Search,
    title: "Instant search",
    text: "Find anything across names, brands, series and notes in milliseconds.",
  },
  {
    icon: Tags,
    title: "Tags & filters",
    text: "Harry Potter, F1, Limited Edition — slice your vault any way you like.",
  },
  {
    icon: Gem,
    title: "Value tracking",
    text: "What you paid, what it's worth now, and what the whole vault adds up to.",
  },
];

const steps = [
  {
    number: "01",
    title: "Claim your vault",
    text: "Sign in with Google or email. Eleven collector-ready shelves are waiting, and you can add your own.",
  },
  {
    number: "02",
    title: "Fill the shelves",
    text: "Photograph each piece, note where you got it and what it cost. The right fields appear for every category.",
  },
  {
    number: "03",
    title: "Know what you own",
    text: "Search everything, filter by anything, watch your collection's value and stats grow.",
  },
];

const categoryChips = [
  { icon: Blocks, label: "LEGO Sets" },
  { icon: BookOpen, label: "Books" },
  { icon: Gamepad2, label: "Games" },
  { icon: SprayCan, label: "Perfumes" },
  { icon: Gift, label: "Souvenirs" },
  { icon: KeyRound, label: "Keychains" },
  { icon: ChartPie, label: "…and yours" },
];

export function LandingPage() {
  const { session } = useAuth();
  const ctaTarget = session ? "/app" : "/login";

  return (
    <div className="grain vault-gradient min-h-svh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        {session ? (
          <Button asChild>
            <Link to="/app">
              Open my vault <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-16 pb-24 text-center sm:pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl"
        >
          Everything you own,{" "}
          <span className="text-glow text-primary italic">finally</span> in one
          place.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-balance text-muted-foreground"
        >
          ManCave turns scattered spreadsheets and memory into a living vault of
          your collections — with real shelves, photos, values and instant
          search.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 mb-16"
        >
          <Button asChild size="lg" className="group h-12 px-7 text-base">
            <Link to={ctaTarget}>
              Enter the vault
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        <HeroBookcase />
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <SectionKicker number="01">what's inside</SectionKicker>
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A collection manager that treats your stuff like it matters.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition-colors hover:border-primary/30"
            >
              <span className="mb-4 grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <feature.icon className="size-5" />
              </span>
              <h3 className="font-display font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <SectionKicker number="02">how it works</SectionKicker>
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From shoebox chaos to curated vault.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <p className="font-display text-5xl font-bold text-primary/25">
                {step.number}
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories + CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 pb-28 text-center">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <SectionKicker number="03">built for collectors</SectionKicker>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Whatever you collect, it has a shelf here.
          </h2>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ staggerChildren: 0.06 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {categoryChips.map(({ icon: Icon, label }) => (
            <motion.span
              key={label}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
            >
              <Icon className="size-4 text-primary" />
              {label}
            </motion.span>
          ))}
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12">
          <Button asChild size="lg" className="group h-12 px-7 text-base">
            <Link to={ctaTarget}>
              {session ? "Back to your vault" : "Start your vault — it's free"}
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="mx-auto w-full max-w-6xl border-t border-border px-6 py-8 text-center font-mono text-xs text-muted-foreground/60">
        built by hxndev — part of the hxndev.com ecosystem
      </footer>
    </div>
  );
}
