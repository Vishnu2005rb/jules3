import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0720] text-white selection:bg-purple-500/30 font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />

        <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            CertiVerify AI
          </div>
          <div className="space-x-8 hidden md:flex items-center">
            <Link href="#features" className="hover:text-purple-400 transition text-gray-300">Features</Link>
            <Link href="/verify" className="hover:text-purple-400 transition text-gray-300">Verify</Link>
            <Link href="/admin/login" className="hover:text-purple-400 transition text-gray-300">Admin</Link>
            <Link href="/submit" className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 rounded-full font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition text-white">
              Get Certified
            </Link>
          </div>
        </nav>

        <main className="container mx-auto px-6 pt-20 pb-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-white">
              Automated Verification for <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Hackathon Heroes</span>
            </h1>
            <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
              Submit your project reviews, get verified by AI, and receive your official hackathon certificates instantly.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link href="/submit" className="bg-white text-purple-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                Submit Review
              </Link>
              <Link href="/verify" className="border border-purple-500/30 bg-purple-500/5 px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-500/10 transition text-white">
                Verify Certificate
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#160b2e]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">Powered by Intelligent Automation</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="AI OCR Verification"
              description="Our system automatically extracts text from your screenshots to verify event participation."
              icon="🤖"
            />
            <FeatureCard
              title="Instant PDF Generation"
              description="Approved submissions trigger instant high-quality PDF certificate generation with unique QR codes."
              icon="📄"
            />
            <FeatureCard
              title="Public Verification"
              description="Every certificate is unique and can be verified by anyone through our public verification portal."
              icon="✅"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-purple-500/10">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-purple-400 mb-2">1,000+</div>
            <div className="text-gray-500">Certificates Issued</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">50+</div>
            <div className="text-gray-500">Hackathon Events</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-pink-400 mb-2">99.9%</div>
            <div className="text-gray-500">Accuracy Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-400 mb-2">&lt; 2m</div>
            <div className="text-gray-500">Average Processing</div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-purple-500/10 text-center text-gray-500">
        <p>© 2024 CertiVerify AI platform. Built for the future of hackathons.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-900/10 to-transparent border border-purple-500/10 hover:border-purple-500/30 transition group">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 inline-block">{icon}</div>
      <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
