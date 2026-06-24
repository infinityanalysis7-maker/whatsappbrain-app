'use client'
import { useState } from 'react'

interface GoogleUser {
  email: string
  name: string
}

interface GoogleMockPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (user: GoogleUser) => void
}

const mockAccounts = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', avatar: 'R' },
  { name: 'Priya Patel', email: 'priya.patel@gmail.com', avatar: 'P' },
  { name: 'Amit Verma', email: 'amit.verma@gmail.com', avatar: 'A' }
]

export default function GoogleMockPopup({ isOpen, onClose, onSelect }: GoogleMockPopupProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  if (!isOpen) return null

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customName.trim() && customEmail.trim()) {
      onSelect({ name: customName.trim(), email: customEmail.trim() })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative bg-white w-full max-w-sm rounded-lg shadow-xl border border-stone-200 p-6 z-10 animate-slide-down">
        {/* Google Branding Header */}
        <div className="text-center mb-6">
          <svg className="w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <h2 className="text-xl font-medium text-stone-800">Sign in with Google</h2>
          <p className="text-xs text-stone-500 mt-1">to continue to WhatsAppBrain</p>
        </div>

        {!customMode ? (
          <div className="space-y-3">
            {/* Account List */}
            <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-200">
              {mockAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => onSelect({ name: account.name, email: account.email })}
                  className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-wb-green/10 text-wb-dark font-bold flex items-center justify-center text-xs">
                    {account.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-700 truncate">{account.name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setCustomMode(true)}
              className="w-full text-center text-xs text-wb-dark font-semibold py-2 hover:underline"
            >
              Use another account
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-wb-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Google Email Address</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="rahul@gmail.com"
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-wb-green"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="px-3 py-1.5 border border-stone-300 text-stone-600 text-xs rounded-md hover:bg-stone-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-wb-green text-white font-semibold text-xs rounded-md hover:bg-wb-dark"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-stone-200 text-center">
          <button 
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
