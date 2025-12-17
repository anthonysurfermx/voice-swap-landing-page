import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { VideoSection } from "@/components/video-section"
import { HowItWorks } from "@/components/how-it-works"
import { FeaturesGrid } from "@/components/features-grid"
import { TechStack } from "@/components/tech-stack"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <VideoSection />
        <HowItWorks />
        <FeaturesGrid />
        <TechStack />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
