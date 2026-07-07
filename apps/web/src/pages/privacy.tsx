import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "July 7, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="font-display font-bold">ManCave</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft /> Back to home
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          ManCave is a personal collection manager available as a web app
          (vault.hxndev.com) and an Android app. This policy explains what data
          ManCave collects, how it is used, and the choices you have. The short
          version: your collection is yours, it is private to your account, and
          it is never sold or shared.
        </p>

        <Section title="Data we collect">
          <p>When you create an account and use ManCave, we store:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Account information</strong> —
              your email address, display name, and (if you sign in with Google)
              your Google profile picture.
            </li>
            <li>
              <strong className="text-foreground">Collection data</strong> — the
              items, categories, tags, notes, and details you add to your vault.
            </li>
            <li>
              <strong className="text-foreground">Photos</strong> — images you
              attach to items, either taken with the camera or chosen from your
              photo library. The app only accesses photos you explicitly select.
            </li>
          </ul>
          <p>
            ManCave does not collect location data, contacts, advertising
            identifiers, or analytics profiles, and it contains no ads.
          </p>
        </Section>

        <Section title="How your data is used">
          <p>
            Your data is used for one purpose: showing you your own collection
            and keeping it in sync between the web and Android apps. It is never
            sold, shared with third parties, or used for advertising.
          </p>
        </Section>

        <Section title="Where your data lives">
          <p>
            Data is stored with Supabase, our database and authentication
            provider, and is encrypted in transit (HTTPS/TLS). Access is
            protected by row-level security: every account can only read and
            write its own data. Photos are stored in a private bucket and served
            through short-lived signed URLs.
          </p>
        </Section>

        <Section title="Sign-in">
          <p>
            You can sign in with email and password or with Google. Google
            sign-in shares only your basic profile (email, name, avatar) with
            ManCave; we never see your Google password and receive no access to
            your other Google data.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-1 pl-5">
            <li>You can edit or delete any item, photo, or category at any time.</li>
            <li>
              You can request full deletion of your account and all associated
              data by emailing the address below. Deletion is permanent and
              completed within 30 days.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            ManCave is not directed at children under 13 and does not knowingly
            collect data from them.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes, the date at the top of this page will be
            updated. Material changes will be announced in the app.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or deletion requests:{" "}
            <a
              href="mailto:contact@hxndev.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              contact@hxndev.com
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
}
