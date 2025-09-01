"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Upload, File, Trash2, Download, Search, Eye, Check, X } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Document {
  id: number
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  team_id?: number
  uploaded_by: number
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: number
  approved_at?: string
  rejection_reason?: string
  upload_timestamp: string
  processed_for_llm: boolean
  uploader_name: string
  approver_name?: string
  team_name?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [userRole, setUserRole] = useState<string>('user')
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewFilename, setPreviewFilename] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/documents')
      
      if (response.success && response.data?.documents) {
        setDocuments(response.data.documents)
        setUserRole(response.data.user_role || 'user')
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (document: Document) => {
    setDeletingDocument(document)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteDocument = async () => {
    if (!deletingDocument) return
    
    try {
      const response = await apiClient.delete(`/api/delete/${deletingDocument.filename}`)
      if (response.success) {
        // Update the UI by removing the deleted document
        setDocuments(docs => docs.filter(doc => doc.filename !== deletingDocument.filename))
        // Also refresh the documents list to ensure consistency
        await fetchDocuments()
        setIsDeleteDialogOpen(false)
        setDeletingDocument(null)
      } else {
        alert('Failed to delete document: ' + (response.message || response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document: ' + (error as any)?.message || 'Network error')
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      // Use apiClient for download with proper authentication
      const response = await apiClient.downloadFile(`/api/download/${encodeURIComponent(filename)}`)
      
      if (response) {
        const url = window.URL.createObjectURL(response)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Download failed: Unable to retrieve file')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed: Network error')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use apiClient for proper URL handling and authentication
      const response = await apiClient.post('/api/upload', formData)

      if (response.success) {
        console.log('Upload successful:', response)
        
        // Refresh the documents list
        await fetchDocuments()
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        alert('File uploaded successfully!')
      } else {
        console.error('Upload failed:', response)
        alert('Upload failed: ' + (response.message || response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: Network error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleApprove = async (documentId: number) => {
    try {
      const response = await apiClient.post(`/api/documents/${documentId}/approve`)
      if (response.success) {
        alert('Document approved successfully!')
        await fetchDocuments()
      } else {
        alert('Failed to approve document: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve document: Network error')
    }
  }

  const handleReject = async (documentId: number) => {
    const reason = prompt('Please provide a reason for rejecting this document (optional):')
    if (reason === null) return // User cancelled
    
    try {
      const response = await apiClient.post(`/api/documents/${documentId}/reject`, { reason })
      if (response.success) {
        alert('Document rejected successfully!')
        await fetchDocuments()
      } else {
        alert('Failed to reject document: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject document: Network error')
    }
  }

  const handlePreview = async (documentId: number) => {
    try {
      const response = await apiClient.get(`/api/documents/${documentId}/preview`)
      if (response.success) {
        setPreviewContent(response.data.content)
        setPreviewFilename(response.data.filename)
        setShowPreview(true)
      } else {
        alert('Failed to preview document: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Preview error:', error)
      alert('Failed to preview document: Network error')
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalSize = documents.reduce((total, doc) => {
    return total + (doc.file_size || 0)
  }, 0)

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Document Management</CardTitle>
              <CardDescription className="text-gray-400">
                Upload and manage knowledge base documents
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.md"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Document</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Size</TableHead>
                  <TableHead className="text-gray-300">Uploaded By</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  {(userRole === 'super_admin' || userRole === 'admin') && (
                    <TableHead className="text-gray-300">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      {(userRole === 'super_admin' || userRole === 'admin') && (
                        <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{doc.original_filename}</div>
                          {doc.team_name && (
                            <div className="text-xs text-gray-400">{doc.team_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                        {doc.file_type?.toUpperCase() || 'FILE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="text-sm">
                        <div>{doc.uploader_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.upload_timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          doc.approval_status === 'approved' 
                            ? "bg-green-500/20 text-green-300 border-green-400/30"
                            : doc.approval_status === 'rejected'
                            ? "bg-red-500/20 text-red-300 border-red-400/30"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-400/30"
                        }
                      >
                        {doc.approval_status.charAt(0).toUpperCase() + doc.approval_status.slice(1)}
                      </Badge>
                      {doc.rejection_reason && (
                        <div className="text-xs text-red-400 mt-1" title={doc.rejection_reason}>
                          Reason: {doc.rejection_reason.substring(0, 20)}...
                        </div>
                      )}
                    </TableCell>
                    {(userRole === 'super_admin' || userRole === 'admin') && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                            onClick={() => handlePreview(doc.id)}
                            title="Preview document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {doc.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(doc.id)}
                                title="Approve document"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleReject(doc.id)}
                                title="Reject document"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                            onClick={() => handleDownload(doc.filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Total storage used: {formatFileSize(totalSize)} • {documents.length} file{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Document Preview: {previewFilename}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded text-gray-300 text-sm">
              {previewContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the document "{deletingDocument?.original_filename || deletingDocument?.filename}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDocument}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}