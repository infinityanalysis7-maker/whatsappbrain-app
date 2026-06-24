'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Bot,
  User,
  Send,
  MessageSquare,
  AlertCircle,
  Inbox,
  ArrowLeft,
  Zap,
  Clock,
  StickyNote,
} from 'lucide-react'

const QUICK_REPLIES = [
  { label: 'Thanks!', text: 'Thank you for reaching out! How can we help you?' },
  { label: 'Please wait', text: 'Please wait a moment, I\'ll check that for you.' },
  { label: 'Hours', text: 'Our business hours are 9 AM to 8 PM, Monday to Saturday. Sunday closed.' },
  { label: 'Location', text: 'You can find us at our location. Would you like the directions?' },
  { label: 'Pricing', text: 'Let me share our pricing with you. One moment please.' },
  { label: 'Custom', text: '' },
]
import { DbConversation } from '@/lib/db'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<DbConversation[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<DbConversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [businessUser, setBusinessUser] = useState<any>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Get user details
  useEffect(() => {
    const userStr = localStorage.getItem('wb_user')
    if (userStr) {
      setBusinessUser(JSON.parse(userStr))
    }
  }, [])

  // Poll for conversations list
  useEffect(() => {
    if (!businessUser?.email) return

    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/conversations?userId=${encodeURIComponent(businessUser.email)}`)
        const data = await res.json()
        if (data.success) {
          setConversations(data.conversations || [])
        }
      } catch (err) {
        console.error('Failed to poll conversations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
    const interval = setInterval(fetchConversations, 4000)
    return () => clearInterval(interval)
  }, [businessUser])

  // Poll active chat message history
  useEffect(() => {
    if (!businessUser?.email || !selectedPhone) return

    const fetchActiveChat = async () => {
      try {
        const res = await fetch(
          `/api/conversations?userId=${encodeURIComponent(businessUser.email)}&customerPhone=${encodeURIComponent(selectedPhone)}`
        )
        const data = await res.json()
        if (data.success && data.conversation) {
          setActiveChat(data.conversation)
        }
      } catch (err) {
        console.error('Failed to fetch active chat details:', err)
      }
    }

    fetchActiveChat()
    const interval = setInterval(fetchActiveChat, 2000) // Poll active chat faster for better chat feel
    return () => clearInterval(interval)
  }, [businessUser, selectedPhone])

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !businessUser?.email || !selectedPhone || isSending) return

    setIsSending(true)
    const textToSend = newMessage
    setNewMessage('') // Optimistic clear

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          userId: businessUser.email,
          customerPhone: selectedPhone,
          text: textToSend
        })
      })
      const data = await res.json()
      if (data.success && data.conversation) {
        setActiveChat(data.conversation)
        // Refresh conversations list instantly
        setConversations(prev => 
          prev.map(c => c.customerPhone === selectedPhone ? data.conversation : c)
        )
      }
    } catch (err) {
      console.error('Failed to send manual message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleUpdateStatus = async (status: 'bot' | 'human_active') => {
    if (!businessUser?.email || !selectedPhone || !activeChat) return

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          userId: businessUser.email,
          customerPhone: selectedPhone,
          status
        })
      })
      const data = await res.json()
      if (data.success && data.conversation) {
        setActiveChat(data.conversation)
        setConversations(prev => 
          prev.map(c => c.customerPhone === selectedPhone ? data.conversation : c)
        )
      }
    } catch (err) {
      console.error('Failed to update handoff status:', err)
    }
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(
    c =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerPhone.includes(searchTerm)
  )

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: DbConversation['status']) => {
    switch (status) {
      case 'bot':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Active
          </span>
        )
      case 'human_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Needs You
          </span>
        )
      case 'human_active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
            <User className="w-3 h-3" />
            You Active
          </span>
        )
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-0 max-w-6xl mx-auto">
        <div className="pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wb-soft mb-2">Messages</p>
          <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Conversations</h1>
          <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
            View and manage customer conversations from your WhatsApp bot.
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm border border-wb-line/70 rounded-2xl p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-wb-green border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-wb-soft font-medium">Loading conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-wb-soft mb-1.5">Messages</p>
        <h1 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">Conversations</h1>
        <p className="text-wb-soft mt-2 max-w-xl leading-relaxed">
          See every customer chat, reply manually when needed, and toggle the AI assistant on or off per conversation.
        </p>
      </div>

      {/* Main conversation container */}
      <div className="bg-white/90 backdrop-blur-sm border border-wb-line/70 rounded-2xl h-[calc(100vh-280px)] min-h-[500px] flex overflow-hidden shadow-sm ring-1 ring-black/[0.02]">
        
        {/* Left Conversation List Panel */}
        <div className="w-full md:w-80 border-r border-wb-line/70 flex flex-col shrink-0">
          {/* Search header */}
          <div className="p-4 border-b border-wb-line/60">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
              </span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl outline-none text-sm focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 transition-all"
              />
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-4 py-3 border-b border-wb-line/60 bg-wb-bg/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-wb-soft font-medium">{filteredConversations.length} conversations</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-wb-green opacity-40 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-wb-green" />
                </span>
                <span className="text-wb-soft">Live</span>
              </div>
            </div>
          </div>

          {/* Scrollable conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-wb-bg border border-wb-line/70 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-6 h-6 text-wb-soft" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg text-wb-ink mb-1">No conversations yet</h3>
                  <p className="text-sm text-wb-soft max-w-xs mx-auto">
                    {searchTerm 
                      ? 'No conversations match your search.'
                      : 'When a customer messages your WhatsApp number, their chat appears here. Make sure your bot rules are set up and your number is active.'}
                  </p>
                </div>
            ) : (
              <div className="divide-y divide-wb-line/50">
                {filteredConversations.map(c => {
                  const lastMsg = c.messages[c.messages.length - 1]
                  const isSelected = selectedPhone === c.customerPhone
                  const isPending = c.status === 'human_pending'
                  
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedPhone(c.customerPhone)}
                      className={`w-full text-left p-4 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-wb-green/5 border-l-[3px] border-l-wb-green' 
                          : isPending
                          ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-[3px] border-l-amber-400'
                          : 'hover:bg-wb-bg/60 border-l-[3px] border-l-transparent'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-wb-green/10 border-wb-green/30 text-wb-dark' : 'bg-wb-bg border-wb-line/60 text-wb-soft'
                        }`}>
                          {getInitials(c.customerName)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`font-semibold text-sm truncate ${
                              isSelected ? 'text-wb-dark' : 'text-wb-ink'
                            }`}>
                              {c.customerName}
                            </span>
                            <span className="text-[11px] text-wb-soft shrink-0">
                              {lastMsg ? formatDate(lastMsg.timestamp) : ''}
                            </span>
                          </div>
                          
                          <p className="text-xs text-wb-soft truncate mb-2 leading-relaxed">
                            {lastMsg ? lastMsg.text : 'No messages yet'}
                          </p>
                          
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-wb-soft font-mono">
                              +{c.customerPhone}
                            </span>
                            {getStatusBadge(c.status)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Screen - Desktop */}
        <div className="hidden md:flex flex-1 flex-col">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="bg-white px-6 py-4 border-b border-wb-line/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setSelectedPhone(null)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-wb-bg transition"
                  >
                    <ArrowLeft className="w-5 h-5 text-wb-soft" />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-wb-bg border border-wb-line/60 flex items-center justify-center">
                    <span className="text-sm font-semibold text-wb-soft">
                      {getInitials(activeChat.customerName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-wb-ink text-sm">{activeChat.customerName}</h3>
                    <p className="text-xs text-wb-soft font-mono">+{activeChat.customerPhone}</p>
                  </div>
                </div>

                {/* AI Assistant toggle */}
                <div className="flex items-center gap-3 bg-wb-bg/60 border border-wb-line/60 rounded-xl px-3 py-2">
                  <Zap className="w-4 h-4 text-wb-soft" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-wb-ink hidden sm:inline">AI Assistant</span>
                  <div className="flex bg-wb-line/60 rounded-lg p-0.5">
                    <button
                      onClick={() => handleUpdateStatus('bot')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        activeChat.status === 'bot'
                          ? 'bg-white shadow-sm text-emerald-700'
                          : 'text-wb-soft hover:text-wb-ink'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      On
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('human_active')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        activeChat.status === 'human_active' || activeChat.status === 'human_pending'
                          ? 'bg-white shadow-sm text-blue-700'
                          : 'text-wb-soft hover:text-wb-ink'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending handoff alert */}
              {activeChat.status === 'human_pending' && (
                <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Customer requested takeover</p>
                      <p className="text-[11px] text-amber-700/80">The bot is paused. Reply below to take over the conversation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-wb-bg/20 to-wb-bg/40">
                {activeChat.messages.map((m, idx) => {
                  const isCustomer = m.sender === 'customer'
                  const isBot = m.sender === 'bot'
                  
                  return (
                    <div
                      key={idx}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          isCustomer
                            ? 'bg-white text-wb-ink border border-wb-line/60 rounded-tl-sm shadow-sm'
                            : isBot
                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-900 border border-emerald-200/60 rounded-tr-sm'
                            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-900 border border-blue-200/60 rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-6 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCustomer ? 'text-wb-soft' : isBot ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {isCustomer ? activeChat.customerName : isBot ? '✨ AI Assistant' : '🙋 You'}
                          </span>
                          <span className="text-[10px] text-wb-soft/70">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="bg-white px-6 py-2 border-t border-wb-line/40">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-wb-soft font-semibold uppercase tracking-wider shrink-0">Quick:</span>
                  {QUICK_REPLIES.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (qr.text) {
                          setNewMessage(qr.text)
                        }
                      }}
                      className="shrink-0 px-3 py-1 text-[11px] font-medium bg-wb-bg/80 border border-wb-line/60 rounded-full hover:bg-wb-green/10 hover:border-wb-green/30 hover:text-wb-dark transition-all text-wb-soft"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-wb-line/60">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1 px-4 py-3 bg-wb-bg/50 border border-wb-line/60 rounded-xl outline-none focus:border-wb-green/40 focus:ring-2 focus:ring-wb-green/10 text-sm transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl px-5 py-3 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-wb-green shadow-sm hover:shadow-md shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-[11px] text-wb-soft/70 mt-2 px-1">
                  Sending will pause the AI and switch to owner mode.
                </p>
              </form>
            </>
          ) : (
            /* Empty state - no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-wb-bg border border-wb-line/60 flex items-center justify-center mb-5">
                <MessageSquare className="w-8 h-8 text-wb-soft" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl text-wb-ink mb-2">Select a Conversation</h3>
              <p className="text-sm text-wb-soft max-w-xs leading-relaxed">
                Pick a customer from the list to see their messages, reply manually, or toggle the AI assistant on and off.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat Overlay */}
      {selectedPhone && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* Mobile Chat header */}
          <div className="bg-white px-4 py-3 border-b border-wb-line/60 flex items-center justify-between">
            <button
              onClick={() => setSelectedPhone(null)}
              className="p-2 -ml-2 rounded-lg hover:bg-wb-bg transition"
            >
              <ArrowLeft className="w-5 h-5 text-wb-soft" />
            </button>
            
            {activeChat ? (
              <>
                <div className="flex-1 text-center">
                  <h3 className="font-semibold text-wb-ink text-sm">{activeChat.customerName}</h3>
                  <p className="text-[10px] text-wb-soft font-mono">+{activeChat.customerPhone}</p>
                </div>

                <div className="flex items-center gap-1.5 bg-wb-bg border border-wb-line/60 rounded-lg px-2 py-1.5">
                  <Zap className="w-3 h-3 text-wb-soft" />
                  <button
                    onClick={() => handleUpdateStatus(activeChat.status === 'bot' ? 'human_active' : 'bot')}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      activeChat.status === 'bot'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-wb-line/60 text-wb-soft'
                    }`}
                  >
                    {activeChat.status === 'bot' ? 'AI ON' : 'AI OFF'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center">
                <h3 className="font-semibold text-wb-ink text-sm">Loading...</h3>
              </div>
            )}
          </div>

          {activeChat ? (
            <>
              {/* Mobile pending alert */}
              {activeChat.status === 'human_pending' && (
                <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-medium text-amber-800">
                      Customer requested takeover
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-wb-bg/20 to-wb-bg/40">
                {activeChat.messages.map((m, idx) => {
                  const isCustomer = m.sender === 'customer'
                  const isBot = m.sender === 'bot'
                  
                  return (
                    <div
                      key={idx}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs ${
                          isCustomer
                            ? 'bg-white text-wb-ink border border-wb-line/60 rounded-tl-sm'
                            : isBot
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-tr-sm'
                            : 'bg-blue-50 text-blue-900 border border-blue-200/60 rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-6 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            isCustomer ? 'text-wb-soft' : isBot ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {isCustomer ? activeChat.customerName : isBot ? '✨ AI' : '🙋 You'}
                          </span>
                          <span className="text-[9px] text-wb-soft/70">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Mobile Quick Replies */}
              <div className="bg-white px-3 py-2 border-t border-wb-line/40">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {QUICK_REPLIES.filter(q => q.text).slice(0, 4).map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => setNewMessage(qr.text)}
                      className="shrink-0 px-2.5 py-1 text-[10px] font-medium bg-wb-bg/80 border border-wb-line/60 rounded-full hover:bg-wb-green/10 transition-all text-wb-soft"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile input */}
              <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-wb-line/60">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1 px-3 py-2.5 bg-wb-bg/50 border border-wb-line/60 rounded-xl outline-none focus:border-wb-green/40 text-xs transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-wb-green hover:bg-wb-dark text-white font-semibold rounded-xl p-2.5 transition-all flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
