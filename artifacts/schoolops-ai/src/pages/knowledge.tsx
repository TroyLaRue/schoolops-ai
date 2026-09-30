import React, { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/shell';
import { 
  Badge, Button, Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useCreatePolicyDocument, 
  useUpdatePolicyDocument, 
  useDeletePolicyDocument, 
  getListPolicyDocumentsQueryKey, 
  type PolicyDocument 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, FileText, Upload, Trash2, Edit, RefreshCw, Archive, ArchiveRestore, BookOpen, AlertCircle, FileLock2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSchoolPolicyDocuments } from '@/lib/school-scoped-data';

export default function Knowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const policyQuery = useSchoolPolicyDocuments();
  const { data: documents = [], isLoading, error, refetch } = policyQuery;
  const createDoc = useCreatePolicyDocument();
  const updateDoc = useUpdatePolicyDocument();
  const deleteDoc = useDeletePolicyDocument();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PolicyDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PolicyDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'procedure',
    version: '1.0',
    description: '',
    content: '',
    filename: '',
    mimeType: 'text/plain',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'procedure',
      version: '1.0',
      description: '',
      content: '',
      filename: '',
      mimeType: 'text/plain',
    });
    setEditingDoc(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc: PolicyDocument) => {
    setFormData({
      title: doc.title,
      category: doc.category,
      version: doc.version,
      description: doc.description,
      content: doc.content,
      filename: doc.filename || '',
      mimeType: doc.mimeType,
    });
    setEditingDoc(doc);
    setIsAddOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast({ 
        title: "Unsupported file type", 
        description: "Only .txt and .md files are supported. Binary PDF upload is not supported in this demo.",
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        mimeType: file.name.endsWith('.md') ? 'text/markdown' : 'text/plain',
        content: text
      }));
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({ title: 'Missing fields', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }
    
    if (editingDoc) {
      updateDoc.mutate({
        id: editingDoc.id,
        data: {
          title: formData.title,
          category: formData.category as any,
          version: formData.version,
          description: formData.description,
          content: formData.content,
          syntheticDataOnly: true,
        }
      }, {
        onSuccess: () => {
          toast({ title: 'Document updated successfully' });
          queryClient.invalidateQueries({ queryKey: getListPolicyDocumentsQueryKey() });
          setIsAddOpen(false);
        },
        onError: () => {
          toast({ title: 'Update failed', variant: 'destructive' });
        }
      });
    } else {
      createDoc.mutate({
        data: {
          title: formData.title,
          category: formData.category as any,
          version: formData.version,
          description: formData.description || 'Uploaded synthetic document',
          content: formData.content,
          filename: formData.filename || null,
          mimeType: formData.mimeType as any,
          syntheticDataOnly: true,
          effectiveDate: new Date().toISOString(),
        }
      }, {
        onSuccess: () => {
          toast({ title: 'Document added successfully' });
          queryClient.invalidateQueries({ queryKey: getListPolicyDocumentsQueryKey() });
          setIsAddOpen(false);
        },
        onError: () => {
          toast({ title: 'Creation failed', variant: 'destructive' });
        }
      });
    }
  };

  const handleToggleStatus = (doc: PolicyDocument) => {
    const newStatus = doc.status === 'active' ? 'archived' : 'active';
    updateDoc.mutate({
      id: doc.id,
      data: {
        status: newStatus,
        syntheticDataOnly: true,
      }
    }, {
      onSuccess: () => {
        toast({ title: `Document ${newStatus}` });
        queryClient.invalidateQueries({ queryKey: getListPolicyDocumentsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to permanently delete this document?')) {
      deleteDoc.mutate({ id }, {
        onSuccess: () => {
          toast({ title: 'Document deleted' });
          queryClient.invalidateQueries({ queryKey: getListPolicyDocumentsQueryKey() });
        }
      });
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || doc.content.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === 'all' || doc.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [documents, search, filterCategory]);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar />
      <div className="flex-1 pb-24 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sticky top-0 z-20">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Knowledge Base</h1>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add Document
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/80 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Synthetic Demo Environment</p>
                <p className="mt-1">
                  This knowledge base manages synthetic policies that ground the agent's reasoning. You can upload custom <b>.txt</b> or <b>.md</b> files to test how the agent adapts to new rules. Binary PDF processing and real school documents are deliberately not supported.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search policies..." 
                  className="pl-9 bg-card"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-card">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="handbook">Handbook</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="enrollment">Enrollment</SelectItem>
                  <SelectItem value="tuition">Tuition</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mb-4 text-primary/50" />
                <p>Loading knowledge base...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-destructive border rounded-lg bg-destructive/5">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>Failed to load policies. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-muted-foreground border border-dashed rounded-lg bg-card/50">
                <FileLock2 className="h-10 w-10 mb-4 opacity-50" />
                <h3 className="font-medium text-foreground mb-1">No documents found</h3>
                <p className="text-sm text-center max-w-md">
                  {search || filterCategory !== 'all' 
                    ? "Try adjusting your search or filters." 
                    : "Your policy library is empty. Add a synthetic document to provide reasoning context to the agent."}
                </p>
                {(!search && filterCategory === 'all') && (
                  <Button onClick={handleOpenAdd} variant="outline" className="mt-6 gap-2">
                    <Upload className="h-4 w-4" /> Upload Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.map(doc => (
                  <Card key={doc.id} className={cn("flex flex-col transition-all hover:shadow-md", doc.status === 'archived' && "opacity-75 grayscale-[0.5]")}>
                    <CardHeader className="p-4 border-b bg-muted/20 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <Badge variant="outline" className="uppercase tracking-wider text-[10px] bg-background">
                          {doc.category}
                        </Badge>
                        <Badge variant={doc.status === 'active' ? 'success' : 'secondary'} className="capitalize text-[10px]">
                          {doc.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold leading-tight mt-3 line-clamp-2">
                        {doc.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 font-mono">
                        <span>{doc.sourceId}</span>
                        <span>·</span>
                        <span>v{doc.version}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {doc.description || doc.content.substring(0, 120) + '...'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-auto pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setPreviewDoc(doc)}>
                          Preview
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenEdit(doc)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground" 
                          onClick={() => handleToggleStatus(doc)}
                          title={doc.status === 'active' ? 'Archive' : 'Restore'}
                        >
                          {doc.status === 'active' ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Edit Document' : 'Add Policy Document'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            
            {!editingDoc && (
              <div className="mb-6 p-4 rounded-lg border border-dashed bg-muted/30 text-center">
                <input 
                  type="file" 
                  accept=".txt,.md" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">Upload a .txt or .md file</p>
                <p className="text-xs text-muted-foreground mb-4">Content will be extracted into the editor below</p>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input 
                  id="title" 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="handbook">Handbook</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="enrollment">Enrollment</SelectItem>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input 
                  id="version" 
                  required 
                  value={formData.version} 
                  onChange={e => setFormData({...formData, version: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Input 
                  id="description" 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="e.g. Guidelines for unexcused absences"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Document Content (Markdown/Text)</Label>
              <Textarea 
                id="content" 
                required 
                className="min-h-[200px] font-mono text-sm" 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDoc.isPending || updateDoc.isPending}>
                {createDoc.isPending || updateDoc.isPending ? 'Saving...' : 'Save Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {previewDoc && (
            <>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="uppercase text-[10px]">{previewDoc.category}</Badge>
                  <Badge variant="secondary" className="text-[10px]">v{previewDoc.version}</Badge>
                  <Badge variant={previewDoc.sourceKind === 'demo' ? 'secondary' : 'default'} className="text-[10px] ml-auto">
                    {previewDoc.sourceKind}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{previewDoc.title}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">{previewDoc.sourceId}</p>
              </DialogHeader>
              
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg bg-muted/10 border font-sans">
                {previewDoc.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
              
              <DialogFooter className="mt-4">
                <Button onClick={() => setPreviewDoc(null)}>Close Preview</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
