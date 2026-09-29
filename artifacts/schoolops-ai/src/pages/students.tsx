import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/shell';
import { Card, Badge, Button } from '@/components/ui';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useSchoolOperations } from '@/lib/school-scoped-data';

export default function Students() {
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [, setLocation] = useLocation();
  const operations = useSchoolOperations();
  const students = operations.data?.students ?? [];
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'all' || student.attendanceRisk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex items-center justify-between px-4 py-2 sm:px-6 sticky top-0 z-20">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Student Directory</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{operations.data?.source.label ?? 'Active-school data'}</Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {operations.isLoading && <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading active-school student records…</div>}
            {operations.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-destructive">Unable to load this school’s student records. No other-school data is shown. <Button variant="outline" className="ml-3" onClick={() => operations.refetch()}>Retry</Button></div>}
            {!operations.isLoading && !operations.isError && students.length === 0 && <div className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">No student records are available for this school.</div>}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                />
              </div>
              
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <span className="text-sm text-muted-foreground font-medium">Risk Filter:</span>
                <select 
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="min-h-11 flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:flex-none"
                >
                  <option value="all">All Risks</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => setLocation(`/students/${student.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setLocation(`/students/${student.id}`);
                    }
                  }}
                  className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{student.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{student.id} · Grade {student.grade}</div>
                    </div>
                    <Badge variant={student.enrollmentStatus === 'active' ? 'success' : student.enrollmentStatus === 'pending' ? 'warning' : 'secondary'} className="shrink-0 capitalize">
                      {student.enrollmentStatus}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-y py-3 text-sm">
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Attendance</div>
                      <div className="flex items-center gap-2 capitalize">
                        {student.attendanceRisk === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {student.attendanceRisk === 'medium' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {student.attendanceRisk === 'low' && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {student.attendanceRisk} · {student.attendanceRate}%
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</div>
                      <div className="capitalize">{student.tuitionStatus.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap gap-2">
                      {student.missingDocuments.length > 0 ? (
                        <Badge variant="destructive" className="gap-1"><FileText className="h-3 w-3" />{student.missingDocuments.length} missing</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Documents clear</span>
                      )}
                    </div>
                    <Link href={`/students/${student.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "min-h-10 shrink-0")}>View Record</Link>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium">Student</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Attendance Risk</th>
                      <th className="px-6 py-4 font-medium">Flags</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => setLocation(`/students/${student.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setLocation(`/students/${student.id}`);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{student.name}</span>
                            <span className="text-xs text-muted-foreground">{student.id} &bull; Grade {student.grade}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            student.enrollmentStatus === 'active' ? 'success' : 
                            student.enrollmentStatus === 'pending' ? 'warning' : 'secondary'
                          } className="capitalize">
                            {student.enrollmentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {student.attendanceRisk === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            {student.attendanceRisk === 'medium' && <AlertTriangle className="h-4 w-4 text-warning" />}
                            {student.attendanceRisk === 'low' && <CheckCircle2 className="h-4 w-4 text-success" />}
                            <span className="capitalize">{student.attendanceRisk}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {student.missingDocuments.length > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1.5">
                                <FileText className="h-3 w-3" />
                                {student.missingDocuments.length} Missing Doc{student.missingDocuments.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {student.tuitionStatus !== 'current' && (
                              <Badge variant="warning">{student.tuitionStatus === 'past_due' ? 'Past Due' : 'Payment Plan'}</Badge>
                            )}
                            {student.missingDocuments.length === 0 && student.tuitionStatus === 'current' && (
                              <span className="text-muted-foreground text-xs">Clear</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/students/${student.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>View Record</Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
