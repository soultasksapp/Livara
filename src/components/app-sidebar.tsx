"use client"

import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  MessageSquare,
  Users,
  FileText,
  Settings,
  User,
  Building,
  WorkflowIcon as Widget,
  Brain,
  Circle,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { apiClient } from "@/lib/api"

const navigationItems = [
  {
    title: "Conversations",
    url: "/dashboard/conversations",
    icon: MessageSquare,
    badge: null,
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: Users,
    badge: null,
  },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: FileText,
    badge: null,
  },
  {
    title: "Agent Controls",
    url: "/dashboard/llm",
    icon: Brain,
    badge: null,
  },
]

const adminItems = [
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: User,
    badge: null,
  },
  {
    title: "Team Management",
    url: "/dashboard/teams",
    icon: Building,
    badge: null,
  },
]

const superAdminItems = [
  {
    title: "Chat Widget",
    url: "/dashboard/widget",
    icon: Widget,
    badge: null,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { user } = useAuth()
  const [hasActiveChats, setHasActiveChats] = useState(false)

  // Check for active chats
  const checkActiveChats = async () => {
    try {
      const response = await apiClient.get('/api/sessions/stats')
      if (response.success && response.data) {
        const stats = response.data.stats || {}
        const activeCount = stats.active || 0
        setHasActiveChats(activeCount > 0)
      }
    } catch (error) {
      console.error('Error checking active chats:', error)
    }
  }

  useEffect(() => {
    // Check immediately
    checkActiveChats()
    
    // Check every 10 seconds for real-time updates
    const interval = setInterval(checkActiveChats, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Sidebar className="border-r border-white/10 bg-black [&>div]:bg-black">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          {!isCollapsed && (
            <span className="font-bold text-white">Livara Agent</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Hide Agent Controls from normal users and admins - only super_admins can see it
                if (item.title === "Agent Controls" && user?.role !== 'super_admin') {
                  return null
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="text-gray-300 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:border-r-2 data-[active=true]:border-white/40 smooth-transition"
                    >
                      <Link href={item.url} className="flex items-center space-x-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-300 border-blue-400/30">
                            {item.badge}
                          </Badge>
                        )}
                        {/* Show active chat indicator only for Conversations */}
                        {item.title === "Conversations" && hasActiveChats && (
                          <div className="ml-auto flex items-center">
                            <Circle 
                              className="h-2 w-2 fill-green-400 text-green-400 animate-pulse" 
                              strokeWidth={0}
                            />
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  // Hide Team Management from normal admins - only super_admins can see it
                  if (item.title === "Team Management" && user?.role !== 'super_admin') {
                    return null
                  }
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="text-gray-300 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:border-r-2 data-[active=true]:border-white/40 smooth-transition"
                      >
                        <Link href={item.url} className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                  className="text-gray-300 hover:text-white hover:bg-white/10 data-[active=true]:bg-gray-800 data-[active=true]:text-white data-[active=true]:border-r-2 data-[active=true]:border-gray-600 smooth-transition"
                >
                  <Link href="/dashboard/settings" className="flex items-center space-x-3">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.widget_access) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">
              Widget Controls
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="text-gray-300 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:border-r-2 data-[active=true]:border-white/40 smooth-transition"
                    >
                      <Link href={item.url} className="flex items-center space-x-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
