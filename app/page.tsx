'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Brain,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  MessageSquare,
  Bot,
  UserCheck,
  BarChart3,
  Globe,
  Menu,
  X,
  Check,
  Sparkles,
} from 'lucide-react'
import { CardContainer, CardBody, CardItem } from '@/components/ui/three-d-card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { GlareCard } from '@/components/ui/glare-card'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'

/* ─── Utility hooks ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}


/* ─── WhatsApp-style message bubble ─── */
function ChatBubble({ text, isUser, delay = 0 }: { text: string; isUser?: boolean; delay?: number }) {
  const { ref, inView } = useInView(0.2)
  return (
    <div
      ref={ref}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-500 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#DCF8C6] text-wb-ink rounded-br-md'
            : 'bg-white border border-wb-line/50 text-wb-ink rounded-bl-md shadow-sm'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

/* ─── FAQ item ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const id = question.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return (
    <div className="border border-wb-line/60 rounded-xl bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`faq-${id}`}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className="font-medium text-wb-ink">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-wb-soft shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-wb-soft shrink-0" />
        )}
      </button>
      <div
        id={`faq-${id}`}
        role="region"
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-4 text-wb-soft leading-relaxed text-sm">{answer}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-wb-line/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-wb-green flex items-center justify-center shadow-sm shadow-wb-green/20">
            <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-serif text-xl text-wb-ink tracking-tight">WhatsAppBrain</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Pricing</a>
          <a href="#faq" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">FAQ</a>
          <Link
            href="/login"
            className="text-sm font-medium text-wb-dark hover:text-wb-ink transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-wb-green hover:bg-wb-dark text-white px-5 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-wb-green/20"
          >
            Get Started Free
          </Link>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-wb-bg transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5 text-wb-ink" /> : <Menu className="w-5 h-5 text-wb-ink" />}
        </button>
      </div>
      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80 border-b border-wb-line/50 bg-white/95 backdrop-blur-xl' : 'max-h-0'
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-wb-soft hover:text-wb-ink hover:bg-wb-bg rounded-lg transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-wb-soft hover:text-wb-ink hover:bg-wb-bg rounded-lg transition-colors">How It Works</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-wb-soft hover:text-wb-ink hover:bg-wb-bg rounded-lg transition-colors">Pricing</a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-wb-soft hover:text-wb-ink hover:bg-wb-bg rounded-lg transition-colors">FAQ</a>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 text-sm font-medium text-wb-dark border border-wb-line rounded-xl hover:bg-wb-bg transition-colors">Log in</Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-center px-4 py-2.5 text-sm font-semibold bg-wb-green hover:bg-wb-dark text-white rounded-xl transition-all duration-200">Get Started Free</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-wb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-wb-dark/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="max-w-xl">
            <FadeIn>
              <div className="inline-flex items-center gap-2 bg-wb-green/10 text-wb-dark text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-wb-green/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-wb-green opacity-40 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-wb-green" />
                </span>
                Free for small businesses
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] text-wb-ink leading-[1.1] tracking-tight mb-6">
                Your WhatsApp bot that{' '}
                <AnimatedGradientText className="font-serif">actually understands</AnimatedGradientText>{' '}
                your customers
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg text-wb-soft leading-relaxed mb-8 max-w-md">
                Auto-reply to price questions, share your hours, confirm bookings, and hand off complex queries to you — all on WhatsApp.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-wb-green hover:bg-wb-dark text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-wb-green/20 hover:-translate-y-0.5 animate-glow"
                >
                  <Sparkles className="w-4 h-4" />
                  Start for Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 text-wb-soft hover:text-wb-ink font-medium px-7 py-3.5 rounded-xl border border-wb-line hover:border-wb-green/30 hover:bg-white/50 transition-all duration-200"
                >
                  See how it works
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <p className="text-xs text-wb-soft mt-5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-wb-dark" strokeWidth={2} />
                No credit card required &middot; Setup in 2 minutes
              </p>
            </FadeIn>
          </div>

          {/* Right: 3D Phone mockup with perspective card */}
          <FadeIn delay={200} className="relative">
            <CardContainer containerClassName="py-4">
              <CardBody className="relative group/card">
                <CardItem translateZ="80">
                  <div className="relative mx-auto max-w-sm">
                    {/* Phone frame */}
                    <div className="relative bg-wb-ink rounded-[2.5rem] p-3 shadow-2xl shadow-black/20 group-hover/card:shadow-wb-green/20 transition-all duration-500">
                      <div className="bg-[#ECE5DD] rounded-[2rem] overflow-hidden">
                        {/* WhatsApp header bar */}
                        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-xs font-semibold">Business Assistant</p>
                            <p className="text-white/60 text-[10px]">online</p>
                          </div>
                        </div>
                        {/* Chat area */}
                        <div className="px-3 py-4 space-y-2.5 min-h-[320px]">
                          <ChatBubble text="Hi! What are your prices for a haircut?" isUser delay={0} />
                          <ChatBubble text="Hey! Our haircut pricing:" delay={300} />
                          <ChatBubble text="✂️ Men's Cut — ₹299\n💇 Women's Cut — ₹499\n💈 Kids Cut — ₹199\n\nWant to book a slot?" delay={500} />
                          <ChatBubble text="Yes, tomorrow at 3pm please!" isUser delay={800} />
                          <ChatBubble text="✅ Done! You're booked for tomorrow at 3:00 PM. See you there!" delay={1100} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardItem>
                {/* Floating badges with 3D depth */}
                <CardItem translateZ="100" className="absolute -top-3 -right-3">
                  <div className="bg-white rounded-xl shadow-lg shadow-black/5 border border-wb-line/50 px-3 py-2 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="w-7 h-7 rounded-lg bg-wb-green/10 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-wb-dark" />
                    </div>
                    <span className="text-xs font-semibold text-wb-ink">Auto-replied</span>
                  </div>
                </CardItem>
                <CardItem translateZ="90" className="absolute -bottom-3 -left-3">
                  <div className="bg-white rounded-xl shadow-lg shadow-black/5 border border-wb-line/50 px-3 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-wb-green/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-wb-dark" />
                    </div>
                    <span className="text-xs font-semibold text-wb-ink">Response: 0.3s</span>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}



