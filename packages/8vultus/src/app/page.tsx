import { useBrand } from '@/shared/contexts/BrandContext'
import { BRAND_IDS } from '@/shared/types/brand'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center py-20">
        <h1 className="text-6xl font-bold text-primary mb-6 eightvultus-pulse">
          8Vultus
        </h1>
        <p className="text-2xl text-muted mb-8 max-w-3xl mx-auto">
          Elite consciousness mapping and advanced cognitive systems for expert practitioners
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-secondary transition-colors">
            Explore Frameworks
          </button>
          <button className="border border-primary text-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors">
            Learn More
          </button>
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Advanced Consciousness Tools</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 border border-border rounded-lg">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-2">Consciousness Mapping</h3>
            <p className="text-muted">Advanced frameworks for mapping consciousness states and patterns</p>
          </div>
          <div className="text-center p-6 border border-border rounded-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">System Architectures</h3>
            <p className="text-muted">Complex cognitive system design and implementation</p>
          </div>
          <div className="text-center p-6 border border-border rounded-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Expert Tier Access</h3>
            <p className="text-muted">Elite content for master practitioners and researchers</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/10 rounded-lg">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Master Consciousness?</h2>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Join the elite community of consciousness researchers and system architects
          </p>
          <button className="bg-primary text-white px-8 py-4 rounded-lg text-lg hover:bg-secondary transition-colors">
            Start Your Journey
          </button>
        </div>
      </section>
    </div>
  )
}
