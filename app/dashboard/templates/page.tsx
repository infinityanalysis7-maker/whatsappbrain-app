'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  Check,
  Clock,
  AlertCircle,
  Send,
  Copy,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  Globe,
} from 'lucide-react'

interface Template {
  id: string
  name: string
  language: string
  category: string
  body: string
  variables: string[]
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hi_en', name: 'Hinglish' },
]

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing', color: 'bg-blue-50 text-blue-700' },
  { value: 'utility', label: 'Utility', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'authentication', label: 'Authentication', color: 'bg-purple-50 text-purple-700' },
  { value: 'order', label: 'Order Update', color: 'bg-amber-50 text-amber-700' },
]

const QUICK_TEMPLATES = [
  {
    name: 'Welcome Message',
    body: 'Hi {{name}}! Welcome to {{business}}. We are happy to have you. How can we help you today?',
    category: 'marketing',
    language: 'en',
  },
  {
    name: 'Order Confirmation',
    body: 'Hi {{name}}, your order #{{order_id}} has been confirmed! We will notify you when it ships. Thank you for shopping with us!',
    category: 'order',
    language: 'en',
  },
  {
    name: 'Appointment Reminder',
    body: 'Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}. Please reply CONFIRM to confirm or RESCHEDULE to change.',
    category: 'utility',
    language: 'en',
  },
  {
    name: 'Feedback Request',
    body: 'Hi {{name}}, we hope you enjoyed our service! Could you rate us 1-5? Your feedback helps us serve you better.',
    category: 'marketing',
    language: 'en',
  },
  {
    name: 'Hindi Welcome',
    body: 'Namaste {{name}}! {{business}} mein aapka swagat hai. Hum aapki kaise madad kar sakte hain?',
    category: 'marketing',
    language: 'hi',
  },
  {
    name: 'Offer Announcement',
    body: 'Hi {{name}}! We have an exclusive offer for you: {{offer}}. Valid till {{deadline}}. Reply SHOP now to grab it!',
    category: 'marketing',
    language: 'en',
  },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState<Template | null>(null)
  const [businessUser, setBusinessUser] = useState<any>(null)
  const [templateCount, setTemplateCount] = useState(0)
  const [limit, setLimit] = useState(10)

  // Form
  const [formName, setFormName] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formLanguage, setFormLanguage] = useState('en')
  const [formCategory, setFormCategory] = useState('marketing')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    if (userStr) setBusinessUser(JSON.parse(userStr))
  }, [])

  useEffect(() => {
    if (!businessUser?.email) return
    fetchTemplates()
  }, [businessUser])

  useEffect(() => {
    let filtered = templates.filter(
      t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.body.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filterStatus) {
      filtered = filtered.filter(t => t.status === filterStatus)
    }
    setFilteredTemplates(filtered)
  }, [templates, searchTerm, filterStatus])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/templates?userId=${encodeURIComponent(businessUser.email)}`)
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates || [])
        setTemplateCount(data.count || 0)
        setLimit(data.limit || 10)
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formBody.trim()) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'create',
          userId: businessUser.email,
          templateId: editingId,
          name: formName,
          body: formBody,
          language: formLanguage,
          category: formCategory,
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateModal(false)
        resetForm()
        fetchTemplates()
      } else {
        alert(data.error || 'Failed to save template')
      }
    } catch (err) {
      console.error('Failed to save template:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: businessUser.email, templateId })
      })
      fetchTemplates()
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  const handleSubmitForApproval = async (templateId: string) => {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_for_approval', userId: businessUser.email, templateId })
      })
      fetchTemplates()
    } catch (err) {
      console.error('Failed to submit template:', err)
    }
  }

  const handleUseQuickTemplate = (qt: typeof QUICK_TEMPLATES[0]) => {
    setFormName(qt.name)
    setFormBody(qt.body)
    setFormLanguage(qt.language)
    setFormCategory(qt.category)
    setShowCreateModal(true)
  }

  const handleEdit = (template: Template) => {
    setFormName(template.name)
    setFormBody(template.body)
    setFormLanguage(template.language)
    setFormCategory(template.category)
    setEditingId(template.id)
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormName('')
    setFormBody('')
    setFormLanguage('en')
    setFormCategory('marketing')
    setEditingId(null)
  }

  const extractVariables = (body: string) => {
    return body.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || []
  }

  const getStatusBadge = (status: Template['status']) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700"><Clock className="w-3 h-3" /> Draft</span>
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3" /> Pending</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700"><CheckCircle className="w-3 h-3" /> Approved</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-0 max-w-6xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Templates</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Message Templates</h1>
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
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Templates</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Message Templates</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          Create pre-approved WhatsApp message templates for broadcasts, campaigns, and automated replies.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="section-card stat-emerald p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Total</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{templateCount}</p>
          <p className="text-[11px] text-wb-soft mt-1">/ {limit} limit</p>
        </div>
        <div className="section-card stat-blue p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Approved</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{templates.filter(t => t.status === 'approved').length}</p>
        </div>
        <div className="section-card stat-amber p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Pending</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{templates.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="section-card stat-purple p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Drafts</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{templates.filter(t => t.status === 'draft').length}</p>
        </div>
      </div>

      {/* Quick Templates */}
      {templates.length === 0 && !searchTerm && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-wb-ink uppercase tracking-wider mb-3">Quick Start Templates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_TEMPLATES.map((qt, i) => (
              <button
                key={i}
                onClick={() => handleUseQuickTemplate(qt)}
                className="section-card p-4 text-left hover:border-wb-green/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-wb-ink group-hover:text-wb-dark transition">{qt.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORIES.find(c => c.value === qt.category)?.color || 'bg-gray-100 text-gray-700'}`}>
                    {CATEGORIES.find(c => c.value === qt.category)?.label}
                  </span>
                </div>
                <p className="text-xs text-wb-soft line-clamp-2 leading-relaxed">{qt.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Globe className="w-3 h-3 text-wb-soft" />
                  <span className="text-[10px] text-wb-soft">{LANGUAGES.find(l => l.code === qt.language)?.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wb-soft" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl outline-none text-sm focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="section-card p-12 text-center empty-pattern">
          <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-lg text-wb-ink mb-1">
            {searchTerm ? 'No templates match your search' : 'No templates yet'}
          </h3>
          <p className="text-sm text-wb-soft max-w-xs mx-auto">
            Create your first template to start sending bulk messages and campaigns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const vars = extractVariables(template.body)
            return (
              <div key={template.id} className="section-card p-5 hover:border-wb-green/30 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-wb-ink truncate">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(template.status)}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORIES.find(c => c.value === template.category)?.color || ''}`}>
                        {CATEGORIES.find(c => c.value === template.category)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-wb-soft leading-relaxed line-clamp-3 flex-1 mb-3">{template.body}</p>

                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {vars.map(v => (
                      <span key={v} className="text-[10px] font-mono bg-wb-bg px-1.5 py-0.5 rounded border border-wb-line/60 text-wb-soft">
                        {'{{' + v + '}}'}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-wb-line/40">
                  <button
                    onClick={() => setShowPreviewModal(template)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-wb-bg border border-wb-line/60 rounded-lg hover:bg-wb-green/10 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-wb-bg border border-wb-line/60 rounded-lg hover:bg-wb-green/10 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {template.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitForApproval(template.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-wb-green/10 text-wb-dark border border-wb-green/20 rounded-lg hover:bg-wb-green/20 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-wb-soft hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-down max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-serif text-lg text-wb-ink">{editingId ? 'Edit Template' : 'New Template'}</h3>
                <p className="text-xs text-wb-soft mt-0.5">Use {'{{variable}}'} for personalization</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm() }} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Template Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Welcome Message"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Language</label>
                  <select
                    value={formLanguage}
                    onChange={e => setFormLanguage(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
                  >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Message Body *</label>
                <textarea
                  value={formBody}
                  onChange={e => setFormBody(e.target.value)}
                  placeholder="Hi {{name}}! Welcome to {{business}}..."
                  rows={5}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 resize-none font-mono"
                  required
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-wb-soft">{formBody.length} characters</p>
                  {extractVariables(formBody).length > 0 && (
                    <div className="flex gap-1">
                      {extractVariables(formBody).map(v => (
                        <span key={v} className="text-[10px] font-mono bg-wb-green/10 text-wb-dark px-1.5 py-0.5 rounded">
                          {'{{' + v + '}}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-wb-bg/50 rounded-xl p-4 border border-wb-line/60">
                <p className="text-[11px] font-semibold text-wb-ink uppercase tracking-wider mb-2">Preview</p>
                <div className="bg-white rounded-xl p-4 border border-wb-line/60 shadow-sm">
                  <p className="text-sm text-wb-ink leading-relaxed whitespace-pre-line">
                    {formBody || 'Your template message will appear here...'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm() }} className="flex-1 px-4 py-2.5 bg-wb-bg border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm">
                  {isSaving ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60">
              <h3 className="font-serif text-lg text-wb-ink">Template Preview</h3>
              <button onClick={() => setShowPreviewModal(null)} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-wb-ink">{showPreviewModal.name}</span>
                {getStatusBadge(showPreviewModal.status)}
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/60">
                <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">
                  {showPreviewModal.body}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-wb-soft">
                <span>Language: {LANGUAGES.find(l => l.code === showPreviewModal.language)?.name}</span>
                <span>Category: {CATEGORIES.find(c => c.value === showPreviewModal.category)?.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
