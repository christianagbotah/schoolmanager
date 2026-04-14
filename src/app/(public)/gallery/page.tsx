'use client'

import { useState, useEffect } from 'react'
import { Camera, X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'

interface GalleryImage {
  frontend_gallery_image_id: number
  gallery_id: number
  image_name: string
  caption: string
  date: string | null
}

interface Gallery {
  frontend_gallery_id: number
  title: string
  description: string
  date: string | null
  timestamp: string | null
  images: GalleryImage[]
}

export default function GalleryPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ src: string; caption: string; index: number; gallery: Gallery } | null>(null)
  const [filterGallery, setFilterGallery] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/frontend/gallery')
      .then(res => res.json())
      .then(data => {
        setGalleries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Collect all images for the lightbox
  const filteredGalleries = filterGallery ? galleries.filter(g => g.frontend_gallery_id === filterGallery) : galleries
  const allImages = filteredGalleries.flatMap(g =>
    g.images.map(img => ({
      src: img.image_name || '',
      caption: img.caption || g.title,
      gallery: g,
    }))
  )

  const openLightbox = (gallery: Gallery, index: number) => {
    const img = gallery.images[index]
    if (img) {
      setSelectedImage({
        src: img.image_name || '',
        caption: img.caption || gallery.title,
        index: index,
        gallery: gallery,
      })
    }
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return
    const images = selectedImage.gallery.images
    let newIndex = direction === 'next' ? selectedImage.index + 1 : selectedImage.index - 1
    if (newIndex < 0) newIndex = images.length - 1
    if (newIndex >= images.length) newIndex = 0
    const img = images[newIndex]
    setSelectedImage({
      src: img.image_name || '',
      caption: img.caption || selectedImage.gallery.title,
      index: newIndex,
      gallery: selectedImage.gallery,
    })
  }

  // Placeholder colors for gallery images
  const placeholderColors = [
    'from-emerald-200 to-teal-200',
    'from-emerald-300 to-cyan-200',
    'from-teal-200 to-emerald-300',
    'from-emerald-100 to-teal-100',
    'from-emerald-300 to-emerald-100',
    'from-teal-100 to-emerald-200',
  ]

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
            Photo Gallery
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Our <span className="text-emerald-200">Gallery</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Explore the vibrant moments and memories from our school life.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Gallery filters */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filterGallery === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterGallery(null)}
              className={filterGallery === null ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200'}
            >
              All Albums
            </Button>
            {galleries.map(g => (
              <Button
                key={g.frontend_gallery_id}
                variant={filterGallery === g.frontend_gallery_id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterGallery(g.frontend_gallery_id)}
                className={filterGallery === g.frontend_gallery_id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200'}
              >
                {g.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : allImages.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-500 mb-2">No photos yet</h3>
              <p className="text-slate-400">Check back soon for new gallery uploads.</p>
            </div>
          ) : (
            filteredGalleries.map(gallery => (
              <div key={gallery.frontend_gallery_id} className="mb-10">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{gallery.title}</h2>
                  {gallery.description && (
                    <p className="text-slate-500 mt-1">{gallery.description}</p>
                  )}
                  {gallery.date && (
                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(gallery.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.images.map((img, idx) => (
                    <button
                      key={img.frontend_gallery_image_id}
                      onClick={() => openLightbox(gallery, idx)}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${placeholderColors[idx % placeholderColors.length]}`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Camera className="w-8 h-8 text-emerald-400 mb-2" />
                        <span className="text-xs text-emerald-600 font-medium text-center px-2 line-clamp-2">
                          {img.caption || gallery.title}
                        </span>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-emerald-700" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-slate-700 overflow-hidden">
          <DialogTitle className="sr-only">Image Viewer</DialogTitle>
          {selectedImage && (
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation */}
              {selectedImage.gallery.images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image placeholder */}
              <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px] bg-gradient-to-br from-emerald-900 to-teal-900">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
                  <p className="text-emerald-200 font-medium">{selectedImage.caption}</p>
                </div>
              </div>

              {/* Caption bar */}
              <div className="bg-black/80 p-4 text-center">
                <p className="text-white text-sm">{selectedImage.caption}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {selectedImage.index + 1} of {selectedImage.gallery.images.length} — {selectedImage.gallery.title}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
