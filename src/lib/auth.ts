import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import * as bcrypt from 'bcryptjs'
import { getUserByEmail } from './database'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export interface JWTPayload {
  user_id: number
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'user'
  team_id?: number
  widget_access?: boolean
  profile_color?: string
  [key: string]: unknown
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export async function createJWT(payload: JWTPayload): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  
  return jwt
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user || !user.is_active) {
    return null
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash)
  if (!isPasswordValid) {
    return null
  }

  // Update last login
  const now = new Date().toISOString()
  // You would update user here - simplified for now

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    team_id: user.team_id
  }
}

export async function getAuthenticatedUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return await verifyJWT(token)
}

export function requireAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    return handler(request, user)
  }
}

export function requireAdmin(handler: (req: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request)
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return new Response('Forbidden', { status: 403 })
    }
    return handler(request, user)
  }
}

export function requireTeamAccess(handler: (req: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Admin can access everything, regular users need team_id
    if (user.role !== 'admin' && !user.team_id) {
      return new Response('Forbidden', { status: 403 })
    }
    
    return handler(request, user)
  }
}

// Client-side auth hook (simple placeholder)
export function useAuth() {
  return {
    user: null as JWTPayload | null,
    login: () => {},
    logout: () => {},
    refreshUser: () => Promise.resolve(),
    isLoading: false
  }
}