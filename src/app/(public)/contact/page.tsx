'use client'

import { useState } from 'react'
import {
  MapPin, Phone, Mail, Clock, Send, MessageSquare, CheckCircle2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const contactInfo = [
  {
    icon: MapPin,
    title: 'Our Address',
    details: ['123 Education Lane', 'Academic City, AC 12345'],
    color: 'emerald',
  },
  {
    icon: Phone,
    title: 'Phone Numbers',
    details: ['+1 (555) 123-4567 (Main)', '+1 (555) 987-6543 (Admissions)'],
    color: 'teal',
  },
  {
    icon: Mail,
    title: 'Email Address',
    details: ['info@greenfieldacademy.edu', 'admissions@greenfieldacademy.edu'],
    color: 'amber',
  },
  {
    icon: Clock,
    title: 'Working Hours',
    details: ['Monday - Friday: 7:30 AM - 4:00 PM', 'Saturday: 8:00 AM - 12:00 PM'],
    color: 'orange',
  },
]

const iconBg: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-600',
  teal: 'bg-teal-100 text-teal-600',
  amber: 'bg-amber-100 text-amber-600',
  orange: 'bg-orange-100 text-orange-600',
}

const departments = [
  { name: 'Admissions Office', phone: '+1 (555) 123-4567', email: 'admissions@greenfieldacademy.edu' },
  { name: 'Academic Affairs', phone: '+1 (555) 123-4568', email: 'academic@greenfieldacademy.edu' },
  { name: 'Finance Department', phone: '+1 (555) 123-4569', email: 'finance@greenfieldacademy.edu' },
  { name: 'Student Affairs', phone: '+1 (555) 123-4570', email: 'studentaffairs@greenfieldacademy.edu' },
  { name: 'Transport Department', phone: '+1 (555) 123-4571', email: 'transport@greenfieldacademy.edu' },
]

export default function ContactPage() {
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }
    setSubmitted(true)
    toast({ title: 'Success', description: 'Your message has been sent. We\'ll get back to you soon!' })
  }

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
            Contact Us
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Get In <span className="text-emerald-200">Touch</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            We&apos;d love to hear from you. Whether you have a question, feedback, or just want to say hello.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map(item => (
              <Card key={item.title} className="border-slate-200/60 hover:shadow-lg transition-shadow">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className={`w-12 h-12 ${iconBg[item.color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                    {item.details.map(d => (
                      <p key={d} className="text-sm text-slate-500">{d}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <Card className="border-slate-200/60">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Send a Message</h2>
                    <p className="text-sm text-slate-500">We&apos;ll respond within 24 hours</p>
                  </div>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-slate-500 mb-6">Thank you for reaching out. We&apos;ll get back to you shortly.</p>
                    <Button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }} variant="outline" className="border-emerald-200 text-emerald-700">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="c-name">Full Name *</Label>
                        <Input
                          id="c-name"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-email">Email Address *</Label>
                        <Input
                          id="c-email"
                          type="email"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="c-phone">Phone Number</Label>
                        <Input
                          id="c-phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-subject">Subject</Label>
                        <Input
                          id="c-subject"
                          placeholder="How can we help?"
                          value={form.subject}
                          onChange={e => setForm({ ...form, subject: e.target.value })}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-message">Message *</Label>
                      <Textarea
                        id="c-message"
                        placeholder="Write your message here..."
                        rows={5}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]">
                      <Send className="w-4 h-4 mr-2" /> Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Map & Departments */}
            <div className="space-y-6">
              {/* Map placeholder */}
              <div className="h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-emerald-600">Interactive Map</p>
                  <p className="text-sm text-emerald-500">123 Education Lane, Academic City</p>
                </div>
              </div>

              {/* Department contacts */}
              <Card className="border-slate-200/60">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Department Contacts</h3>
                  <div className="space-y-4">
                    {departments.map(dept => (
                      <div key={dept.name} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{dept.name}</p>
                          <p className="text-xs text-slate-500">{dept.phone}</p>
                          <p className="text-xs text-emerald-600">{dept.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
