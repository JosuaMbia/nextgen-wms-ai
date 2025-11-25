import Link from 'next/link';
import { Home, BarChart3, Brain, Box, Settings } from 'lucide-react';  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Copilot', href: '/dashboard/ai-copilot', icon: Brain },
  { name: 'Digital Twin', href: '/dashboard/digital-twin', icon: Box }, { name: 'Settings', href: '/dashboard/settings', icon: Settings },];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-8 font-bold text-white text-lg">
        NextGen WMS
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
