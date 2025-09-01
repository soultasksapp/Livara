"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  // Create floating particles
  useEffect(() => {
    const particlesContainer = document.getElementById('particles')
    if (!particlesContainer) return

    const particleCount = 50
    particlesContainer.innerHTML = ''

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.classList.add('particle')
      particle.style.left = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 20 + 's'
      particle.style.animationDuration = (15 + Math.random() * 10) + 's'
      particlesContainer.appendChild(particle)
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      <style jsx global>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(to bottom right, #111827, #1f2937, #111827);
          min-height: 100vh;
          overflow: hidden;
          position: relative;
          margin: 0;
          padding: 0;
        }

        /* Floating particles animation */
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 25s infinite linear;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.05);
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-10vh) translateX(50px);
            opacity: 0;
          }
        }

        /* Main register container */
        .register-container {
          position: relative;
          z-index: 10;
          background: rgba(0, 0, 0, 0.20);
          backdrop-filter: blur(8px) saturate(100%);
          -webkit-backdrop-filter: blur(8px) saturate(100%);
          border-radius: 20px;
          padding: 26px 24px;
          border: 0.7px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 10px 50px rgba(0, 0, 0, 0.15), 
            0 0.5px 0 rgba(255, 255, 255, 0.06) inset,
            0 0 20px rgba(255, 255, 255, 0.02) inset;
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: visible;
        }

        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .welcome-text {
          color: #e0e0e0;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 5px;
          text-align: center;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 400;
          text-align: center;
          margin-bottom: 26px;
        }

        .form-group {
          margin-bottom: 16px;
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 10px 13px;
          background: #2a2a2a;
          border: 1px solid #404040;
          border-radius: 10px;
          color: #e0e0e0;
          font-size: 12px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #888;
        }

        .form-input:focus {
          border-color: rgba(255, 255, 255, 0.6);
          background: #333;
        }

        .password-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 10px;
          padding: 4px;
          border-radius: 7px;
          transition: all 0.2s ease;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.1);
        }

        .register-button {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          color: #1a1a1a;
          border: none;
          padding: 10px 13px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          margin-bottom: 17px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .register-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background: #ffffff;
        }

        .register-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(26, 26, 26, 0.3);
          border-top: 2px solid #1a1a1a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 7px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message-floating {
          position: absolute;
          top: -25px;
          left: 50%;
          color: rgba(255, 69, 58, 0.95);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: -0.01em;
          z-index: 5;
          width: auto;
          text-align: center;
          opacity: 0;
          visibility: hidden;
          transform: translateX(-50%) translateY(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .error-message-floating.show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(10px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out;
        }

        .success-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .success-animation {
          text-align: center;
          color: white;
        }

        .copyright {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          font-weight: 400;
          text-align: center;
          letter-spacing: 0.3px;
          z-index: 1;
        }
      `}</style>

      <div className="min-h-screen w-full relative flex items-center justify-center p-4">
        {/* Floating particles */}
        <div className="particles" id="particles"></div>

        <div className="register-container">
          {/* Error message */}
          {error && (
            <div 
              className={`error-message-floating ${error ? 'show' : ''}`}
              onClick={() => setError("")}
            >
              {error}
            </div>
          )}
          
          <div className="logo-container">
            <h1 className="welcome-text">Create Account</h1>
            <p className="subtitle">Join Livara AI Agent</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                name="name" 
                placeholder="Full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                name="email" 
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <input 
                type={showPassword ? "text" : "password"}
                className="form-input" 
                name="password" 
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="form-group">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                className="form-input" 
                name="confirmPassword" 
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading && <div className="loading-spinner"></div>}
              <span>{isLoading ? "Creating account..." : "Create Account"}</span>
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <Link href="/login" className="text-white hover:text-gray-300 text-sm font-medium underline">
              Sign In
            </Link>
          </div>
        </div>

        {/* Success Animation Overlay */}
        <div className={`success-overlay ${showSuccess ? 'show' : ''}`}>
          <div className="success-animation">
            <div className="text-2xl mb-4">✓</div>
            <div className="text-lg">Account Created Successfully!</div>
            <div className="text-sm mt-2">Redirecting to login...</div>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="copyright">© 2025 NeuroMonkey.ai | Powered by Soul</div>
      </div>
    </>
  )
}