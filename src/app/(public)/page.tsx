'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  GraduationCap, BookOpen, Bus, Library, Trophy, Monitor, Palette,
  ArrowRight, Calendar, Clock, ChevronLeft, ChevronRight, Users,
  Star, Quote, MapPin, Phone, Mail, Send, Sparkles, TrendingUp, Heart,
  Award, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ===== Types =====
interface Event {
  frontend_events_id: number
  title: string
  description: string
  date: string | null
  timestamp: string | null
}

interface News {
  frontend_news_id: number
  title: string
  description: string
  date: string | null
  timestamp: string | null
}

// ===== Animated Counter =====
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let current = 0
    const increment = target / 60
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target])

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>
}

// ===== Hero Section =====
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute top-40 right-20 w-32 h-32 bg-white/5 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/3 w-16 h-16 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <Badge className="bg-white/20 text-white hover:bg-white/30 mb-6 px-4 py-1.5 text-sm border-0">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Admissions Open 2025-2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Shaping the
              <span className="block text-emerald-200">Leaders of Tomorrow</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              At Greenfield Academy, we cultivate curiosity, character, and creativity in every student. Join a community where excellence is a tradition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/admission">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl hover:shadow-2xl transition-all min-h-[52px] text-base font-semibold px-8">
                  Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 min-h-[52px] text-base px-8">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Quick stats on hero */}
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto lg:mx-0">
              {[
                { value: 25, suffix: '+', label: 'Years' },
                { value: 1500, suffix: '+', label: 'Students' },
                { value: 98, suffix: '%', label: 'Pass Rate' },
              ].map(stat => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-emerald-200 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-white/10 rounded-3xl rotate-3" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/school/hero.png"
                  alt="Greenfield Academy campus"
                  width={1344}
                  height={768}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Top Rated</p>
                    <p className="text-xs text-slate-500">School in the Region</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}

// ===== Features Section =====
const features = [
  { icon: BookOpen, title: 'Academics', description: 'Rigorous curriculum with experienced faculty fostering critical thinking and intellectual growth.', color: 'emerald' },
  { icon: Bus, title: 'Transport', description: 'Safe and reliable transportation services covering all major routes in the city.', color: 'teal' },
  { icon: Library, title: 'Library', description: 'Extensive collection of books, digital resources, and a quiet space for study and research.', color: 'amber' },
  { icon: Trophy, title: 'Sports', description: 'Comprehensive sports program with professional coaching and modern athletic facilities.', color: 'orange' },
  { icon: Monitor, title: 'Technology', description: 'Smart classrooms with modern IT infrastructure and digital learning tools.', color: 'cyan' },
  { icon: Palette, title: 'Extra-Curricular', description: 'Diverse clubs and activities to develop creativity, leadership, and teamwork skills.', color: 'rose' },
]

function FeaturesSection() {
  const colorMap: Record<string, { bg: string; icon: string; hover: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', hover: 'hover:border-emerald-300 group-hover:bg-emerald-50' },
    teal: { bg: 'bg-teal-50', icon: 'bg-teal-100 text-teal-600', hover: 'hover:border-teal-300 group-hover:bg-teal-50' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-300 group-hover:bg-amber-50' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', hover: 'hover:border-orange-300 group-hover:bg-orange-50' },
    cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-100 text-cyan-600', hover: 'hover:border-cyan-300 group-hover:bg-cyan-50' },
    rose: { bg: 'bg-rose-50', icon: 'bg-rose-100 text-rose-600', hover: 'hover:border-rose-300 group-hover:bg-rose-50' },
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
            Why Choose Us
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            What Makes Us <span className="text-emerald-600">Exceptional</span>
          </h2>
          <p className="text-lg text-slate-500">
            We provide a holistic educational experience that nurtures every aspect of a student&apos;s development.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map(feature => {
            const colors = colorMap[feature.color]
            return (
              <Card
                key={feature.title}
                className={`border-slate-200/60 hover:shadow-xl transition-all duration-300 group cursor-pointer ${colors.hover}`}
              >
                <CardContent className="p-6 lg:p-8">
                  <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ===== About Section =====
function AboutSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-full h-full bg-emerald-200 rounded-2xl" />
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/school/about.png"
                alt="School library and learning environment"
                width={864}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Stats overlay */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-5 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">25+</p>
                  <p className="text-sm text-slate-500">Years of Excellence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              About Our School
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              A Legacy of <span className="text-emerald-600">Academic Excellence</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Founded in 1999, Greenfield Academy has been at the forefront of educational innovation. Our commitment to academic rigor, character development, and holistic growth has earned us recognition as one of the leading educational institutions in the region.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              We believe every child is unique with immense potential waiting to be unlocked. Our experienced faculty, modern facilities, and supportive environment create the perfect ecosystem for students to thrive academically and personally.
            </p>

            {/* Key points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                'State-of-the-art facilities',
                'Experienced & certified faculty',
                'Small class sizes',
                'Comprehensive curriculum',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/about">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Discover More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===== Statistics Section =====
function StatisticsSection() {
  const stats = [
    { icon: Users, value: 1500, suffix: '+', label: 'Students Enrolled', color: 'emerald' },
    { icon: GraduationCap, value: 120, suffix: '+', label: 'Qualified Teachers', color: 'teal' },
    { icon: BookOpen, value: 45, suffix: '+', label: 'Classes & Sections', color: 'amber' },
    { icon: Award, value: 25, suffix: '+', label: 'Years of Excellence', color: 'orange' },
  ]

  const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    teal: 'bg-teal-100 text-teal-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className={`w-16 h-16 ${iconBg[stat.color]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-emerald-100 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ===== Events Section =====
function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/frontend/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.slice(0, 4))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const upcomingEvents = events.filter(e => new Date(e.date || '') >= new Date()).slice(0, 3)
  const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 3)

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Upcoming Events
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              What&apos;s <span className="text-emerald-600">Happening</span>
            </h2>
          </div>
          <Link href="/events" className="mt-4 sm:mt-0">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              View All Events <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : displayEvents.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">No events yet</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon for upcoming events</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayEvents.map(event => (
              <Card key={event.frontend_events_id} className="border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-0">
                  {/* Date header */}
                  <div className="bg-emerald-50 p-4 flex items-center gap-4">
                    <div className="bg-emerald-600 text-white rounded-xl p-3 text-center min-w-[64px]">
                      <p className="text-2xl font-bold leading-none">
                        {event.date ? new Date(event.date).getDate() : '--'}
                      </p>
                      <p className="text-xs mt-1 text-emerald-200">
                        {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Clock className="w-4 h-4" />
                      <span>{event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' }) : ''}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ===== News Section =====
function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/frontend/news')
      .then(res => res.json())
      .then(data => {
        setNews(data.slice(0, 3))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Latest News
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              School <span className="text-emerald-600">News & Updates</span>
            </h2>
          </div>
          <Link href="/noticeboard" className="mt-4 sm:mt-0">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              All Updates <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">No news yet</p>
              <p className="text-sm text-slate-400 mt-1">Stay tuned for the latest updates</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map(item => (
              <Card key={item.frontend_news_id} className="border-slate-200/60 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all" />
                  <GraduationCap className="w-16 h-16 text-emerald-300 group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-emerald-600 font-medium mb-2">
                    {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                  </p>
                  <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{item.description}</p>
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ===== Testimonials Section =====
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Parent of 2 students',
    text: 'Greenfield Academy has been a transformative experience for our children. The teachers are dedicated, the curriculum is challenging yet supportive, and the school community is incredibly welcoming.',
    rating: 5,
  },
  {
    name: 'David Chen',
    role: 'Alumni, Class of 2022',
    text: 'The foundation I built at Greenfield Academy prepared me exceptionally well for university. The critical thinking skills and values I learned here continue to guide me every day.',
    rating: 5,
  },
  {
    name: 'Maria Rodriguez',
    role: 'Parent',
    text: 'What sets Greenfield apart is the genuine care for each student\'s individual growth. My daughter has flourished both academically and in her extracurricular pursuits.',
    rating: 5,
  },
]

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            What People <span className="text-emerald-600">Say About Us</span>
          </h2>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 lg:p-8">
                <Quote className="w-10 h-10 text-emerald-200 mb-4" />
                <p className="text-slate-600 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{t.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <Card className="border-slate-200/60">
            <CardContent className="p-6">
              <Quote className="w-10 h-10 text-emerald-200 mb-4" />
              <p className="text-slate-600 leading-relaxed mb-6 italic">&ldquo;{testimonials[current].text}&rdquo;</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonials[current].rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {testimonials[current].name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{testimonials[current].name}</p>
                  <p className="text-xs text-slate-500">{testimonials[current].role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="icon" onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)} className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-emerald-600 w-6' : 'bg-slate-300'}`} aria-label={`Go to testimonial ${i + 1}`} />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)} className="rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===== Contact Section =====
function ContactSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
            Get In Touch
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Contact <span className="text-emerald-600">Us Today</span>
          </h2>
          <p className="text-lg text-slate-500">Have questions? We&apos;d love to hear from you.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact info cards */}
          <div className="space-y-6">
            {[
              { icon: MapPin, title: 'Visit Us', content: '123 Education Lane, Academic City, AC 12345', color: 'emerald' },
              { icon: Phone, title: 'Call Us', content: '+1 (555) 123-4567\n+1 (555) 987-6543', color: 'teal' },
              { icon: Mail, title: 'Email Us', content: 'info@greenfieldacademy.edu\nadmissions@greenfieldacademy.edu', color: 'amber' },
            ].map(item => {
              const iconBg: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-600',
                teal: 'bg-teal-100 text-teal-600',
                amber: 'bg-amber-100 text-amber-600',
              }
              return (
                <Card key={item.title} className="border-slate-200/60 hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className={`w-12 h-12 ${iconBg[item.color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      {item.content.split('\n').map((line, i) => (
                        <p key={i} className="text-sm text-slate-500">{line}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Map placeholder */}
            <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center border border-slate-200">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-600 font-medium">Interactive Map</p>
                <p className="text-xs text-emerald-500">123 Education Lane</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <Card className="border-slate-200/60">
            <CardContent className="p-6 lg:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Send us a Message</h3>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full Name</Label>
                    <Input id="contact-name" placeholder="John Doe" className="min-h-[44px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" placeholder="john@example.com" className="min-h-[44px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input id="contact-subject" placeholder="How can we help?" className="min-h-[44px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" placeholder="Write your message here..." rows={5} className="min-h-[100px] resize-none" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// ===== CTA Section =====
function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Heart className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Join Our Community?
        </h2>
        <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
          Give your child the gift of quality education. Admissions are now open for the 2025-2026 academic year. Apply today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admission">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl min-h-[52px] text-base font-semibold px-8">
              Apply for Admission <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 min-h-[52px] text-base px-8">
              Schedule a Visit
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ===== Main Homepage =====
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <StatisticsSection />
      <EventsSection />
      <NewsSection />
      <TestimonialsSection />
      <ContactSection />
      <CTASection />
    </>
  )
}
