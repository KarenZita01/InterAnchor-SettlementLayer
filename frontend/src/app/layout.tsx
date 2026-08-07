import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OmniSettler - Inter-Anchor Settlement Layer',
  description: 'Automated settlement layer for Stellar anchors. Accept any stablecoin, receive your preferred asset.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl font-bold text-stellar-cyan">OmniSettler</span>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <a href="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">Dashboard</a>
                    <a href="/settlements" className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Settlements</a>
                    <a href="/liquidity" className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Liquidity</a>
                    <a href="/settings" className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Settings</a>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6">
                  <button
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Connect Wallet</span>
                    <span className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                      Connect Wallet
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
