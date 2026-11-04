import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveClinicByHost, siteBasePath } from "@/lib/resolveSiteByHost";
import { siteBaseUrl } from "@/lib/siteUrl";
import ContactForm from "@/components/site/ContactForm";
import { CallButton, WhatsAppButton } from "@/components/site/LeadButtons";
import { BlogArticle, BlogIndex, jsonLdScript } from "@/components/site/BlogViews";

type Params = { params: { site?: string[] } };

type Route = { kind: "home" } | { kind: "blog-index" } | { kind: "blog-post"; slug: string };

function parseRoute(segments: string[] | undefined): Route | null {
  const parts = segments ?? [];
  if (parts.length === 0) return { kind: "home" };
  if (parts[0] !== "blog") return null;
  if (parts.length === 1) return { kind: "blog-index" };
  if (parts.length === 2) return { kind: "blog-post", slug: parts[1] };
  return null;
}

/** Only approved (published) posts are ever readable on the public site. */
function publishedPosts(clinicId: string): Promise<BlogPost[]> {
  return prisma.blogPost.findMany({
    where: { clinicId, status: "published" },
    orderBy: { publishedAt: "desc" },
  });
}

function publishedPost(clinicId: string, slug: string): Promise<BlogPost | null> {
  return prisma.blogPost.findFirst({ where: { clinicId, slug, status: "published" } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const site = await resolveClinicByHost();
  const route = parseRoute(params.site);
  if (!site || !route) return {};
  const clinic = site.clinic;
  const base = siteBaseUrl(site);

  if (route.kind === "blog-index") {
    return { title: `Blog | ${clinic.name}`, alternates: base ? { canonical: `${base}/blog` } : undefined };
  }
  if (route.kind === "blog-post") {
    const post = await publishedPost(clinic.id, route.slug);
    if (!post) return {};
    return {
      title: post.title,
      description: post.metaDescription,
      alternates: base ? { canonical: `${base}/blog/${post.slug}` } : undefined,
      openGraph: { title: post.title, description: post.metaDescription, type: "article" },
    };
  }

  const seoMeta = clinic.siteContent?.seoMeta as { title?: string; description?: string } | undefined;
  return {
    title: seoMeta?.title ?? clinic.name ?? "Clinic",
    description: seoMeta?.description ?? undefined,
  };
}

export default async function ClinicSitePage({ params }: Params) {
  const site = await resolveClinicByHost();
  const route = parseRoute(params.site);
  if (!site || !route) notFound();

  const clinic = site.clinic;
  const basePath = siteBasePath();

  if (route.kind === "blog-index") {
    return <BlogIndex clinicName={clinic.name} posts={await publishedPosts(clinic.id)} basePath={basePath} />;
  }
  if (route.kind === "blog-post") {
    const post = await publishedPost(clinic.id, route.slug);
    if (!post) notFound();
    const base = siteBaseUrl(site);
    return <BlogArticle clinicName={clinic.name} post={post} canonicalUrl={base ? `${base}/blog/${post.slug}` : null} basePath={basePath} />;
  }

  const content = clinic.siteContent;
  if (!content) notFound();

  const photos = Array.isArray(clinic.photos) ? (clinic.photos as string[]) : [];
  const services = Array.isArray(content.services) ? (content.services as string[]) : [];
  const hours = clinic.hours as { weekdayDescriptions?: string[] } | null;
  const latestPosts = (await publishedPosts(clinic.id)).slice(0, 3);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(content.jsonLd) }} />

      <section className="border-b border-slate-100 bg-brand-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700">{clinic.category}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{content.headline}</h1>
          <p className="mt-3 text-slate-600">{clinic.address}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {clinic.phone && <CallButton clinicId={clinic.id} phone={clinic.phone} />}
            {clinic.phone && <WhatsAppButton clinicId={clinic.id} phone={clinic.phone} />}
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-6 py-10 sm:grid-cols-3">
          {photos.slice(0, 6).map((url, i) => (
            <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
              <Image src={url} alt={`${clinic.name} photo ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </section>
      )}

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">About {clinic.name}</h2>
        <div className="mt-4 space-y-4 text-slate-700">
          {content.aboutCopy.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {services.length > 0 && (
        <section className="bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Services</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s, i) => (
                <li key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {hours?.weekdayDescriptions && (
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="text-xl font-semibold text-slate-900">Hours</h2>
          <ul className="mt-4 space-y-1 text-slate-700">
            {hours.weekdayDescriptions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Latest articles</h2>
            <Link href={`${basePath}/blog`} className="text-sm text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {latestPosts.map((p) => (
              <li key={p.id}>
                <Link href={`${basePath}/blog/${p.slug}`} className="font-medium text-slate-900 hover:text-brand-700">
                  {p.title}
                </Link>
                <p className="text-sm text-slate-600">{p.metaDescription}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-md">
          <h2 className="text-xl font-semibold text-slate-900">Get in touch</h2>
          <div className="mt-4">
            <ContactForm clinicId={clinic.id} />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        {clinic.name} · {clinic.address}
      </footer>
    </main>
  );
}
