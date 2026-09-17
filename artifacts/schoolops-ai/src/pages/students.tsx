import React, { useState } from 'react';
import { Sidebar, TopHeader } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Search, Filter, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SYNTHETIC_STUDENTS } from '@/data/school-data';

export default function Students() {
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  
  const filteredStudents = SYNTHETIC_STUDENTS.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'all' || student.attendanceRisk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight">Student Directory</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Synthetic Data</Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
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
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Risk Filter:</span>
                <select 
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Risks</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>

            <Card>
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
                      <tr key={student.id} className="hover:bg-muted/50 transition-colors">
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
                          <Button variant="ghost" size="sm">View Record</Button>
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