/* ─── How it works ─── */
function HowItWorks() {
  const steps = [
    {
      icon: MessageSquare,
      title: 'Connect your WhatsApp',
      desc: 'Link your WhatsApp Business number in under 2 minutes. We handle the API setup.',
    },
    {
      icon: Bot,
      title: 'Set your rules',
      desc: 'Tell the bot your prices, hours, and location — or let our AI generate rules from a conversation.',
    },
    {
      icon: Zap,
      title: 'Customers get instant replies',
      desc: 'When someone messages you, the bot answers instantly. Complex questions get routed to you.',
    },
  ]
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wb-dark mb-3">How it works</p>
          <h2 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">
            Three steps to never miss a customer
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-wb-line via-wb-green/30 to-wb-line" />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 150} className="relative">
              <CardSpotlight className="rounded-2xl" radius={180} color="rgba(37, 211, 102, 0.08)">
                <div className="relative z-10 p-8 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-2xl bg-wb-green/10 rotate-3 group-hover:rotate-6 transition-transform duration-300" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-wb-green/10 to-teal-500/10 border border-wb-green/20 flex items-center justify-center shadow-sm shadow-wb-green/10">
                      <step.icon className="w-7 h-7 text-wb-dark" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-wb-green to-teal-500 text-white text-xs font-bold flex items-center justify-center shadow-sm shadow-wb-green/30">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-wb-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-wb-soft leading-relaxed">{step.desc}</p>
                </div>
              </CardSpotlight>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Features ─── */
function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Instant Auto-Reply',
      desc: 'Respond to customers in under 3 seconds, 24/7. Never lose a lead because you were busy.',
      color: 'emerald',
    },
    {
      icon: Brain,
      title: 'AI-Powered Understanding',
      desc: 'Built-in AI fallback handles questions you haven\'t pre-defined. Learns from every conversation.',
      color: 'teal',
    },
    {
      icon: UserCheck,
      title: 'Smart Handoff',
      desc: 'When the bot can\'t help, it alerts you instantly via email. You jump in exactly when needed.',
      color: 'cyan',
    },
    {
      icon: BarChart3,
      title: 'Conversation Analytics',
      desc: 'See which questions customers ask most, peak hours, and how much time the bot saves you.',
      color: 'blue',
    },
    {
      icon: ShieldCheck,
      title: 'Verified & Secure',
      desc: 'Webhook signature verification, encrypted storage, and GDPR-compliant data handling.',
      color: 'indigo',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      desc: 'Supports English, Hindi, and regional languages. Your customers chat in their preferred language.',
      color: 'purple',
    },
  ]

  const cardVariants = [
    (f: typeof features[0], i: number) => (
      <CardContainer key={i} containerClassName="py-2">
        <CardBody className="relative group/card bg-white/90 backdrop-blur-sm border border-wb-line/60 rounded-2xl p-6 h-full hover:shadow-lg hover:border-wb-green/25 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-tr from-wb-green/5 via-transparent to-teal-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          <CardItem translateZ="50">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${f.color}-500/20 to-${f.color}-600/20 flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300`}>
              <f.icon className={`w-6 h-6 text-${f.color}-600`} strokeWidth={1.5} />
            </div>
          </CardItem>
          <CardItem translateZ="40">
            <h3 className="font-serif text-lg text-wb-ink mb-2">{f.title}</h3>
          </CardItem>
          <CardItem translateZ="30">
            <p className="text-sm text-wb-soft leading-relaxed">{f.desc}</p>
          </CardItem>
        </CardBody>
      </CardContainer>
    ),
  ]

  return (
    <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-transparent via-white/30 to-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wb-dark mb-3">Features</p>
          <h2 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight mb-4">
            Everything you need to automate WhatsApp
          </h2>
          <p className="text-wb-soft max-w-lg mx-auto leading-relaxed">
            Built for small businesses that want to respond faster without hiring staff.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <GlareCard className="p-6 h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6 text-wb-dark" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-wb-ink mb-2">{f.title}</h3>
                <p className="text-sm text-wb-soft leading-relaxed">{f.desc}</p>
              </GlareCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wb-dark mb-3">Pricing</p>
          <h2 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight mb-4">
            Start free, scale as you grow
          </h2>
          <p className="text-wb-soft max-w-lg mx-auto leading-relaxed">
            No hidden fees. No credit card required. Upgrade when you're ready.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <FadeIn delay={0}>
            <div className="relative rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border border-wb-line/60 shadow-sm hover:shadow-lg hover:border-wb-green/25">
              <div className="mb-6">
                <h3 className="font-serif text-xl mb-1 text-wb-ink">Free</h3>
                <p className="text-sm text-wb-soft">Perfect for trying out the bot</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-semibold text-wb-ink">₹0</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '50 conversations / month',
                  '5 bot rules',
                  'Basic auto-reply',
                  'Email notifications',
                  'Community support',
                ].map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-wb-green" strokeWidth={2.5} />
                    <span className="text-wb-soft">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-200 bg-wb-green hover:bg-wb-dark text-white shadow-md hover:shadow-lg hover:shadow-wb-green/20"
              >
                Get Started
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </FadeIn>

          {/* Pro Plan - Coming Soon */}
          <FadeIn delay={120}>
            <CardContainer containerClassName="py-2">
              <CardBody className="relative group/card">
                <CardItem translateZ="30">
                  <div className="relative rounded-2xl p-8 h-full flex flex-col bg-gradient-to-br from-wb-green via-[#1ebe72] to-wb-dark text-white shadow-xl shadow-wb-green/20 ring-1 ring-white/10 group-hover/card:shadow-2xl group-hover/card:shadow-wb-green/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-wb-dark text-xs font-bold px-4 py-1 rounded-full shadow-md">
                      Coming Soon
                    </div>
                    <div className="mb-6">
                      <h3 className="font-serif text-xl mb-1 text-white">Pro</h3>
                      <p className="text-sm text-white/70">For growing businesses</p>
                    </div>
                    <div className="mb-8">
                      <AnimatedGradientText className="text-4xl font-semibold text-white">₹499</AnimatedGradientText>
                      <span className="text-sm text-white/60">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {[
                        'Unlimited conversations',
                        'Unlimited bot rules',
                        'AI-powered fallback',
                        'Analytics dashboard',
                        'Priority support',
                        'Custom branding',
                      ].map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-white/80" strokeWidth={2.5} />
                          <span className="text-white/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-200 bg-white text-wb-dark hover:bg-wb-bg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Coming Soon
                    </Link>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}



