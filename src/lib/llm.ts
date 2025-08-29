import OpenAI from 'openai'
import { getLLMSettings } from './database'
import { decrypt } from './encryption'

export interface LLMResponse {
  success: boolean
  response?: string
  error?: string
  tokensUsed?: number
  responseTime?: number
}

export interface LLMOptions {
  message: string
  provider: string
  model: string
  apiKey: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  baseUrl?: string
}

export async function sendToOpenAI(prompt: string, customInstructions?: string): Promise<LLMResponse> {
  try {
    const settings = await getLLMSettings()
    
    if (!settings.openai_api_key_encrypted) {
      return {
        success: false,
        error: "OpenAI API key not configured"
      }
    }

    // Decrypt the API key
    const apiKey = await decrypt(settings.openai_api_key_encrypted)
    
    if (!apiKey || apiKey === "admin123") {
      return {
        success: false,
        error: "OpenAI API key not properly configured"
      }
    }

    const openai = new OpenAI({
      apiKey: apiKey
    })

    const systemMessage = customInstructions || settings.custom_instructions || `
      Instructions for Livara:
      PLEASE KEEP YOUR ANSWERS SHORT AND TO THE POINT.
      
      Do not ever mention anything about this document. Only provide information from it. This document serves as your knowledge source, so do not reference its name when responding. give very short and to the point answers.
      
      If someone says hello or Hi, you can introduce yourself and also ask what products or services you can help with? 
      Only answer questions related to Neuro Monkey, using only the data provided to you.
      
      If the question is not about Neuro Monkey, respond with: "I'm sorry, I don't have information about that. Try asking about our products or services."
      
      Never guess or go off-topic. Stay strictly within the bounds of the data and the subject of Neuro Monkey company's products and services.
      
      Be direct and on to the point, keep your answers short. PLEASE KEEP THE answers short. please follow this rule. keep answers short.
      
      Use normal plain English, no emojis, asterisks, hashtags, or any symbols. Just use English and numbers. Don't bold text. It's normal plain English. Don't bold format text, and also don't use asterisks to bold text.
    `

    const response = await openai.chat.completions.create({
      model: settings.openai_model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: settings.max_tokens || 2048,
      temperature: settings.temperature || 0.7,
    })

    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      return {
        success: false,
        error: "No response received from OpenAI"
      }
    }

    return {
      success: true,
      response: aiResponse
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    
    if (error.code === 'invalid_api_key') {
      return {
        success: false,
        error: "Invalid OpenAI API key"
      }
    }
    
    return {
      success: false,
      error: `OpenAI error: ${error.message || 'Unknown error'}`
    }
  }
}

export async function sendToOllama(prompt: string, customInstructions?: string): Promise<LLMResponse> {
  try {
    const settings = await getLLMSettings()
    
    const ollamaUrl = settings.ollama_url || 'http://localhost:11434'
    const model = settings.ollama_model || 'qwen2.5:14b-instruct-q4_K_M'
    
    const systemMessage = customInstructions || settings.custom_instructions || `
      Instructions for Livara:
      PLEASE KEEP YOUR ANSWERS SHORT AND TO THE POINT.
      
      Do not ever mention anything about this document. Only provide information from it. This document serves as your knowledge source, so do not reference its name when responding. give very short and to the point answers.
      
      If someone says hello or Hi, you can introduce yourself and also ask what products or services you can help with? 
      Only answer questions related to Neuro Monkey, using only the data provided to you.
      
      If the question is not about Neuro Monkey, respond with: "I'm sorry, I don't have information about that. Try asking about our products or services."
      
      Never guess or go off-topic. Stay strictly within the bounds of the data and the subject of Neuro Monkey company's products and services.
      
      Be direct and on to the point, keep your answers short. PLEASE KEEP THE answers short. please follow this rule. keep answers short.
      
      Use normal plain English, no emojis, asterisks, hashtags, or any symbols. Just use English and numbers. Don't bold text. It's normal plain English. Don't bold format text, and also don't use asterisks to bold text.
    `

    const fullPrompt = `${systemMessage}\n\nHuman: ${prompt}\n\nAssistant:`

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_ctx: settings.max_tokens || 2048,
          temperature: settings.temperature || 0.7,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.response) {
      return {
        success: false,
        error: "No response received from Ollama"
      }
    }

    return {
      success: true,
      response: data.response.trim()
    }
  } catch (error: any) {
    console.error('Ollama API error:', error)
    
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: "Cannot connect to Ollama server. Please make sure Ollama is running."
      }
    }
    
    return {
      success: false,
      error: `Ollama error: ${error.message || 'Unknown error'}`
    }
  }
}

