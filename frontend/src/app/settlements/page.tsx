'use client'

import { useState } from 'react'

export default function Settlements() {
  const [settlements] = useState([
    { id: '#1234', customer: 'GABC...XYZ', source: 'USDC (Anchor A)', target: 'USDC (Anchor C)', amount: '$1,250.00', status: 'completed', time: '2 mins ago', fee: '$3.75' },
    { id: '#1233', customer: 'GDEF...UVW', source: 'USDT (Anchor B)', target: 'USDC (Anchor C)', amount: '$890.00', status: 'pending', time: '5 mins ago', fee: '$2.67' },
    { id: '#1232', customer: 'GHIJ...RST', source: 'USDC (Anchor C)', target: 'USDC (Anchor C)', amount: '$2,100.00', status: 'completed', time: '12 mins ago', fee: '$0.00' },
    { id: '#1231', customer: 'GKLM...OPQ', source: 'USDC (Anchor A)', target: 'USDC (Anchor C)', amount: '$450.00', status: 'completed', time: '18 mins ago', fee: '$1.35' },
    { id: '#1230', customer: 'GHNO...LMN', source: 'USDT (Anchor A)', target: 'USDC (Anchor C)', amount: '$3,200.00', status: 'failed', time: '25 mins ago', fee: '$0.00' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settlement History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all cross-anchor settlement transactions.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option>All</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>
          <div>
            <label htmlFor="anchor" className="block text-sm font-medium text-gray-700">Source Anchor</label>
            <select
              id="anchor"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option>All Anchors</option>
              <option>Anchor A</option>
              <option>Anchor B</option>
              <option>Anchor C</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date Range</label>
            <input
              type="date"
              id="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Settlements Table */}
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{settlement.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.source}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.target}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.fee}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      settlement.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      settlement.status === 'pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                      'bg-red-50 text-red-700 ring-red-600/20'
                    }`}>
                      {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{settlement.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
            <span className="font-medium">123</span> results
          </div>
          <div className="flex space-x-2">
            <button className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Previous
            </button>
            <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
