'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Event {
  frontend_events_id: number
  title: string
  description: string
  date: string | null
  timestamp: string | null
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetch('/api/frontend/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
    const now = new Date()
    const eventDate = e.date ? new Date(e.date) : null

    if (filter === 'upcoming' && eventDate && eventDate < now) return false
    if (filter === 'past' && eventDate && eventDate >= now) return false

    return matchesSearch
  })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-white/20 text-white hover:bg-white/30 mb-6 px-4 py-1.5 border-0">
            School Events
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Events & <span className="text-emerald-200">Activities</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Stay updated with all the exciting events, activities, and celebrations at Greenfield Academy.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400" />
              {(['all', 'upcoming', 'past'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200'}
                >
                  {f === 'all' ? 'All Events' : f === 'upcoming' ? 'Upcoming' : 'Past'}
                </Button>
              ))}
              <Badge variant="secondary" className="ml-2">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[40px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-500 mb-2">No events found</h3>
              <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map(event => {
                const eventDate = event.date ? new Date(event.date) : null
                const isUpcoming = eventDate && eventDate >= new Date()

                return (
                  <Card key={event.frontend_events_id} className="border-slate-200/60 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Date block */}
                        <div className={`p-6 sm:p-8 flex flex-col items-center justify-center min-w-[140px] ${isUpcoming ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 ${isUpcoming ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                            <Calendar className="w-8 h-8 text-white" />
                          </div>
                          <p className={`text-3xl font-bold ${isUpcoming ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {eventDate ? eventDate.getDate() : '--'}
                          </p>
                          <p className={`text-sm font-medium ${isUpcoming ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {eventDate ? eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'No date'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'long' }) : ''}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 sm:p-8">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                            {isUpcoming && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex-shrink-0">Upcoming</Badge>
                            )}
                          </div>
                          <p className="text-slate-500 leading-relaxed mb-4">{event.description || 'No description available.'}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            {eventDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              Greenfield Academy
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
