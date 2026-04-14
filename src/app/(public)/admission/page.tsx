'use client'

import { useState } from 'react'
import {
  GraduationCap, FileText, CheckCircle2, AlertCircle, User, Calendar, BookOpen, Phone, Mail
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const requirements = [
  { title: 'Age Requirement', description: 'Students must meet the minimum age requirement for their applied class level.' },
  { title: 'Previous School Records', description: 'Transcripts and report cards from the previous school are required for evaluation.' },
  { title: 'Birth Certificate', description: 'A certified copy of the student\'s birth certificate must be submitted.' },
  { title: 'Passport Photos', description: 'Four recent passport-sized photographs of the student.' },
  { title: 'Health Records', description: 'Up-to-date immunization records and a recent health check-up report.' },
  { title: 'Parent/Guardian ID', description: 'Valid identification of parent or legal guardian.' },
]

const classOptions = [
  'Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'JHS 1', 'JHS 2', 'JHS 3',
]

export default function AdmissionPage() {
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    studentName: '',
    dob: '',
    gender: '',
    previousSchool: '',
    classApplied: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    address: '',
    agreeTerms: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentName || !form.dob || !form.gender || !form.classApplied || !form.parentName || !form.parentPhone) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }
    if (!form.agreeTerms) {
      toast({ title: 'Error', description: 'Please agree to the terms and conditions', variant: 'destructive' })
      return
    }
    setSubmitted(true)
    toast({ title: 'Application Submitted!', description: 'We will review your application and get back to you shortly.' })
  }

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
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
            Admissions 2025-2026
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Join Our <span className="text-emerald-200">Academy</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
            Begin your child&apos;s journey to excellence. Admissions are now open for the upcoming academic year.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 30C840 40 960 50 1080 48C1200 46 1320 32 1380 25L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Admission Requirements
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              What You&apos;ll <span className="text-emerald-600">Need</span>
            </h2>
            <p className="text-lg text-slate-500 mt-4">Please prepare the following documents for a smooth admission process.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirements.map(req => (
              <Card key={req.title} className="border-slate-200/60 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{req.title}</h3>
                    <p className="text-sm text-slate-500">{req.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Admission Form */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 mb-4">
              Online Application
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Admission <span className="text-emerald-600">Form</span>
            </h2>
            <p className="text-lg text-slate-500 mt-4">Fill out the form below to begin the application process.</p>
          </div>

          {submitted ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h3>
                <p className="text-slate-500 mb-2">
                  Thank you for your interest in Greenfield Academy. We have received your application for <strong>{form.studentName}</strong>.
                </p>
                <p className="text-slate-500 mb-8">
                  Our admissions team will review your application and contact you within 5-7 business days.
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false)
                    setForm({
                      studentName: '', dob: '', gender: '', previousSchool: '',
                      classApplied: '', parentName: '', parentPhone: '', parentEmail: '',
                      parentOccupation: '', address: '', agreeTerms: false,
                    })
                  }}
                  variant="outline"
                  className="border-emerald-200 text-emerald-700"
                >
                  Submit Another Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200/60">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Student Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Student Information</h3>
                    </div>
                    <div className="space-y-4 pl-10">
                      <div className="space-y-2">
                        <Label htmlFor="s-name">Student Full Name *</Label>
                        <Input
                          id="s-name"
                          placeholder="Enter student's full name"
                          value={form.studentName}
                          onChange={e => updateField('studentName', e.target.value)}
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="s-dob">Date of Birth *</Label>
                          <Input
                            id="s-dob"
                            type="date"
                            value={form.dob}
                            onChange={e => updateField('dob', e.target.value)}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s-gender">Gender *</Label>
                          <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s-class">Class Applied For *</Label>
                          <Select value={form.classApplied} onValueChange={v => updateField('classApplied', v)}>
                            <SelectTrigger className="min-h-[44px]">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classOptions.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s-prev-school">Previous School</Label>
                        <Input
                          id="s-prev-school"
                          placeholder="Name of previous school (if applicable)"
                          value={form.previousSchool}
                          onChange={e => updateField('previousSchool', e.target.value)}
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent/Guardian Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Parent / Guardian Information</h3>
                    </div>
                    <div className="space-y-4 pl-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="p-name">Parent/Guardian Name *</Label>
                          <Input
                            id="p-name"
                            placeholder="Enter full name"
                            value={form.parentName}
                            onChange={e => updateField('parentName', e.target.value)}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="p-phone">Phone Number *</Label>
                          <Input
                            id="p-phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={form.parentPhone}
                            onChange={e => updateField('parentPhone', e.target.value)}
                            className="min-h-[44px]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="p-email">Email Address</Label>
                          <Input
                            id="p-email"
                            type="email"
                            placeholder="parent@example.com"
                            value={form.parentEmail}
                            onChange={e => updateField('parentEmail', e.target.value)}
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="p-occupation">Occupation</Label>
                          <Input
                            id="p-occupation"
                            placeholder="Enter occupation"
                            value={form.parentOccupation}
                            onChange={e => updateField('parentOccupation', e.target.value)}
                            className="min-h-[44px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p-address">Residential Address</Label>
                        <Textarea
                          id="p-address"
                          placeholder="Enter full address"
                          rows={3}
                          value={form.address}
                          onChange={e => updateField('address', e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={form.agreeTerms}
                        onCheckedChange={checked => updateField('agreeTerms', checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                        I confirm that all information provided is accurate and complete. I understand that any false information may result in the rejection of this application. I agree to the school&apos;s admission policies, terms, and conditions.
                      </Label>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[52px] text-base font-semibold"
                  >
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Process steps */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Admission <span className="text-emerald-600">Process</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Submit Application', description: 'Fill out the online application form with all required information.' },
              { step: '2', title: 'Document Review', description: 'Our admissions team will review your application and documents.' },
              { step: '3', title: 'Assessment', description: 'Students may be required to take an entrance assessment.' },
              { step: '4', title: 'Enrollment', description: 'Upon acceptance, complete the enrollment process and welcome aboard!' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
