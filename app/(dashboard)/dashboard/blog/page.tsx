import { NoClinic, PageHeader } from "@/components/app/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asFaq, asSections, hasActiveSubscription } from "@/lib/blog";
import { siteBaseUrl } from "@/lib/siteUrl";
import BlogApprovalList from "@/components/BlogApprovalList";

export default async function BlogPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const [posts, settings, subscribed] = await Promise.all([
    prisma.blogPost.findMany({ where: { clinicId: user.clinicId }, orderBy: { generatedAt: "desc" } }),
    prisma.siteSettings.findUnique({ where: { clinicId: user.clinicId } }),
    hasActiveSubscription(user.clinicId),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Blog"
        description={
          <>
            Each week we research what people near you search on Google and draft an SEO post answering it.{" "}
            <strong className="font-semibold text-slate-700">Nothing is published until you approve it.</strong>
          </>
        }
      />
      {settings && !settings.blogAutoGenerate && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Weekly drafts are turned off in Settings. You can still generate one here.
        </p>
      )}
      <div className="mt-4">
        <BlogApprovalList
          canGenerate={subscribed}
          liveBaseUrl={siteBaseUrl(settings)}
          posts={posts.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            metaDescription: p.metaDescription,
            targetKeyword: p.targetKeyword,
            sourceQuestions: Array.isArray(p.sourceQuestions) ? (p.sourceQuestions as string[]) : [],
            keywordSource: p.keywordSource,
            intro: p.intro,
            sections: asSections(p.sections),
            faq: asFaq(p.faq),
            status: p.status,
            rejectionNote: p.rejectionNote,
            generatedAt: p.generatedAt.toISOString(),
            publishedAt: p.publishedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
