import { useState } from 'react';

export default function Settings() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-gray-400 mt-2">Gérez les configurations de votre système</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Général */}
        <div className="border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Paramètres Généraux</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Nom de l'entreprise</label>
              <input type="text" placeholder="NextGen WMS" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded" />
            </div>
            <div>
              <label className="block text-sm mb-2">Fuseau horaire</label>
              <select className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded">
                <option>UTC+0</option>
                <option>UTC+1</option>
                <option>UTC+2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sécurité</h2>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded font-semibold">Changer le mot de passe</button>
            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded">Authentification 2FA</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span>Alertes d'inventaire faible</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span>Rapports hebdomadaires</span>
            </label>
          </div>
        </div>

        {/* Intégrations */}
        <div className="border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Intégrations</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <span>Firebase</span>
              <span className="text-green-500">✓ Connecté</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <span>OpenAI</span>
              <span className="text-green-500">✓ Connecté</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GitHub</span>
              <span className="text-green-500">✓ Connecté</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">À propos</h2>
        <p className="text-gray-400 mb-4">NextGen WMS AI - Système de Gestion Intelligente d'Entrepôt</p>
        <p className="text-sm text-gray-500">Version 2.0 | Build 2025.11.30 | État: Production</p>
      </div>
    </div>
  );
}