/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: 'Do I need technical skills to set this up?',
      a: 'Not at all. Just tell the bot your business details — prices, hours, location — through a simple chat interface. The AI handles the rest. Most businesses are live in under 5 minutes.',
    },
    {
      q: 'Will it work with my existing WhatsApp Business number?',
      a: 'Yes! WhatsAppBrain integrates with your current WhatsApp Business number. Your customers won\'t notice any difference — they\'ll just get faster replies.',
    },
    {
      q: 'What happens when the bot can\'t answer a question?',
      a: 'The bot automatically hands off to you. You\'ll get an email notification with the customer\'s name, phone number, and their last message so you can jump in immediately.',
    },
    {
      q: 'Is my data safe?',
      a: 'Absolutely. All conversations are encrypted, webhooks are verified with HMAC signatures, and we never share your data with third parties. We\'re GDPR-compliant.',
    },
    {
      q: 'Can I customize what the bot says?',
      a: 'Yes! You have full control. Set specific answers for specific questions, or let our AI generate responses based on your business information. You can edit any rule anytime.',
    },
    {
      q: 'What languages does it support?',
      a: 'WhatsAppBrain supports English, Hindi, and several Indian regional languages. Customers can chat in their preferred language and the bot understands and responds accordingly.',
    },
  ]
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wb-dark mb-3">FAQ</p>
          <h2 className="font-serif text-3xl md:text-4xl text-wb-ink tracking-tight">
            Frequently asked questions
          </h2>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <FadeIn key={i} delay={i * 60}>
              <FAQItem question={f.q} answer={f.a} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wb-green via-[#1ebe72] to-wb-dark p-10 md:p-16 text-center text-white shadow-2xl shadow-wb-green/20">
            {/* Background patterns */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-black/10 blur-2xl" />

            <div className="relative">
              <h2 className="font-serif text-3xl md:text-5xl tracking-tight mb-4 leading-tight">
                Stop losing customers<br className="hidden sm:block" /> to slow replies
              </h2>
              <p className="text-lg text-white/80 max-w-lg mx-auto mb-8 leading-relaxed">
                Never miss a WhatsApp message. Free to start, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-white text-wb-dark font-semibold px-8 py-4 rounded-xl hover:bg-wb-bg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium px-6 py-4 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-wb-line/50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-wb-green flex items-center justify-center shadow-sm shadow-wb-green/20">
                <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2} />
              </div>
              <span className="font-serif text-lg text-wb-ink tracking-tight">WhatsAppBrain</span>
            </div>
            <p className="text-sm text-wb-soft leading-relaxed max-w-xs">
              Smart WhatsApp auto-reply for small businesses. Never miss a customer again.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-wb-ink mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">How It Works</a></li>
              <li><a href="#faq" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-wb-ink mb-3">Account</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Log in</Link></li>
              <li><Link href="/signup" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Sign up</Link></li>
              <li><Link href="/dashboard" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-wb-ink mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/legal/privacy" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/cookies" className="text-sm text-wb-soft hover:text-wb-ink transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-wb-line/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-wb-soft">&copy; {new Date().getFullYear()} WhatsAppBrain. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-wb-soft">
            Made with <span className="text-wb-green">♥</span> for small businesses
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