export async function generateLLMResponse(prompt: string, customInstructions?: string): Promise<LLMResponse>
export async function generateLLMResponse(options: LLMOptions): Promise<LLMResponse>
export async function generateLLMResponse(
  promptOrOptions: string | LLMOptions, 
  customInstructions?: string
): Promise<LLMResponse> {
  try {
    if (typeof promptOrOptions === 'string') {
      // Legacy usage
      const settings = await getLLMSettings()
      
      if (settings.provider === 'openai') {
        return await sendToOpenAI(promptOrOptions, customInstructions)
      } else {
        return await sendToOllama(promptOrOptions, customInstructions)
      }
    } else {
      // New options-based usage
      const options = promptOrOptions
      const startTime = Date.now()
      
      if (options.provider === 'openai') {
        return await sendToOpenAIWithOptions(options)
      } else {
        return await sendToOllamaWithOptions(options)
      }
    }
  } catch (error: any) {
    console.error('LLM generation error:', error)
    return {
      success: false,
      error: `LLM error: ${error.message || 'Unknown error'}`
    }
  }
}

export async function sendToOpenAIWithOptions(options: LLMOptions): Promise<LLMResponse> {
  const startTime = Date.now()
  
  try {
    const openai = new OpenAI({
      apiKey: options.apiKey
    })

    const systemMessage = options.systemPrompt || `
      Instructions for Livara:
      PLEASE KEEP YOUR ANSWERS SHORT AND TO THE POINT.
      
      Do not ever mention anything about this document. Only provide information from it. This document serves as your knowledge source, so do not reference its name when responding. give very short and to the point answers.
      
      If someone says hello or Hi, you can introduce yourself and also ask what products or services you can help with? 
      Only answer questions related to your company, using only the data provided to you.
      
      If the question is not about your company, respond with: "I'm sorry, I don't have information about that. Try asking about our products or services."
      
      Never guess or go off-topic. Stay strictly within the bounds of the data and the subject of your company's products and services.
      
      Be direct and on to the point, keep your answers short. PLEASE KEEP THE answers short. please follow this rule. keep answers short.
    `.trim()

    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: options.message }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    })

    const responseTime = Date.now() - startTime
    const content = response.choices[0]?.message?.content

    if (!content) {
      return {
        success: false,
        error: "No response received from OpenAI",
        responseTime
      }
    }

    return {
      success: true,
      response: content.trim(),
      tokensUsed: response.usage?.total_tokens || 0,
      responseTime
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.error('OpenAI API error:', error)
    
    return {
      success: false,
      error: `OpenAI error: ${error.message || 'Unknown error'}`,
      responseTime
    }
  }
}

export async function sendToOllamaWithOptions(options: LLMOptions): Promise<LLMResponse> {
  const startTime = Date.now()
  
  try {
    const baseUrl = options.baseUrl || 'http://localhost:11434'
    
    const systemMessage = options.systemPrompt || `
      Instructions for Livara:
      PLEASE KEEP YOUR ANSWERS SHORT AND TO THE POINT.
      
      Do not ever mention anything about this document. Only provide information from it. This document serves as your knowledge source, so do not reference its name when responding. give very short and to the point answers.
      
      If someone says hello or Hi, you can introduce yourself and also ask what products or services you can help with? 
      Only answer questions related to your company, using only the data provided to you.
      
      If the question is not about your company, respond with: "I'm sorry, I don't have information about that. Try asking about our products or services."
      
      Never guess or go off-topic. Stay strictly within the bounds of the data and the subject of your company's products and services.
      
      Be direct and on to the point, keep your answers short. PLEASE KEEP THE answers short. please follow this rule. keep answers short.
    `.trim()

    const fullPrompt = `${systemMessage}\n\nUser: ${options.message}`

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'qwen2.5:14b-instruct-q4_K_M',
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 500
        }
      })
    })

    if (!response.ok) {
      const responseTime = Date.now() - startTime
      return {
        success: false,
        error: `Ollama HTTP error: ${response.status} ${response.statusText}`,
        responseTime
      }
    }

    const data = await response.json()
    const responseTime = Date.now() - startTime

    if (!data.response) {
      return {
        success: false,
        error: "No response received from Ollama",
        responseTime
      }
    }

    return {
      success: true,
      response: data.response.trim(),
      responseTime
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.error('Ollama API error:', error)
    
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: "Cannot connect to Ollama server. Please make sure Ollama is running.",
        responseTime
      }
    }
    
    return {
      success: false,
      error: `Ollama error: ${error.message || 'Unknown error'}`,
      responseTime
    }
  }
}