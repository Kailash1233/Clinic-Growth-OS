import { NoClinic, PageHeader } from "@/components/app/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReviewInbox from "@/components/ReviewInbox";

export default async function ReviewsPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const [clinic, reviews] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: user.clinicId } }),
    prisma.review.findMany({ where: { clinicId: user.clinicId }, orderBy: { reviewTime: "desc" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Reviews"
        description="Your recent Google reviews with an AI-drafted reply for each. Edit the reply, then post it on Google yourself — nothing is posted automatically."
      />
      <div>
        <ReviewInbox
          hasGooglePlace={!!clinic?.googlePlaceId}
          initialReviews={reviews.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            reviewTime: r.reviewTime.toISOString(),
            suggestedReply: r.suggestedReply,
          }))}
        />
      </div>
    </div>
  );
}
