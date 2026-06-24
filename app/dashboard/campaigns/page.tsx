'use client'

import { useState, useEffect } from 'react'
import {
  Megaphone,
  Search,
  Trash2,
  X,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Eye,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  Repeat,
  Plus,
  Edit3,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'broadcast' | 'drip' | 'followup'
  templateId?: string
  message: string
  recipientTags: string[]
  scheduledAt?: string
  recurring?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  stats: { sent: number; delivered: number; read: number; replied: number }
  createdAt: string
  updatedAt: string
}

interface Contact {
  id: string
  name: string
  phone: string
  tags: string[]
}

const CAMPAIGN_TYPES = [
  { value: 'broadcast', label: 'One-time Broadcast', icon: Megaphone, desc: 'Send once to a group' },
  { value: 'drip', label: 'Drip Campaign', icon: Repeat, desc: 'Send messages over time' },
  { value: 'followup', label: 'Follow-up', icon: MessageSquare, desc: 'Follow up with inactive contacts' },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<Campaign | null>(null)
  const [businessUser, setBusinessUser] = useState<any>(null)
  const [campaignCount, setCampaignCount] = useState(0)
  const [limit, setLimit] = useState(3)

  // Form
  const [formName, setFormName] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formType, setFormType] = useState<'broadcast' | 'drip' | 'followup'>('broadcast')
  const [formTags, setFormTags] = useState<string[]>([])
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [formRecurring, setFormRecurring] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
      const [campaignsRes, contactsRes] = await Promise.all([
        fetch(`/api/campaigns?userId=${encodeURIComponent(businessUser.email)}`),
        fetch(`/api/contacts?userId=${encodeURIComponent(businessUser.email)}`)
      ])
      const campaignsData = await campaignsRes.json()
      const contactsData = await contactsRes.json()
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || [])
        setCampaignCount(campaignsData.count || 0)
        setLimit(campaignsData.limit || 3)
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

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formMessage.trim()) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: businessUser.email,
          name: formName,
          type: formType,
          message: formMessage,
          recipientTags: formTags,
          scheduledAt: formScheduledAt || undefined,
          recurring: formRecurring || undefined,
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateModal(false)
        resetForm()
        fetchData()
      } else {
        alert(data.error || 'Failed to create campaign')
      }
    } catch (err) {
      console.error('Failed to create campaign:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          userId: businessUser.email,
          campaignId: campaign.id,
          status: newStatus,
        })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to update campaign:', err)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: businessUser.email, campaignId })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to delete campaign:', err)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormMessage('')
    setFormType('broadcast')
    setFormTags([])
    setFormScheduledAt('')
    setFormRecurring('')
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

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700"><Clock className="w-3 h-3" /> Draft</span>
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700"><Play className="w-3 h-3" /> Active</span>
      case 'paused':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700"><Pause className="w-3 h-3" /> Paused</span>
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700"><CheckCircle className="w-3 h-3" /> Completed</span>
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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Campaigns</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Campaign Manager</h1>
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
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Campaigns</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Campaign Manager</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          Automate your messaging with scheduled campaigns, drip sequences, and follow-ups.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="section-card stat-emerald p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Total Campaigns</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{campaignCount}</p>
          <p className="text-[11px] text-wb-soft mt-1">/ {limit} free limit</p>
        </div>
        <div className="section-card stat-blue p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Active</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{campaigns.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="section-card stat-amber p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Messages Sent</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{campaigns.reduce((sum, c) => sum + c.stats.sent, 0)}</p>
        </div>
        <div className="section-card stat-purple p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Replies</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{campaigns.reduce((sum, c) => sum + c.stats.replied, 0)}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-wb-soft">
          {contacts.length === 0 && (
            <span className="text-amber-600 font-medium">Add contacts first to create campaigns.</span>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true) }}
          disabled={contacts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="section-card p-12 text-center empty-pattern">
          <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg text-wb-ink mb-1">No campaigns yet</h3>
          <p className="text-sm text-wb-soft max-w-xs mx-auto">
            Create your first campaign to automate messaging to your customers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="section-card p-5 hover:border-wb-green/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-sm text-wb-ink">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-wb-bg border border-wb-line/60 text-wb-soft">
                      {CAMPAIGN_TYPES.find(t => t.value === campaign.type)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-wb-soft line-clamp-1 mb-3">{campaign.message}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-xs text-wb-soft">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Sent: {campaign.stats.sent}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Delivered: {campaign.stats.delivered}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Read: {campaign.stats.read}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      Replied: {campaign.stats.replied}
                    </span>
                  </div>

                  {campaign.scheduledAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-wb-soft">
                      <Calendar className="w-3.5 h-3.5" />
                      Scheduled: {formatDate(campaign.scheduledAt)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleToggleStatus(campaign)}
                      className="p-2 rounded-lg text-wb-soft hover:text-emerald-600 hover:bg-emerald-50 transition"
                      title="Activate"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={() => handleToggleStatus(campaign)}
                      className="p-2 rounded-lg text-wb-soft hover:text-amber-600 hover:bg-amber-50 transition"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(campaign)}
                    className="p-2 rounded-lg text-wb-soft hover:text-wb-ink hover:bg-wb-bg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 rounded-lg text-wb-soft hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-down max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-serif text-lg text-wb-ink">New Campaign</h3>
                <p className="text-xs text-wb-soft mt-0.5">Automate your customer messaging</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm() }} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              {/* Campaign Type */}
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Campaign Type</label>
                <div className="grid grid-cols-3 gap-3 mt-1.5">
                  {CAMPAIGN_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormType(type.value as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formType === type.value
                          ? 'border-wb-green/40 bg-wb-green/5 ring-2 ring-wb-green/10'
                          : 'border-wb-line/60 bg-white hover:border-wb-green/20'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mb-1.5 ${formType === type.value ? 'text-wb-green' : 'text-wb-soft'}`} />
                      <p className={`text-xs font-semibold ${formType === type.value ? 'text-wb-dark' : 'text-wb-ink'}`}>{type.label}</p>
                      <p className="text-[10px] text-wb-soft mt-0.5">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Campaign Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Summer Sale Follow-up"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Message *</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  placeholder="Hi {{name}}! Just checking in..."
                  rows={4}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 resize-none font-mono"
                  required
                />
                <p className="text-[11px] text-wb-soft mt-1.5">Use {'{{name}}'} for personalization</p>
              </div>

              {/* Recipients */}
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Send To</label>
                <div className="mt-1.5 space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-wb-bg/50 border border-wb-line/60 rounded-xl cursor-pointer hover:border-wb-green/30 transition">
                    <input type="radio" checked={formTags.length === 0} onChange={() => setFormTags([])} className="accent-wb-green" />
                    <span className="text-sm font-medium text-wb-ink">All Contacts ({contacts.length})</span>
                  </label>
                  {getAllTags().length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getAllTags().map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                            formTags.includes(tag) ? 'bg-wb-green/10 border-wb-green/30 text-wb-dark' : 'bg-white border-wb-line/60 text-wb-soft hover:border-wb-green/30'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={e => setFormScheduledAt(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
                />
              </div>

              {formType === 'drip' && (
                <div>
                  <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Recurring</label>
                  <select
                    value={formRecurring}
                    onChange={e => setFormRecurring(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
                  >
                    <option value="">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              {/* Preview */}
              <div className="bg-wb-bg/50 rounded-xl p-4 border border-wb-line/60">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-wb-ink uppercase tracking-wider">Preview</p>
                  <p className="text-[11px] text-wb-soft">{getRecipientCount()} recipients</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-wb-line/60 shadow-sm">
                  <p className="text-sm text-wb-ink leading-relaxed whitespace-pre-line">
                    {formMessage || 'Your campaign message will appear here...'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm() }} className="flex-1 px-4 py-2.5 bg-wb-bg border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || getRecipientCount() === 0} className="flex-1 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm">
                  {isSaving ? 'Creating...' : 'Create Campaign'}
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
              <h3 className="font-serif text-lg text-wb-ink">Campaign Details</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-emerald rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Sent</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.stats.sent}</p>
                </div>
                <div className="stat-blue rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Delivered</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.stats.delivered}</p>
                </div>
                <div className="stat-amber rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Read</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.stats.read}</p>
                </div>
                <div className="stat-purple rounded-xl p-3">
                  <p className="text-[10px] text-wb-soft uppercase tracking-wider">Replied</p>
                  <p className="text-xl font-bold text-wb-ink">{showDetailModal.stats.replied}</p>
                </div>
              </div>
              <div className="text-xs text-wb-soft space-y-1">
                <p>Type: {CAMPAIGN_TYPES.find(t => t.value === showDetailModal.type)?.label}</p>
                <p>Created: {formatDate(showDetailModal.createdAt)}</p>
                {showDetailModal.scheduledAt && <p>Scheduled: {formatDate(showDetailModal.scheduledAt)}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
