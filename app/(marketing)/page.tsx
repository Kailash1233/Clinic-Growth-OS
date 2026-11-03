import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import IntroStatement from "@/components/landing/IntroStatement";
import HubPanel from "@/components/landing/HubPanel";
import ReputationShowcase from "@/components/landing/ReputationShowcase";
import AlternatingRows from "@/components/landing/AlternatingRows";
import TrustBanner from "@/components/landing/TrustBanner";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <IntroStatement />
      <HubPanel />
      <ReputationShowcase />
      <AlternatingRows />
      <TrustBanner />
      <ComparisonTable />
      <FAQ />
      <Footer />
    </>
  );
}
