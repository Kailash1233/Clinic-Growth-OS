-- Detailed growth report: keep Google's business status and the separate
-- Lighthouse SEO and accessibility scores (performance was already stored).
ALTER TABLE "clinics" ADD COLUMN "business_status" TEXT;
ALTER TABLE "site_health_checks" ADD COLUMN "seo_score" INTEGER;
ALTER TABLE "site_health_checks" ADD COLUMN "accessibility_score" INTEGER;
