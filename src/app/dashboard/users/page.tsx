"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UserPlus, Edit, Trash2, Search, Key } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  
  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    team_id: null as number | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Add user dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    team_id: null as number | null
  })
  
  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Reset password state
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchTeams()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/admin/users')
      
      if (response.success && response.data) {
        const data = response.data as { users?: any[] }
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await apiClient.get('/api/admin/teams')
      if (response.success && response.data) {
        const data = response.data as { teams?: any[] }
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  // Handler functions
  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      team_id: user.team_id || null
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      setIsSubmitting(true)
      const response = await apiClient.put(`/api/admin/users/${editingUser.id}`, editForm)
      
      if (response.success) {
        await fetchUsers()
        setIsEditDialogOpen(false)
        setEditingUser(null)
      } else {
        alert('Failed to update user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = (user: any) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!deletingUser) return
    
    try {
      const response = await apiClient.delete(`/api/admin/users/${deletingUser.id}`)
      
      if (response.success) {
        await fetchUsers()
        setIsDeleteDialogOpen(false)
        setDeletingUser(null)
      } else {
        alert('Failed to delete user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const handleResetPassword = (user: any) => {
    setResetPasswordUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordUser) return
    
    try {
      const response = await apiClient.post(`/api/admin/users/${resetPasswordUser.id}/reset-password`)
      
      if (response.success) {
        const data = response.data as { new_password?: string }
        setNewPassword(data.new_password || '')
        // Keep dialog open to show the new password
      } else {
        alert('Failed to reset password: ' + (response.error || 'Unknown error'))
        setIsResetPasswordDialogOpen(false)
        setResetPasswordUser(null)
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      alert('Failed to reset password')
      setIsResetPasswordDialogOpen(false)
      setResetPasswordUser(null)
    }
  }

  const closeResetPasswordDialog = () => {
    setIsResetPasswordDialogOpen(false)
    setResetPasswordUser(null)
    setNewPassword('')
  }

  const handleAddUser = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) return
    
    try {
      setIsSubmitting(true)
      const response = await apiClient.post('/api/admin/users', addForm)
      
      if (response.success) {
        await fetchUsers()
        setAddForm({
          name: '',
          email: '',
          password: '',
          role: 'user',
          team_id: null
        })
        setIsAddDialogOpen(false)
      } else {
        alert('Failed to create user: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      alert('Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTeam = teamFilter === "all" || 
                       (teamFilter === "no-team" && !user.team_name) ||
                       user.team_name === teamFilter
    
    return matchesSearch && matchesTeam
  })

  return (
    <div className="space-y-6">
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage system users and their permissions
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-slate-600 hover:bg-slate-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Teams</SelectItem>
                    <SelectItem value="no-team" className="text-white hover:bg-white/10">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.name} className="text-white hover:bg-white/10">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Team</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-white/10 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium">
                      {user.name || user.username}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          user.role === 'super_admin'
                            ? "bg-purple-500/20 text-purple-300 border-purple-400/30"
                            : user.role === 'admin' 
                            ? "bg-red-500/20 text-red-300 border-red-400/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                        }
                      >
                        {user.role === 'super_admin' ? 'Super Admin' : user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {user.team_name || 'No Team'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => handleResetPassword(user)}
                          title="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={user.role === 'super_admin' || user.id === currentUser?.id}
                          onClick={() => handleDeleteUser(user)}
                          title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  <SelectItem value="user" className="text-white hover:bg-white/10">User</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-white/10">Admin</SelectItem>
                  {currentUser?.role === 'super_admin' && (
                    <SelectItem value="super_admin" className="text-white hover:bg-white/10">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {currentUser?.role === 'super_admin' && (
              <div>
                <Label htmlFor="team" className="text-gray-300">Team</Label>
                <Select 
                  value={editForm.team_id?.toString() || 'no-team'} 
                  onValueChange={(value) => setEditForm({...editForm, team_id: value === 'no-team' ? null : parseInt(value)})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="no-team" className="text-white hover:bg-white/10">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()} className="text-white hover:bg-white/10">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the user "{deletingUser?.name || deletingUser?.username}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={(open) => !open && closeResetPasswordDialog()}>
        <AlertDialogContent className="glass-dark border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {newPassword ? 'Password Reset Successfully' : 'Reset Password'}
            </AlertDialogTitle>
            <div className="text-gray-400">
              {newPassword ? (
                <div className="space-y-2">
                  <p>The password has been reset for "{resetPasswordUser?.name || resetPasswordUser?.username}".</p>
                  <div className="bg-white/5 p-3 rounded border border-white/10">
                    <p className="text-sm text-gray-300">New password:</p>
                    <p className="font-mono text-white text-lg">{newPassword}</p>
                  </div>
                  <p className="text-sm text-yellow-400">⚠️ Make sure to save this password as it won't be shown again.</p>
                </div>
              ) : (
                <p>Are you sure you want to reset the password for "{resetPasswordUser?.name || resetPasswordUser?.username}"? 
                A new random password will be generated.</p>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {newPassword ? (
              <AlertDialogAction 
                onClick={closeResetPasswordDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmResetPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Reset Password
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new user account with role and team assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name" className="text-gray-300">Name</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                placeholder="Enter full name"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="add-email" className="text-gray-300">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                placeholder="Enter email address"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="add-password" className="text-gray-300">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                placeholder="Enter password"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="add-role" className="text-gray-300">Role</Label>
              <Select value={addForm.role} onValueChange={(value) => setAddForm({...addForm, role: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  <SelectItem value="user" className="text-white hover:bg-white/10">User</SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-white/10">Admin</SelectItem>
                  {currentUser?.role === 'super_admin' && (
                    <SelectItem value="super_admin" className="text-white hover:bg-white/10">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {currentUser?.role === 'super_admin' && (
              <div>
                <Label htmlFor="add-team" className="text-gray-300">Team</Label>
                <Select 
                  value={addForm.team_id?.toString() || 'no-team'} 
                  onValueChange={(value) => setAddForm({...addForm, team_id: value === 'no-team' ? null : parseInt(value)})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="no-team" className="text-white hover:bg-white/10">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()} className="text-white hover:bg-white/10">
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false)
                setAddForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'user',
                  team_id: null
                })
              }}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim() || isSubmitting}
              className="bg-slate-600 hover:bg-slate-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}