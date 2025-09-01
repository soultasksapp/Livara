"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus, Edit, Trash2, Search, Users, AlertCircle, X, UserMinus, UserPlus, ArrowLeft } from "lucide-react"
import { apiClient } from "@/lib/api"

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [isManagingTeam, setIsManagingTeam] = useState(false)
  const [managingTeam, setManagingTeam] = useState<any>(null)
  
  // Form states
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchTeams()
    fetchUsers()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/api/auth/profile')
      if (response.success && response.data) {
        setCurrentUserRole(response.data.role || '')
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/api/admin/teams')
      
      if (response.success && response.data) {
        setTeams(response.data.teams || [])
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true)
      const response = await apiClient.get('/api/admin/users')
      
      if (response.success && response.data) {
        setUsers(response.data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsUsersLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await apiClient.post('/api/admin/teams', {
        name: teamName.trim(),
        description: teamDescription.trim()
      })
      
      if (response.success) {
        await fetchTeams()
        setTeamName("")
        setTeamDescription("")
        setIsCreateDialogOpen(false)
      } else {
        alert('Failed to create team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to create team:', error)
      alert('Failed to create team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTeam = async () => {
    if (!editingTeam || !teamName.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await apiClient.put(`/api/admin/teams/${editingTeam.id}`, {
        name: teamName.trim(),
        description: teamDescription.trim()
      })
      
      if (response.success) {
        await fetchTeams()
        setEditingTeam(null)
        setTeamName("")
        setTeamDescription("")
        setIsEditDialogOpen(false)
      } else {
        alert('Failed to update team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to update team:', error)
      alert('Failed to update team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async (team: any) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This will remove all team members from the team.`)) {
      return
    }
    
    try {
      const response = await apiClient.delete(`/api/admin/teams/${team.id}`)
      
      if (response.success) {
        await fetchTeams()
        await fetchUsers() // Refresh to update team assignments
      } else {
        alert('Failed to delete team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to delete team:', error)
      alert('Failed to delete team')
    }
  }

  const handleEditTeamClick = (team: any) => {
    setEditingTeam(team)
    setTeamName(team.name)
    setTeamDescription(team.description || '')
    setIsEditDialogOpen(true)
  }

  const handleManageTeamClick = (team: any) => {
    setManagingTeam(team)
    setIsManagingTeam(true)
  }

  const handleBackToTeams = () => {
    setIsManagingTeam(false)
    setManagingTeam(null)
  }

  const handleAssignUserToTeam = async (userId: number) => {
    if (!managingTeam) return
    
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/team`, {
        team_id: managingTeam.id
      })
      
      if (response.success) {
        await fetchUsers()
      } else {
        alert('Failed to assign user to team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to assign user to team:', error)
      alert('Failed to assign user to team')
    }
  }

  const handleRemoveUserFromTeam = async (userId: number) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/team`, {
        team_id: null
      })
      
      if (response.success) {
        await fetchUsers()
      } else {
        alert('Failed to remove user from team: ' + (response.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to remove user from team:', error)
      alert('Failed to remove user from team')
    }
  }

  const filteredTeams = teams.filter(team =>
    team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if current user is super admin
  const isSuperAdmin = currentUserRole === 'super_admin'

  // Get team members and non-members for team management
  const teamMembers = managingTeam ? users.filter(user => user.team_id === managingTeam.id) : []
  const availableUsers = managingTeam ? users.filter(user => user.team_id !== managingTeam.id) : []

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Card className="glass-dark border-white/10">
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Access Restricted</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Team Management is only available to Super Administrators. You need elevated permissions to access this section.
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-red-300 text-sm">
                  Current Role: <span className="font-medium capitalize">{currentUserRole || 'Unknown'}</span>
                </p>
                <p className="text-red-300 text-sm mt-1">
                  Required Role: <span className="font-medium">Super Admin</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show team member management view
  if (isManagingTeam && managingTeam) {
    return (
      <div className="space-y-6">
        <Card className="glass-dark border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToTeams}
                    className="text-gray-400 hover:text-white hover:bg-white/10 p-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Managing Team: {managingTeam.name}</span>
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400 ml-10">
                  Add or remove team members for {managingTeam.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Team Members */}
            <div>
              <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Team Members ({teamMembers.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                          No team members yet. Add users from the available users below.
                        </TableCell>
                      </TableRow>
                    ) : teamMembers.map((user) => (
                      <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          {user.name || user.username}
                        </TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUserFromTeam(user.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Remove from team"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Available Users */}
            <div>
              <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Available Users ({availableUsers.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">Current Team</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                          All users are already assigned to teams.
                        </TableCell>
                      </TableRow>
                    ) : availableUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          {user.name || user.username}
                        </TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignUserToTeam(user.id)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            title="Add to team"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">
                Team Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Create and manage teams, organize users into companies and departments
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-600 hover:bg-slate-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name" className="text-gray-300">Team Name</Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-description" className="text-gray-300">Description (Optional)</Label>
                    <Textarea
                      id="team-description"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      placeholder="Enter team description..."
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-white/10 text-gray-300 hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTeam}
                      disabled={!teamName.trim() || isSubmitting}
                      className="bg-slate-600 hover:bg-slate-700 text-white"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Team'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
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
                  <TableHead className="text-gray-300">Team Name</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300">Members</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
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
                    </TableRow>
                  ))
                ) : filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <Building2 className="h-8 w-8 text-gray-500" />
                        <p className="text-gray-400">No teams found</p>
                        <p className="text-gray-500 text-sm">Create your first team to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTeams.map((team) => {
                  const memberCount = users.filter(user => user.team_id === team.id).length
                  return (
                    <TableRow key={team.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-teal-400" />
                          <span>{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {team.description || (
                          <span className="text-gray-500 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                            {memberCount} member{memberCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(team.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeamClick(team)}
                            className="text-gray-400 hover:text-white"
                            title="Edit team"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageTeamClick(team)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            title="Manage team members"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(team)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {!isLoading && teams.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>{teams.length} team{teams.length !== 1 ? 's' : ''} total</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{users.length} user{users.length !== 1 ? 's' : ''} across all teams</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Super Admin Access
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-team-name" className="text-gray-300">Team Name</Label>
              <Input
                id="edit-team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-team-description" className="text-gray-300">Description (Optional)</Label>
              <Textarea
                id="edit-team-description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description..."
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingTeam(null)
                  setTeamName("")
                  setTeamDescription("")
                }}
                className="border-white/10 text-gray-300 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTeam}
                disabled={!teamName.trim() || isSubmitting}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Team'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}