import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { ServicesSection } from '@/components/services-section';
import { HowItWorksSection } from '@/components/how-it-works-section';
import { Footer } from '@/components/footer';

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <Footer />
    </main>
  );
}
