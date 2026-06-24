'use client'

import React, { useEffect, useRef } from 'react'
import { Bot, MessageSquare, Zap, ArrowRight, Sparkles, Shield, Globe } from 'lucide-react'
import { CardContainer, CardBody, CardItem } from '@/components/ui/three-d-card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { GlareCard } from '@/components/ui/glare-card'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { BackgroundBeams } from '@/components/ui/background-beams'

export function HeroSection() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className='relative min-h-screen overflow-hidden bg-gray-950'>
      {/* Cursor Glow Effect */}
      <div ref={cursorRef} className='cursor-glow' />

      {/* Background Beams */}
      <BackgroundBeams />

      {/* Mesh Gradient Overlay */}
      <div className='absolute inset-0 mesh-gradient opacity-50' />

      {/* Content */}
      <div className='relative z-10 container mx-auto px-4 py-20'>
        {/* Hero Text */}
        <div className='text-center mb-20'>
          <AnimatedGradientText className='text-6xl md:text-8xl font-bold mb-6 block'>
            WhatsAppBrain
          </AnimatedGradientText>
          <p className='text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto'>
            Your AI-powered WhatsApp assistant that never sleeps.
            <br />
            <span className='text-emerald-400'>Automate. Engage. Convert.</span>
          </p>
        </div>

        {/* 3D Feature Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20'>
          {/* Card 1: 3D Perspective Card */}
          <CardContainer containerClassName='py-4'>
            <CardBody className='relative group/card bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500'>
              {/* Gloss Effect */}
              <div className='absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-teal-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none' />

              <CardItem translateZ='50' className='mb-6'>
                <div className='w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30'>
                  <Bot className='w-7 h-7 text-white' />
                </div>
              </CardItem>

              <CardItem translateZ='40' className='text-xl font-bold text-white mb-3'>
                AI Auto-Reply
              </CardItem>

              <CardItem translateZ='30' className='text-gray-400 text-sm leading-relaxed mb-6'>
                Smart responses that understand context, sentiment, and intent. Your customers get instant, accurate answers 24/7.
              </CardItem>

              <CardItem translateZ='20' as='button' className='flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors'>
                Learn more <ArrowRight className='w-4 h-4' />
              </CardItem>
            </CardBody>
          </CardContainer>

          {/* Card 2: Spotlight Card */}
          <CardSpotlight className='rounded-3xl' radius={200} color='rgba(16,185,129,0.15)'>
            <div className='relative z-10 p-6'>
              <div className='w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6'>
                <MessageSquare className='w-7 h-7 text-white' />
              </div>

              <h3 className='text-xl font-bold text-white mb-3'>Smart Handoff</h3>

              <p className='text-gray-400 text-sm leading-relaxed mb-6'>
                When customers want to talk to a human, the AI instantly hands over with full conversation context.
              </p>

              <div className='flex items-center gap-2 text-teal-400 text-sm font-medium hover:text-teal-300 transition-colors cursor-pointer'>
                Learn more <ArrowRight className='w-4 h-4' />
              </div>
            </div>
          </CardSpotlight>

          {/* Card 3: Glare Card */}
          <GlareCard className='p-6'>
            <div className='w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6'>
              <Zap className='w-7 h-7 text-white' />
            </div>

            <h3 className='text-xl font-bold text-white mb-3'>Instant Setup</h3>

            <p className='text-gray-400 text-sm leading-relaxed mb-6'>
              Go live in under 5 minutes. No coding required. Just tell us about your business and we handle the rest.
            </p>

            <div className='flex items-center gap-2 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors cursor-pointer'>
              Learn more <ArrowRight className='w-4 h-4' />
            </div>
          </GlareCard>
        </div>

        {/* Stats Section with Animated Border */}
        <div className='max-w-4xl mx-auto border-beam rounded-3xl bg-gray-900/40 backdrop-blur-xl p-8 mb-20'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<3s', label: 'Response Time' },
              { value: '24/7', label: 'Availability' },
            ].map((stat) => (
              <div key={stat.label}>
                <AnimatedGradientText className='text-3xl md:text-4xl font-bold block mb-2'>
                  {stat.value}
                </AnimatedGradientText>
                <span className='text-gray-500 text-sm'>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Badges */}
        <div className='flex flex-wrap justify-center gap-4 mb-20'>
          {[
            { icon: Shield, text: 'Enterprise Security', color: 'emerald' },
            { icon: Globe, text: 'Multi-Language', color: 'teal' },
            { icon: Sparkles, text: 'AI-Powered', color: 'cyan' },
            { icon: Zap, text: 'Lightning Fast', color: 'blue' },
          ].map((badge) => (
            <div
              key={badge.text}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border border-${badge.color}-500/30 bg-${badge.color}-500/10 text-${badge.color}-400 text-sm font-medium animate-float`}
              style={{ animationDelay: `${Math.random() * 2}s` }}
            >
              <badge.icon className='w-4 h-4' />
              {badge.text}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className='text-center'>
          <div className='inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 cursor-pointer animate-glow'>
            <Sparkles className='w-5 h-5' />
            Start Free Trial
            <ArrowRight className='w-5 h-5' />
          </div>
          <p className='text-gray-500 text-sm mt-4'>No credit card required. Setup in 2 minutes.</p>
        </div>
      </div>
    </div>
  )
}
