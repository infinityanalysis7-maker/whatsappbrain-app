'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  Search,
  Trash2,
  X,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  Radio,
  Users,
  MessageSquare,
  Calendar,
  Play,
  Pause,
  Eye,
  Zap,
} from 'lucide-react'

interface Broadcast {
  id: string
  name: string
  templateId?: string
  message: string
  recipientCount: number
  sentCount: number
  failedCount: number
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

interface Contact {
  id: string
  name: string
  phone: string
  tags: string[]
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<Broadcast | null>(null)
  const [businessUser, setBusinessUser] = useState<any>(null)
  const [broadcastCount, setBroadcastCount] = useState(0)
  const [limit, setLimit] = useState(5)

  // Form
  const [formName, setFormName] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    if (userStr) setBusinessUser(JSON.parse(userStr))
  }, [])

  useEffect(() => {
    if (!businessUser?.email) return
    fetchData()
  }, [businessUser])

  const fetchData = async () => {
    try {
      const [broadcastsRes, contactsRes] = await Promise.all([
        fetch(`/api/broadcasts?userId=${encodeURIComponent(businessUser.email)}`),
        fetch(`/api/contacts?userId=${encodeURIComponent(businessUser.email)}`)
      ])
      const broadcastsData = await broadcastsRes.json()
      const contactsData = await contactsRes.json()
      if (broadcastsData.success) {
        setBroadcasts(broadcastsData.broadcasts || [])
        setBroadcastCount(broadcastsData.count || 0)
        setLimit(broadcastsData.limit || 5)
      }
      if (contactsData.success) {
        setContacts(contactsData.contacts || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formMessage.trim()) return
    setIsSending(true)
    setSendResult(null)

    try {
      // Create broadcast
      const createRes = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: businessUser.email,
          name: formName,
          message: formMessage,
          recipientTags: formTags,
        })
      })
      const createData = await createRes.json()
      if (!createData.success) {
        alert(createData.error || 'Failed to create broadcast')
        setIsSending(false)
        return
      }

      // Send immediately
      const sendRes = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          userId: businessUser.email,
          broadcastId: createData.broadcast.id,
        })
      })
      const sendData = await sendRes.json()
      setSendResult(sendData)
      if (sendData.success) {
        setShowCreateModal(false)
        resetForm()
        fetchData()
      }
    } catch (err) {
      console.error('Failed to create/send broadcast:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteBroadcast = async (broadcastId: string) => {
    if (!confirm('Delete this broadcast?')) return
    try {
      await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: businessUser.email, broadcastId })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to delete broadcast:', err)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormMessage('')
    setFormTags([])
    setSendResult(null)
  }

  const getRecipientCount = () => {
    if (formTags.length === 0) return contacts.length
    return contacts.filter(c => c.tags.some(t => formTags.includes(t))).length
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    contacts.forEach(c => c.tags.forEach(t => tags.add(t)))
    return Array.from(tags)
  }

  const getStatusBadge = (status: Broadcast['status']) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700"><Clock className="w-3 h-3" /> Draft</span>
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700"><Calendar className="w-3 h-3" /> Scheduled</span>
      case 'sending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 animate-pulse"><Send className="w-3 h-3" /> Sending</span>
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700"><CheckCircle className="w-3 h-3" /> Completed</span>
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-700"><AlertCircle className="w-3 h-3" /> Failed</span>
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  if (isLoading) {
    return (
      <div className="space-y-0 max-w-6xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Broadcasts</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Bulk Messaging</h1>
        </div>
        <div className="section-card p-12 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-wb-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0 max-w-6xl mx-auto">
      <div className="pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Broadcasts</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Bulk Messaging</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          Send the same message to multiple contacts at once. Perfect for offers, updates, and announcements.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="section-card stat-emerald p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Total Broadcasts</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{broadcastCount}</p>
          <p className="text-[11px] text-wb-soft mt-1">/ {limit} free limit</p>
        </div>
        <div className="section-card stat-blue p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Messages Sent</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">
            {broadcasts.reduce((sum, b) => sum + b.sentCount, 0)}
          </p>
        </div>
        <div className="section-card stat-amber p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Available Contacts</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{contacts.length}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-wb-soft">
          {contacts.length === 0 && (
            <span className="text-amber-600 font-medium">
              Add contacts first to send broadcasts.
            </span>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true) }}
          disabled={contacts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:hover:bg-wb-green"
        >
          <Radio className="w-4 h-4" />
          New Broadcast
        </button>
      </div>

      {/* Broadcasts List */}
      {broadcasts.length === 0 ? (
        <div className="section-card p-12 text-center empty-pattern">
          <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg text-wb-ink mb-1">No broadcasts yet</h3>
          <p className="text-sm text-wb-soft max-w-xs mx-auto">
            Send your first bulk message to reach all your customers at once.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(broadcast => (
            <div key={broadcast.id} className="section-card p-5 hover:border-wb-green/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-sm text-wb-ink">{broadcast.name}</h3>
                    {getStatusBadge(broadcast.status)}
                  </div>
                  <p className="text-xs text-wb-soft line-clamp-1 mb-3">{broadcast.message}</p>
                  <div className="flex items-center gap-4 text-xs text-wb-soft">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {broadcast.recipientCount} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {broadcast.sentCount} sent
                    </span>
                    {broadcast.failedCount > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        {broadcast.failedCount} failed
                      </span>
                    )}
                    <span>{formatDate(broadcast.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDetailModal(broadcast)}
                    className="p-2 rounded-lg text-wb-soft hover:text-wb-ink hover:bg-wb-bg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBroadcast(broadcast.id)}
                    className="p-2 rounded-lg text-wb-soft hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar for sending */}
              {broadcast.status === 'sending' && (
                <div className="mt-3">
                  <div className="h-1.5 bg-wb-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wb-green rounded-full transition-all animate-pulse"
                      style={{ width: `${(broadcast.sentCount / broadcast.recipientCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-down max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-serif text-lg text-wb-ink">New Broadcast</h3>
                <p className="text-xs text-wb-soft mt-0.5">Send a message to multiple contacts</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm() }} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <form onSubmit={handleCreateBroadcast} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Broadcast Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Summer Sale Announcement"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Message *</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  placeholder="Hi {{name}}! We have an exciting offer for you..."
                  rows={4}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 resize-none font-mono"
                  required
                />
                <p className="text-[11px] text-wb-soft mt-1.5">
                  Use {'{{name}}'} to personalize with customer name. {'{{phone}}'} for their number.
                </p>
              </div>

              {/* Recipient Filter */}
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Send To</label>
                <div className="mt-1.5 space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-wb-bg/50 border border-wb-line/60 rounded-xl cursor-pointer hover:border-wb-green/30 transition">
                    <input
                      type="radio"
                      checked={formTags.length === 0}
                      onChange={() => setFormTags([])}
                      className="accent-wb-green"
                    />
                    <div>
                      <span className="text-sm font-medium text-wb-ink">All Contacts</span>
                      <span className="text-xs text-wb-soft ml-2">({contacts.length})</span>
                    </div>
                  </label>
                  {getAllTags().length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getAllTags().map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFormTags(prev =>
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            )
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                            formTags.includes(tag)
                              ? 'bg-wb-green/10 border-wb-green/30 text-wb-dark'
                              : 'bg-white border-wb-line/60 text-wb-soft hover:border-wb-green/30'
                          }`}
                        >
                          {tag} ({contacts.filter(c => c.tags.includes(tag)).length})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-wb-bg/50 rounded-xl p-4 border border-wb-line/60">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-wb-ink uppercase tracking-wider">Preview</p>
                  <p className="text-[11px] text-wb-soft">{getRecipientCount()} recipients will receive this message</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-wb-line/60 shadow-sm">
                  <p className="text-sm text-wb-ink leading-relaxed whitespace-pre-line">
                    {formMessage || 'Your broadcast message will appear here...'}
                  </p>
                </div>
              </div>

              {sendResult && (
                <div className={`rounded-xl p-4 border ${sendResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {sendResult.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <p className="font-semibold text-sm">Broadcast sent!</p>
                        <p className="text-xs">{sendResult.sentCount} sent, {sendResult.failedCount} failed</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{sendResult.error || 'Failed to send broadcast'}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm() }} className="flex-1 px-4 py-2.5 bg-wb-bg border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSending || getRecipientCount() === 0} className="flex-1 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2">
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to {getRecipientCount()} contacts
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60">
              <h3 className="font-serif text-lg text-wb-ink">Broadcast Details</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-wb-ink">{showDetailModal.name}</span>
                {getStatusBadge(showDetailModal.status)}
              </div>
              <div className="bg-wb-bg/50 rounded-xl p-4 border border-wb-line/60">
                <p className="text-sm text-wb-ink leading-relaxed whitespace-pre-line">{showDetailModal.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-emerald rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Recipients</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.recipientCount}</p>
                </div>
                <div className="stat-blue rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Sent</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.sentCount}</p>
                </div>
              </div>
              <div className="text-xs text-wb-soft space-y-1">
                <p>Created: {formatDate(showDetailModal.createdAt)}</p>
                {showDetailModal.sentAt && <p>Sent: {formatDate(showDetailModal.sentAt)}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
