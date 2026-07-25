import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { UserPlus, Search, GraduationCap, MapPin, School, Phone } from 'lucide-react'

interface Student {
  id: string
  name: string
  schoolName: string
  grade: string
  parentName: string
  parentMobile: string
  pickupAddress: string
  status: 'active' | 'pending' | 'suspended'
}

export const StudentRegistryPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const students: Student[] = [
    { id: 'STU-001', name: 'Aarav Mehta', schoolName: 'Delhi Public School', grade: 'Grade 5', parentName: 'Vikram Mehta', parentMobile: '+91 98765 43210', pickupAddress: 'Sector 15, Dwarka, Delhi', status: 'active' },
    { id: 'STU-002', name: 'Ishita Sen', schoolName: 'Heritage School', grade: 'Grade 8', parentName: 'Ananya Sen', parentMobile: '+91 99999 88888', pickupAddress: 'Vasant Kunj, New Delhi', status: 'active' },
    { id: 'STU-003', name: 'Kabir Kapoor', schoolName: 'Amity International', grade: 'Grade 3', parentName: 'Sanjay Kapoor', parentMobile: '+91 95555 12345', pickupAddress: 'Sakit, New Delhi', status: 'pending' },
    { id: 'STU-004', name: 'Riya Sharma', schoolName: 'Delhi Public School', grade: 'Grade 6', parentName: 'Preeti Sharma', parentMobile: '+91 97777 66666', pickupAddress: 'Rohini Sector 9, Delhi', status: 'suspended' }
  ]

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.schoolName.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'id',
      label: 'Student ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'name',
      label: 'Student Name',
      render: (val: string) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-850 dark:text-white text-left">
          <GraduationCap className="h-4 w-4 text-primary" />
          {val}
        </div>
      )
    },
    {
      key: 'schoolName',
      label: 'Associated School',
      render: (val: string, row: Student) => (
        <div className="text-left">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <School className="h-3.5 w-3.5 text-slate-400" />
            {val}
          </div>
          <span className="text-[9px] text-muted-foreground block mt-0.5">{row.grade}</span>
        </div>
      )
    },
    {
      key: 'parentName',
      label: 'Parent Contact',
      render: (val: string, row: Student) => (
        <div className="text-left text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">{val}</div>
          <div className="text-[9px] text-slate-500 flex items-center gap-0.5 mt-0.5 font-mono">
            <Phone className="h-2.5 w-2.5" />
            {row.parentMobile}
          </div>
        </div>
      )
    },
    {
      key: 'pickupAddress',
      label: 'Home Pickup Address',
      render: (val: string) => (
        <span className="text-[10px] text-slate-500 flex items-center gap-1 text-left max-w-xs truncate" title={val}>
          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
          {val}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => {
        const colors: Record<string, string> = {
          active: 'bg-emerald-50 border-emerald-150 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450',
          pending: 'bg-amber-50 border-amber-150 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
          suspended: 'bg-rose-50 border-rose-150 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 font-bold'
        }
        return (
          <span className={`px-2 py-0.5 rounded text-[8px] border uppercase font-black tracking-wider ${colors[val]}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert(`Editing student profile: ${row.name}`)}
          className="h-7 text-[10px] border-border font-bold text-slate-700"
        >
          <span>Modify</span>
        </Button>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Student Enrollment Registry"
        description="Enroll school students, manage active drop locations, and verify parent contact configurations."
        actions={
          <Button
            onClick={() => alert('New student enrollment flow')}
            className="gap-2 bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg"
          >
            <UserPlus className="h-4 w-4" /> Enrol Student
          </Button>
        }
      />

      <div className="space-y-6 text-left">
        {/* Search bar */}
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Active Students Sync</h3>
            <p className="text-[10px] text-muted-foreground">Detailed enrollment checklist for verified school transportation.</p>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student or school name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredStudents}
          selectable={false}
          resultLabel="enrolled students"
        />
      </div>
    </PageWrapper>
  )
}

export default StudentRegistryPage
