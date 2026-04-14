'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Target, Eye, Heart, Shield, Award, BookOpen, Monitor, Trophy, Bus, Library,
  FlaskConical, Music, Palette, Users, GraduationCap, CheckCircle2, Star, Quote
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const missionVisionValues = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To provide a nurturing and stimulating educational environment that empowers every student to achieve their full potential, fostering intellectual curiosity, creativity, and strong moral values that prepare them for global citizenship.',
    color: 'emerald',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description: 'To be a leading educational institution recognized for academic excellence, holistic development, and producing graduates who make meaningful contributions to society and become leaders in their chosen fields.',
    color: 'teal',
  },
  {
    icon: Heart,
    title: 'Our Core Values',
    description: 'Integrity, Excellence, Respect, Innovation, and Community. These values guide every aspect of our school culture, from classroom instruction to extracurricular activities and community engagement.',
    color: 'amber',
  },
]

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-100 text-teal-600', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
}

const leadership = [
  {
    name: 'Dr. Robert Williams',
    title: 'Principal',
    image: '/images/school/principal.png',
    bio: 'With over 20 years of experience in education leadership, Dr. Williams brings a vision of academic excellence and innovative teaching methodologies to Greenfield Academy.',
    qualifications: ['Ph.D. in Education', 'M.Ed. Leadership', 'National Board Certified'],
  },
  {
    name: 'Mrs. Emily Thompson',
    title: 'Vice Principal',
    image: '/images/school/vice-principal.png',
    bio: 'Mrs. Thompson is dedicated to student welfare and academic programs, bringing 15 years of educational experience and a passion for creating inclusive learning environments.',
    qualifications: ['M.Ed. Curriculum Design', 'B.Ed. Science', 'Certified Counselor'],
  },
]

const facilities = [
  { icon: Monitor, title: 'Smart Classrooms', description: 'Interactive whiteboards, projectors, and digital learning tools in every classroom.' },
  { icon: Library, title: 'Library & Media Center', description: 'Over 15,000 books, digital resources, e-books, and dedicated study areas.' },
  { icon: FlaskConical, title: 'Science Labs', description: 'Fully equipped physics, chemistry, and biology laboratories for hands-on learning.' },
  { icon: Trophy, title: 'Sports Complex', description: 'Multi-purpose sports hall, swimming pool, football field, and athletic tracks.' },
  { icon: Monitor, title: 'Computer Lab', description: 'Modern computer lab with high-speed internet and latest software.' },
  { icon: Music, title: 'Music Room', description: 'Dedicated music room with instruments for band and orchestra programs.' },
  { icon: Palette, title: 'Art Studio', description: 'Spacious art studio for painting, sculpture, and creative arts.' },
  { icon: Bus, title: 'Transportation', description: 'GPS-enabled buses covering all major routes with trained drivers.' },
]

const accreditations = [
  'National Accreditation Board',
  'International Baccalaureate Candidate',
  'STEM Certified School',
  'Green School Award',
  'National Safety Council Certified',
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-white/20 text-white hover:bg-white/30 mb-6 px-4 py-1.5 border-0">
            About Us
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Our Story, Our <span className="text-emerald-200">Legacy</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Discover the rich history, values, and people that make Greenfield Academy a beacon of educational excellence.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* History */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">Our History</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                A Tradition of <span className="text-emerald-600">Excellence Since 1999</span>
              </h2>
              <div className="space-y-4 text-slate-500 leading-relaxed">
                <p>
                  Greenfield Academy was founded in 1999 with a simple yet powerful vision: to create an educational institution that nurtures not just academic excellence, but the holistic development of every child.
                </p>
                <p>
                  What began as a small school with just 50 students and 8 teachers has grown into a thriving educational community of over 1,500 students and 120 dedicated educators. Our journey has been marked by continuous innovation, unwavering commitment to quality, and countless success stories.
                </p>
                <p>
                  Over the past 25 years, we have consistently maintained a 98% pass rate, produced national merit scholars, and our alumni have gone on to attend prestigious universities around the world.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { value: '1999', label: 'Founded' },
                  { value: '1,500+', label: 'Students' },
                  { value: '120+', label: 'Teachers' },
                  { value: '98%', label: 'Pass Rate' },
                ].map(stat => (
                  <div key={stat.label} className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full bg-emerald-100 rounded-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/school/facilities.png"
                  alt="School campus and facilities"
                  width={1344}
                  height={768}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              What Guides Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Mission, Vision & <span className="text-emerald-600">Values</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {missionVisionValues.map(item => {
              const colors = colorMap[item.color]
              return (
                <Card key={item.title} className={`${colors.bg} border-${item.color}/20 hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-6 lg:p-8">
                    <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center mb-5`}>
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Leadership
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Meet Our <span className="text-emerald-600">Leaders</span>
            </h2>
            <p className="text-lg text-slate-500 mt-4">Experienced educators dedicated to shaping the future.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {leadership.map(person => (
              <Card key={person.name} className="border-slate-200/60 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64">
                  <Image
                    src={person.image}
                    alt={person.name}
                    width={1024}
                    height={1024}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-xl font-bold text-white">{person.name}</h3>
                    <p className="text-emerald-300 font-medium text-sm">{person.title}</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{person.bio}</p>
                  <div className="space-y-2">
                    {person.qualifications.map(q => (
                      <div key={q} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{q}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Our Campus
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              World-Class <span className="text-emerald-600">Facilities</span>
            </h2>
            <p className="text-lg text-slate-500 mt-4">Modern infrastructure to support every aspect of learning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map(f => (
              <Card key={f.title} className="border-slate-200/60 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditations */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Recognitions
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Accreditations & <span className="text-emerald-600">Awards</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {accreditations.map(acc => (
              <div key={acc} className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{acc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Join Our Family?
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Take the first step toward an exceptional education. Contact us today to schedule a campus tour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admission">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl min-h-[52px] px-8 font-semibold">
                Apply Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 min-h-[52px] px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
