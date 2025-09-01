"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const { login, isLoading } = useAuth()

  // Create floating particles
  useEffect(() => {
    const particlesContainer = document.getElementById('particles')
    if (!particlesContainer) return

    const particleCount = 50
    particlesContainer.innerHTML = '' // Clear existing particles

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.classList.add('particle')
      particle.style.left = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 20 + 's'
      particle.style.animationDuration = (15 + Math.random() * 10) + 's'
      particlesContainer.appendChild(particle)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await login(email, password)
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } else if (result.error) {
      setError(result.error)
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setError("")
      }, 5000)
    }
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

        /* Main login container matching chat widget style */
        .login-container {
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
          max-width: 360px;
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
          margin-bottom: 20px;
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

        .login-button {
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

        .login-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background: #ffffff;
        }

        .login-button:active {
          transform: translateY(0) scale(0.98);
        }

        .login-button:disabled {
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


        /* Error message floating outside the card */
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

        /* Success Animation Overlay */
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
          position: relative;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(0.8);
          transition: transform 0.3s ease-out;
        }

        .success-overlay.show .success-animation {
          transform: scale(1);
        }

        .rotating-circle {
          position: absolute;
          width: 80px;
          height: 80px;
          border: 2px solid transparent;
          border-top: 2px solid rgba(255, 255, 255, 0.8);
          border-right: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: futuristicSpin 1.5s linear infinite;
        }

        .rotating-circle::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          width: 80px;
          height: 80px;
          border: 2px solid transparent;
          border-bottom: 2px solid rgba(255, 255, 255, 0.6);
          border-left: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: futuristicSpin 2s linear infinite reverse;
        }

        .success-check {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.9);
          font-size: 20px;
          font-weight: bold;
          opacity: 0;
          transform: scale(0.5);
          animation: checkAppear 0.8s ease-out 1s forwards;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        @keyframes futuristicSpin {
          0% {
            transform: rotate(0deg);
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(360deg);
            opacity: 0.4;
          }
        }

        @keyframes checkAppear {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .success-text {
          position: absolute;
          bottom: -50px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
          opacity: 0;
          animation: textFadeIn 0.5s ease-out 1.5s forwards;
          text-align: center;
          letter-spacing: 0.5px;
        }

        @keyframes textFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Copyright text */
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

        @media (max-width: 480px) {
          .login-container {
            margin: 0;
            padding: 24px 20px;
            max-width: 340px;
            border-radius: 16px;
          }
          
          .welcome-text {
            font-size: 18px;
          }
          
          .subtitle {
            font-size: 11px;
            margin-bottom: 24px;
          }
          
          .form-input {
            padding: 12px 13px;
            font-size: 13px;
          }
          
          .login-button {
            padding: 12px 17px;
            font-size: 13px;
          }
        }

        @media (max-width: 360px) {
          .login-container {
            max-width: 300px;
            padding: 20px 16px;
          }
          
          .welcome-text {
            font-size: 16px;
          }
          
          .form-input {
            padding: 10px 12px;
            font-size: 12px;
          }
          
          .login-button {
            padding: 10px 15px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="min-h-screen w-full relative flex items-center justify-center p-4">
        {/* Floating particles */}
        <div className="particles" id="particles"></div>

        <div className="login-container">
          {/* Error message positioned at top of card */}
          {error && (
            <div 
              className={`error-message-floating ${error ? 'show' : ''}`}
              onClick={() => setError("")}
            >
              {error}
            </div>
          )}
          
          <div className="logo-container">
            <h1 className="welcome-text">Livara AI Agent</h1>
            <p className="subtitle">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                id="email" 
                name="email" 
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <input 
                type={showPassword ? "text" : "password"}
                className="form-input" 
                id="password" 
                name="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading && <div className="loading-spinner"></div>}
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>

        </div>

        {/* Success Animation Overlay */}
        <div className={`success-overlay ${showSuccess ? 'show' : ''}`}>
          <div className="success-animation">
            <div className="rotating-circle"></div>
            <div className="success-check">✓</div>
            <div className="success-text">Login Successful</div>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="copyright">© 2025 NeuroMonkey.ai | Powered by Soul</div>
      </div>
    </>
  )
}
