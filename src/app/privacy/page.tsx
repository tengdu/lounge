import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy policy | Lounge",
  description: "What Lounge collects, what it shows publicly, and how to delete it.",
};

const UPDATED = "November 26, 2026";
const CONTACT = "tengdudeveloper@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-title mb-3 text-[20px] text-ink">{title}</h2>
      <div className="space-y-3 text-[16px] leading-[1.65] text-ink-secondary [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/72 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-3xl items-center px-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            All lounges
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-12 pb-24">
        <h1 className="text-display text-[40px] text-ink">Privacy policy</h1>
        <p className="mt-3 text-[14px] text-ink-tertiary">Last updated {UPDATED}</p>

        <p className="mt-8 text-[17px] leading-[1.6] text-ink-secondary">
          Lounge is a free guide to airport lounges in the United States. You can use all of it
          without an account. Signing in is only needed to rate a lounge, write a review or share
          photos. We don&apos;t sell data, show ads, or share anything with advertisers.
        </p>

        <Section title="When you just browse">
          <ul>
            <li>
              <strong>Analytics.</strong>{" "}We use Google Analytics to count visits and see which
              pages are useful. It records things like the pages you view, your browser and device,
              and your approximate location from your IP address, and it sets cookies to do so.
              See{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                how Google uses this data
              </a>
              .
            </li>
            <li>
              <strong>Maps.</strong>{" "}Map tiles load from OpenFreeMap and OpenLevelUp, which see your
              IP address like any website you load images from.
            </li>
            <li>
              <strong>&ldquo;Use my location&rdquo;.</strong>{" "}If you allow it, your position is used
              in your browser to draw you on the airport map. It is never sent to us.
            </li>
            <li>
              <strong>Your wallet.</strong>{" "}The cards, memberships and status you tick under
              &ldquo;What do you carry?&rdquo; are saved in your browser only and never uploaded.
            </li>
          </ul>
        </Section>

        <Section title="When you sign in with Google">
          <p>
            Sign-in is handled by Supabase, our database provider. From your Google account we
            receive only your <strong>name</strong>, <strong>email address</strong>{" "}and{" "}
            <strong>profile picture</strong>{" "}— the basic &ldquo;email&rdquo; and
            &ldquo;profile&rdquo; permissions. We never see your Google password and cannot access
            your Gmail, contacts, Drive or anything else.
          </p>
          <ul>
            <li>
              <strong>Shown publicly</strong>{" "}next to your reviews: your first name and the first
              letter of your last name (for example &ldquo;Alex M.&rdquo;) and your profile
              picture.
            </li>
            <li>
              <strong>Never shown</strong>: your email address. We use it only to contact you about
              your account if we need to.
            </li>
          </ul>
          <p>
            Lounge&apos;s use of information received from Google APIs adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </Section>

        <Section title="What you post">
          <ul>
            <li>
              <strong>Ratings and reviews</strong>, including the visit date if you give one, are
              public as soon as you post them.
            </li>
            <li>
              <strong>Photos</strong>{" "}are shrunk in your browser before upload, which also removes
              hidden metadata such as the GPS location your phone stores in each picture. We check
              each photo before it is shown. Until then only you can see it.
            </li>
            <li>
              Please don&apos;t post other travellers&apos; faces or personal details. We remove
              content that does.
            </li>
          </ul>
        </Section>

        <Section title="Where it's stored">
          <p>
            Accounts, reviews and photos are stored with{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              Supabase
            </a>{" "}
            in the United States. The website itself is served by GitHub Pages. We keep your data
            until you delete it or ask us to.
          </p>
        </Section>

        <Section title="Deleting your data">
          <ul>
            <li>
              You can <strong>edit or delete your review</strong>{" "}and <strong>delete your photos</strong>{" "}
              yourself at any time from the lounge page.
            </li>
            <li>
              To <strong>delete your account</strong>{" "}and everything attached to it, email{" "}
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you signed in with. We
              delete it within 30 days.
            </li>
            <li>
              You can also remove Lounge&apos;s access from your{" "}
              <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">
                Google account settings
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes, we&apos;ll update the date at the top of this page. Questions?
            Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </Section>
      </main>
    </>
  );
}
