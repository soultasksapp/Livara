"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Bot, Clock, ArrowDown } from "lucide-react"


interface Message {
  id: number
  sender: "user" | "assistant"
  message: string
  timestamp: string
}

interface ContactInfo {
  names?: string[]
  emails?: string[]
  phones?: string[]
}

interface ConversationThreadProps {
  messages: Message[]
  contactInfo?: ContactInfo
  showContactBadge?: boolean
}

export function ConversationThread({ messages, contactInfo, showContactBadge }: ConversationThreadProps) {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Contact Info Badge */}
      {showContactBadge && contactInfo && (
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex flex-wrap gap-2">
            {contactInfo.names?.map((name, index) => (
              <Badge key={`name-${index}`} variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                👤 {name}
              </Badge>
            ))}
            {contactInfo.emails?.map((email, index) => (
              <Badge key={`email-${index}`} variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
                ✉️ {email}
              </Badge>
            ))}
            {contactInfo.phones?.map((phone, index) => (
              <Badge key={`phone-${index}`} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                📞 {phone}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" onScrollCapture={handleScroll} ref={scrollAreaRef}>
          <div className="space-y-4">
            
            {messages.map((message, index) => (
            <div
              key={message.id || `message-${index}`}
              className={`flex items-start space-x-3 ${
                message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {message.sender === "user" ? (
                  <>
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-white/10 text-gray-300 rounded-bl-md"
                } glass border border-white/10`}
              >
                <p className="text-sm leading-relaxed">{message.message}</p>
                <div className="flex items-center justify-end mt-2 space-x-1">
                  <Clock className="h-3 w-3 opacity-60" />
                  <span className="text-xs opacity-60">{message.timestamp}</span>
                </div>
              </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex-shrink-0"
          size="sm"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
