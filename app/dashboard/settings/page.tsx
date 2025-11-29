'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Globe, Save, Key } from 'lucide-react';

interface Setting {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'input';
  value: boolean | string;
  options?: string[];
}

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: User,
    settings: [
      { id: 'name', label: 'Display Name', description: 'Your display name across the platform', type: 'input' as const, value: 'Admin User' },
      { id: 'email', label: 'Email', description: 'Your primary email address', type: 'input' as const, value: 'admin@nextgen-wms.com' },
      { id: 'timezone', label: 'Timezone', description: 'Your local timezone for scheduling', type: 'select' as const, value: 'UTC-5', options: ['UTC-8', 'UTC-5', 'UTC', 'UTC+1', 'UTC+8'] },
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    settings: [
      { id: 'email_alerts', label: 'Email Alerts', description: 'Receive important alerts via email', type: 'toggle' as const, value: true },
      { id: 'low_stock', label: 'Low Stock Alerts', description: 'Get notified when inventory is low', type: 'toggle' as const, value: true },
      { id: 'order_updates', label: 'Order Updates', description: 'Notifications for order status changes', type: 'toggle' as const, value: false },
    ]
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    settings: [
      { id: 'two_factor', label: 'Two-Factor Auth', description: 'Enable 2FA for extra security', type: 'toggle' as const, value: false },
      { id: 'session_timeout', label: 'Session Timeout', description: 'Auto logout after inactivity', type: 'select' as const, value: '30 min', options: ['15 min', '30 min', '1 hour', '4 hours'] },
    ]
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    settings: [
      { id: 'theme', label: 'Theme', description: 'Choose your preferred theme', type: 'select' as const, value: 'Dark', options: ['Light', 'Dark', 'System'] },
      { id: 'compact_mode', label: 'Compact Mode', description: 'Use compact layout for tables', type: 'toggle' as const, value: false },
    ]
  },
  {
    id: 'api',
    title: 'API Configuration',
    icon: Key,
    settings: [
      { id: 'api_key', label: 'API Key', description: 'Your API key for external integrations', type: 'input' as const, value: 'wms_live_xxxxxxxxxxxx' },
      { id: 'webhook_url', label: 'Webhook URL', description: 'URL for receiving webhooks', type: 'input' as const, value: 'https://api.example.com/webhooks' },
    ]
  }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(settingsSections);
  const [saved, setSaved] = useState(false);

  const handleToggle = (sectionId: string, settingId: string) => {
    setSettings(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting => {
            if (setting.id === settingId && setting.type === 'toggle') {
              return { ...setting, value: !setting.value };
            }
            return setting;
          })
        };
      }
      return section;
    }));
    setSaved(false);
  };

  const handleInputChange = (sectionId: string, settingId: string, newValue: string) => {
    setSettings(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting => {
            if (setting.id === settingId) {
              return { ...setting, value: newValue };
            }
            return setting;
          })
        };
      }
      return section;
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentSection = settings.find(s => s.id === activeSection);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your account and application preferences</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {settings.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {section.title}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          {currentSection && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                <currentSection.icon className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">{currentSection.title}</h2>
              </div>

              <div className="space-y-6">
                {currentSection.settings.map(setting => (
                  <div key={setting.id} className="flex items-center justify-between py-4 border-b border-slate-700/50 last:border-0">
                    <div>
                      <h3 className="text-white font-medium">{setting.label}</h3>
                      <p className="text-sm text-gray-400">{setting.description}</p>
                    </div>

                    {setting.type === 'toggle' && (
                      <button
                        onClick={() => handleToggle(currentSection.id, setting.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          setting.value ? 'bg-cyan-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}

                    {setting.type === 'select' && (
                      <select
                        value={setting.value as string}
                        onChange={(e) => handleInputChange(currentSection.id, setting.id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {setting.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {setting.type === 'input' && (
                      <input
                        type="text"
                        value={setting.value as string}
                        onChange={(e) => handleInputChange(currentSection.id, setting.id, e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-64 focus:outline-none focus:border-cyan-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
