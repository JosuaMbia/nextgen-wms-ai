import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl">
          NextGen WMS AI
        </h1>
        <p className="mb-8 text-xl text-slate-300">
          Revolutionary AI-powered Warehouse Management System
        </p>
        <p className="mb-12 text-slate-400">
          Predictive analytics, intelligent optimization, and geopolitical risk management
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-8 py-3 font-semibold text-white hover:bg-cyan-700 transition-colors"
          >
            Launch Dashboard
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-8 py-3 font-semibold text-slate-200 hover:border-slate-600 transition-colors"
          >
            Learn More
          </a>
        </div>

        {/* Features */}
        <div id="features" className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              title: 'AI Copilot',
              description: 'Natural language interface for warehouse optimization'
            },
            {
              title: 'Digital Twin',
              description: '3D warehouse visualization with real-time tracking'
            },
            {
              title: 'Predictive Analytics',
              description: 'ML-powered demand forecasting and optimization'
            }
          ].map((feature, i) => (
            <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="mb-2 font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
