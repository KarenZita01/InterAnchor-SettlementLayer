'use client'

import { useState } from 'react'

export default function Liquidity() {
  const [pools] = useState([
    { id: 1, assetA: 'USDC', anchorA: 'Anchor A', assetB: 'USDC', anchorB: 'Anchor C', reserveA: '50,000', reserveB: '48,500', tvl: '$98,500', apr: '12.5%', yourShares: '1,250' },
    { id: 2, assetA: 'USDT', anchorA: 'Anchor B', assetB: 'USDC', anchorB: 'Anchor C', reserveA: '25,000', reserveB: '24,200', tvl: '$49,200', apr: '8.3%', yourShares: '500' },
    { id: 3, assetA: 'USDC', anchorA: 'Anchor A', assetB: 'USDT', anchorB: 'Anchor B', reserveA: '75,000', reserveB: '73,500', tvl: '$148,500', apr: '15.2%', yourShares: '2,000' },
  ])

  const [selectedPool, setSelectedPool] = useState<number | null>(null)
  const [depositAmountA, setDepositAmountA] = useState('')
  const [depositAmountB, setDepositAmountB] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Liquidity Pools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Provide liquidity to earn fees from cross-anchor swaps.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Total Value Locked</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">$296,200</div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Your Total Liquidity</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">$37,500</div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="text-sm font-medium text-gray-500">Your Pending Fees</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">$425.50</div>
            </div>
          </div>
        </div>

        {/* Pools List */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Available Pools</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserve A</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserve B</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APR</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Shares</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pools.map((pool) => (
                  <tr key={pool.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pool.assetA} ({pool.anchorA}) / {pool.assetB} ({pool.anchorB})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.reserveA} {pool.assetA}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.reserveB} {pool.assetB}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.tvl}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{pool.apr}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.yourShares}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedPool(pool.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Liquidity Modal */}
        {selectedPool && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedPool(null)} />
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900">Add Liquidity</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount A</label>
                          <input
                            type="number"
                            value={depositAmountA}
                            onChange={(e) => setDepositAmountA(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount B</label>
                          <input
                            type="number"
                            value={depositAmountB}
                            onChange={(e) => setDepositAmountB(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                    onClick={() => setSelectedPool(null)}
                  >
                    Add Liquidity
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setSelectedPool(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
