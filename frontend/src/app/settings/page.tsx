'use client'

import { useState } from 'react'

export default function Settings() {
  const [apiKey, setApiKey] = useState('sk_test_abc123xyz789')
  const [webhookUrl, setWebhookUrl] = useState('https://myapp.com/api/stellar-webhook')
  const [autoSettle, setAutoSettle] = useState(true)
  const [maxSlippage, setMaxSlippage] = useState(50)
  const [notificationEmail, setNotificationEmail] = useState('merchant@example.com')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your OmniSettler account and integration settings.
          </p>
        </div>

        <div className="space-y-6">
          {/* API Keys */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">API Keys</h3>
              <p className="mt-1 text-sm text-gray-500">Manage your API keys for SDK integration.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">API Key</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                    <div className="flex rounded-md shadow-sm">
                      <input
                        type="text"
                        value={apiKey}
                        readOnly
                        className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        className="relative -ml-px inline-flex items-center gap-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                      >
                        Copy
                      </button>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Webhook URL</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Settlement Preferences */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Settlement Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">Configure automatic settlement behavior.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Auto-Settle</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setAutoSettle(!autoSettle)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        autoSettle ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autoSettle ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="ml-3 text-sm text-gray-500">
                      Automatically settle incoming payments
                    </span>
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Max Slippage</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={maxSlippage}
                        onChange={(e) => setMaxSlippage(parseInt(e.target.value))}
                        className="w-64"
                      />
                      <span className="ml-3 text-sm text-gray-500">{maxSlippage} bps</span>
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Notification Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* SDK Integration */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">SDK Integration</h3>
              <p className="mt-1 text-sm text-gray-500">Quick integration code for your application.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <div className="px-4 py-5 sm:px-6">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white">
{`import { OmniSettler } from '@omnisettler/sdk';

const settler = new OmniSettler({
  apiKey: '${apiKey}',
  network: 'testnet'
});

// Accept any stablecoin, receive USDC-Anchor C
const settlement = await settler.createSettlement({
  customer: 'GABC...XYZ',
  amount: '1000',
  sourceAsset: 'USDC',
  sourceAnchor: 'Anchor A',
  targetAsset: 'USDC',
  targetAnchor: 'Anchor C'
});`}
                </pre>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
