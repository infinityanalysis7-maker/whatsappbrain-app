'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  Search,
  Plus,
  Upload,
  Tag,
  Trash2,
  X,
  Check,
  Phone,
  Mail,
  FileText,
  Download,
  Filter,
  UserPlus,
} from 'lucide-react'

interface Contact {
  id: string
  phone: string
  name: string
  email?: string
  tags: string[]
  notes?: string
  customFields: Record<string, string>
  source: string
  createdAt: string
  updatedAt: string
}

const SUGGESTED_TAGS = ['VIP', 'New', 'Regular', 'Lead', 'Pending', 'Follow-up']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [businessUser, setBusinessUser] = useState<any>(null)
  const [contactCount, setContactCount] = useState(0)
  const [limit, setLimit] = useState(100)

  // Add form
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [formNotes, setFormNotes] = useState('')
  const [formTagInput, setFormTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // CSV import
  const [csvText, setCsvText] = useState('')
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    if (userStr) setBusinessUser(JSON.parse(userStr))
  }, [])

  useEffect(() => {
    if (!businessUser?.email) return
    fetchContacts()
  }, [businessUser])

  useEffect(() => {
    let filtered = contacts.filter(
      c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    if (filterTag) {
      filtered = filtered.filter(c => c.tags.includes(filterTag))
    }
    setFilteredContacts(filtered)
  }, [contacts, searchTerm, filterTag])

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?userId=${encodeURIComponent(businessUser.email)}`)
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts || [])
        setContactCount(data.count || 0)
        setLimit(data.limit || 100)
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPhone.trim()) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: businessUser.email,
          name: formName,
          phone: formPhone,
          email: formEmail,
          tags: formTags,
          notes: formNotes,
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowAddModal(false)
        resetForm()
        fetchContacts()
      } else {
        alert(data.error || 'Failed to add contact')
      }
    } catch (err) {
      console.error('Failed to add contact:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: businessUser.email, contactId })
      })
      fetchContacts()
    } catch (err) {
      console.error('Failed to delete contact:', err)
    }
  }

  const handleCsvImport = async () => {
    if (!csvText.trim()) return
    setIsImporting(true)
    setImportResult(null)

    try {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name')
      const phoneIdx = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'whatsapp')
      const emailIdx = headers.findIndex(h => h === 'email')
      const tagsIdx = headers.findIndex(h => h === 'tags' || h === 'tag')

      if (nameIdx === -1 || phoneIdx === -1) {
        setImportResult({ error: 'CSV must have "name" and "phone" columns' })
        return
      }

      const contactsToCreate = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim())
        return {
          name: cols[nameIdx] || '',
          phone: cols[phoneIdx] || '',
          email: emailIdx !== -1 ? cols[emailIdx] : undefined,
          tags: tagsIdx !== -1 ? cols[tagsIdx]?.split(';').map(t => t.trim()).filter(Boolean) : [],
          source: 'csv' as const,
        }
      }).filter(c => c.name && c.phone)

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_create', userId: businessUser.email, contacts: contactsToCreate })
      })
      const data = await res.json()
      setImportResult(data)
      if (data.success) {
        fetchContacts()
        setCsvText('')
      }
    } catch (err) {
      setImportResult({ error: 'Failed to parse CSV' })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text)
      // Auto-preview
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1, 6).map(line => {
        const cols = line.split(',').map(c => c.trim())
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: cols[i] || '' }), {})
      })
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setFormName('')
    setFormPhone('')
    setFormEmail('')
    setFormTags([])
    setFormNotes('')
    setFormTagInput('')
  }

  const addTag = (tag: string) => {
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag])
    }
    setFormTagInput('')
  }

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag))
  }

  const exportContacts = () => {
    const csv = 'name,phone,email,tags\n' + contacts.map(c =>
      `${c.name},${c.phone},${c.email || ''},${c.tags.join(';')}`
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    contacts.forEach(c => c.tags.forEach(t => tags.add(t)))
    return Array.from(tags)
  }

  if (isLoading) {
    return (
      <div className="space-y-0 max-w-6xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Contacts</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Contact List</h1>
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
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Contacts</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Contact List</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          Manage your customer contacts, import lists from CSV, and tag them for targeted broadcasts.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="section-card stat-emerald p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Total Contacts</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{contactCount}</p>
          <p className="text-[11px] text-wb-soft mt-1">/ {limit} free limit</p>
        </div>
        <div className="section-card stat-blue p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Tags Used</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">{getAllTags().length}</p>
        </div>
        <div className="section-card stat-amber p-4">
          <p className="text-[11px] text-wb-soft uppercase tracking-wider font-medium">Imported</p>
          <p className="text-2xl font-bold text-wb-ink mt-1">
            {contacts.filter(c => c.source === 'csv').length}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wb-soft" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl outline-none text-sm focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 transition-all"
            />
          </div>
          {getAllTags().length > 0 && (
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="px-3 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40"
            >
              <option value="">All tags</option>
              {getAllTags().map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink hover:border-wb-green/30 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={exportContacts}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink hover:border-wb-green/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="section-card overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center empty-pattern">
            <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-lg text-wb-ink mb-1">
              {searchTerm ? 'No contacts match your search' : 'No contacts yet'}
            </h3>
            <p className="text-sm text-wb-soft max-w-xs mx-auto mb-4">
              {searchTerm
                ? 'Try a different search term.'
                : 'Add contacts manually or import from a CSV file to start sending broadcasts.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-wb-line/60">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft">Name</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft">Phone</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft hidden md:table-cell">Email</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft">Tags</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft hidden lg:table-cell">Source</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-wb-soft">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wb-line/40">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-wb-bg/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-wb-green/10 border border-wb-green/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-wb-dark">
                            {contact.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <span className="font-medium text-sm text-wb-ink">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-wb-soft font-mono">+{contact.phone}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-wb-soft">{contact.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-wb-green/10 text-wb-dark border border-wb-green/20">
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length === 0 && <span className="text-xs text-wb-soft/60">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        contact.source === 'csv' ? 'bg-blue-50 text-blue-700' :
                        contact.source === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-wb-bg text-wb-soft'
                      }`}>
                        {contact.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 rounded-lg text-wb-soft hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60">
              <div>
                <h3 className="font-serif text-lg text-wb-ink">Add Contact</h3>
                <p className="text-xs text-wb-soft mt-0.5">Add a new customer to your list</p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm() }} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Phone Number *</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Email (optional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                  {formTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-wb-green/10 text-wb-dark border border-wb-green/20 rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formTagInput}
                    onChange={e => setFormTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(formTagInput) } }}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-wb-bg/50 border border-wb-line/60 rounded-lg text-xs outline-none focus:border-wb-green/40"
                  />
                  <button type="button" onClick={() => addTag(formTagInput)} className="px-3 py-2 bg-wb-bg border border-wb-line/60 rounded-lg text-xs font-medium hover:bg-wb-green/10 transition">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGGESTED_TAGS.filter(t => !formTags.includes(t)).slice(0, 4).map(tag => (
                    <button key={tag} type="button" onClick={() => addTag(tag)} className="px-2 py-0.5 text-[10px] bg-wb-bg border border-wb-line/60 rounded-full hover:bg-wb-green/10 transition">
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Prefers morning appointments..."
                  rows={2}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm() }} className="flex-1 px-4 py-2.5 bg-wb-bg border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm">
                  {isSaving ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between p-6 border-b border-wb-line/60">
              <div>
                <h3 className="font-serif text-lg text-wb-ink">Import Contacts from CSV</h3>
                <p className="text-xs text-wb-soft mt-0.5">Upload a CSV with name, phone, email, tags columns</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setCsvText(''); setCsvPreview([]); setImportResult(null) }} className="p-2 rounded-lg hover:bg-wb-bg transition">
                <X className="w-5 h-5 text-wb-soft" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Upload CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full mt-1.5 text-sm text-wb-soft file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-wb-green file:text-white hover:file:bg-wb-dark file:cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-wb-ink uppercase tracking-wider">Or Paste CSV Content</label>
                <textarea
                  value={csvText}
                  onChange={e => { setCsvText(e.target.value); setCsvPreview([]) }}
                  placeholder={"name,phone,email,tags\nRahul Sharma,9876543210,rahul@test.com,VIP\nPriya Patel,9123456789,,New"}
                  rows={5}
                  className="w-full mt-1.5 px-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl text-sm outline-none focus:border-wb-green/40 font-mono resize-none"
                />
              </div>

              {csvPreview.length > 0 && (
                <div className="bg-wb-bg/50 rounded-xl p-4 border border-wb-line/60">
                  <p className="text-xs font-semibold text-wb-ink mb-2">Preview (first 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-wb-line/60">
                          {Object.keys(csvPreview[0]).map(h => (
                            <th key={h} className="text-left py-1 px-2 font-semibold text-wb-soft">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i} className="border-b border-wb-line/30">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="py-1 px-2 text-wb-ink">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult && (
                <div className={`rounded-xl p-4 border ${importResult.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  {importResult.error ? (
                    <p className="text-sm font-medium">{importResult.error}</p>
                  ) : (
                    <div className="text-sm">
                      <p className="font-semibold">Import complete!</p>
                      <p>{importResult.created} contacts added, {importResult.skipped} skipped</p>
                      <p className="text-xs mt-1 opacity-70">Total contacts: {importResult.total}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-wb-soft bg-wb-bg/50 rounded-xl p-3 border border-wb-line/40">
                <p className="font-semibold text-wb-ink mb-1">CSV Format:</p>
                <p>Required columns: <code className="bg-wb-bg px-1 rounded">name</code>, <code className="bg-wb-bg px-1 rounded">phone</code></p>
                <p>Optional: <code className="bg-wb-bg px-1 rounded">email</code>, <code className="bg-wb-bg px-1 rounded">tags</code> (separate with ;)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowImportModal(false); setCsvText(''); setCsvPreview([]); setImportResult(null) }} className="flex-1 px-4 py-2.5 bg-wb-bg border border-wb-line/60 rounded-xl text-sm font-medium text-wb-soft hover:text-wb-ink transition">
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvText.trim() || isImporting}
                  className="flex-1 px-4 py-2.5 bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm"
                >
                  {isImporting ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
