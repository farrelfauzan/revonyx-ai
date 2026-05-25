import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { ServicesSection } from '@/components/services-section';
import { AgentSection } from '@/components/agent-section';
import { ModelsSection } from '@/components/models-section';
import { UseCasesSection } from '@/components/use-cases-section';
import { ComparisonSection } from '@/components/comparison-section';
import { PricingSection } from '@/components/pricing-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { CtaSection } from '@/components/cta-section';
import { Footer } from '@/components/footer';

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <AgentSection />
      <ModelsSection />
      <UseCasesSection />
      <ComparisonSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
