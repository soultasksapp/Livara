"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ProfileForm {
  name: string
  email: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: user?.name || '',
    email: user?.email || ''
  })
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [profileColor, setProfileColor] = useState('#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Initialize form data when user loads
  useEffect(() => {
    if (user && !hasInitialized) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      })
      setProfileColor(user.profile_color || '#3b82f6')
      setHasInitialized(true)
    }
  }, [user, hasInitialized])

  // Update form when user data changes (but not profile color to avoid overriding user selection)
  useEffect(() => {
    if (user && hasInitialized) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user?.name, user?.email, hasInitialized])

  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true)
      
      // First update profile information
      const profileData: any = {
        name: profileForm.name,
        profile_color: profileColor
      }
      
      // Only include email if user is super admin
      if (user?.role === 'super_admin') {
        profileData.email = profileForm.email
      }
      
      const profileResponse = await apiClient.put('/api/auth/profile', profileData)

      if (!profileResponse.success) {
        toast({
          title: "Error",
          description: profileResponse.error || "Failed to update profile",
          variant: "destructive"
        })
        return
      }

      // If password fields are filled, update password too
      if (passwordForm.currentPassword && passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          toast({
            title: "Error",
            description: "New passwords do not match",
            variant: "destructive"
          })
          return
        }

        const passwordResponse = await apiClient.put('/api/auth/change-password', {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })

        if (!passwordResponse.success) {
          toast({
            title: "Error", 
            description: passwordResponse.error || "Failed to update password",
            variant: "destructive"
          })
          return
        }
        
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }

      // Success - refresh user data and show success message
      await refreshUser()
      
      toast({
        title: "Success",
        description: "Changes saved successfully"
      })
      
      console.log('Profile updated successfully, new color:', profileColor)
      
    } catch (error) {
      console.error('Error saving changes:', error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information Section */}
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-gray-400">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                className={user?.role === 'super_admin' 
                  ? "bg-white/5 border-white/10 text-white" 
                  : "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                }
                disabled={user?.role !== 'super_admin'}
                readOnly={user?.role !== 'super_admin'}
                placeholder={user?.role === 'super_admin' ? "Enter your email" : undefined}
              />
              {user?.role !== 'super_admin' && (
                <p className="text-xs text-gray-500 mt-1">Email can only be changed by Super Admin</p>
              )}
            </div>
          </div>

          {/* Profile Color */}
          <div className="space-y-3">
            <Label className="text-gray-300">Profile Color</Label>
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-lg"
                style={{ backgroundColor: profileColor }}
              >
                {getUserInitials(profileForm.name)}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280'
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setProfileColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      profileColor === color ? 'border-white shadow-lg' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="glass-dark border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Change Password</CardTitle>
          <CardDescription className="text-gray-400">
            Update your account password (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-gray-300">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-gray-300">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Single Save Changes Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveChanges}
          disabled={isSubmitting}
          className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}