'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Search, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Notice {
  id: number
  title: string
  notice: string
  timestamp: string | null
}

const ITEMS_PER_PAGE = 8

export default function NoticeboardPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        setNotices(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPage(1) // eslint-disable-line react-hooks/set-state-in-effect
  }, [search])

  const filtered = notices.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.notice.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedNotices = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
            Noticeboard
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            School <span className="text-emerald-200">Notices</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Stay informed with the latest announcements, circulars, and important updates from the school.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Search & Results */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-slate-500">
                Showing {paginatedNotices.length} of {filtered.length} notice{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search notices..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 min-h-[40px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Notices List */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-500 mb-2">No notices found</h3>
              <p className="text-slate-400">Check back later for new announcements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotices.map(notice => (
                <Card key={notice.id} className="border-slate-200/60 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-6 h-6 text-emerald-600" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{notice.title}</h3>
                          {notice.timestamp && (
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(notice.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{notice.notice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={p === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white min-w-[36px]' : 'border-slate-200 min-w-[36px]'}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-slate-200"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
