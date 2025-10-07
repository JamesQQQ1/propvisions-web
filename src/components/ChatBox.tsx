// src/components/ChatBox.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

export interface ChatBoxProps {
  propertyId: string;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatbotRequest {
  property_id: string;
  message: string;
}

interface ChatbotResponseItem {
  property_id?: string;
  run_id?: string;
  user_message?: string;
  message?: string;
}

const REQUEST_TIMEOUT_MS = 45000;

export default function ChatBox({ propertyId, className = '' }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isPending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const addMessage = (role: Message['role'], content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();

    // Validation
    if (!propertyId || propertyId.trim() === '') {
      addMessage('error', '⚠️ Missing property ID. Cannot send message.');
      return;
    }

    if (trimmedMessage === '') {
      return;
    }

    if (trimmedMessage.length > 10000) {
      addMessage('error', '⚠️ Message is too long (max 10,000 characters).');
      return;
    }

    if (isPending) {
      return;
    }

    // Start request
    setIsPending(true);
    const userMessageContent = trimmedMessage;
    setInputValue('');

    // Optimistically add user message
    addMessage('user', userMessageContent);

    // Add "Working..." indicator
    const workingMessageId = `working-${Date.now()}`;
    const workingMessage: Message = {
      id: workingMessageId,
      role: 'system',
      content: 'Thinking...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, workingMessage]);

    console.log('[chatbot] Sending message, property_id:', propertyId);
    const startTime = Date.now();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const payload: ChatbotRequest = {
      property_id: propertyId,
      message: userMessageContent,
    };

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Remove "Working..." message
      setMessages((prev) => prev.filter((m) => m.id !== workingMessageId));

      if (!response.ok) {
        let errorMsg = '⚠️ Error from server.';
        try {
          const errorData = await response.json();
          errorMsg = `⚠️ ${errorData.error || 'Unknown error'}`;
          if (errorData.details) {
            errorMsg += `: ${JSON.stringify(errorData.details).substring(0, 100)}`;
          }
        } catch {
          errorMsg = `⚠️ HTTP ${response.status}: ${response.statusText}`;
        }
        addMessage('error', errorMsg);
        setIsPending(false);
        textareaRef.current?.focus();
        return;
      }

      let rawData: any = await response.json();
      const duration = Date.now() - startTime;

      // Handle both array and object responses
      let data: ChatbotResponseItem[];
      if (Array.isArray(rawData)) {
        data = rawData;
      } else if (rawData && typeof rawData === 'object') {
        console.log('[chatbot] Response is object, wrapping in array');
        data = [rawData];
      } else {
        data = [];
      }

      console.log('[chatbot] Response received in', duration, 'ms, items:', data.length);

      // Handle response
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('[chatbot] Empty or invalid array response');
        addMessage('bot', 'No actionable response.');
        setIsPending(false);
        textareaRef.current?.focus();
        return;
      }

      // Display all messages
      let messageDisplayed = false;
      for (const item of data) {
        const messageText = item.message || item.user_message;
        if (messageText && messageText.trim()) {
          addMessage('bot', messageText.trim());
          messageDisplayed = true;
        }
      }

      // If no message was present, show generic success
      if (!messageDisplayed) {
        addMessage('bot', '✓ Request processed successfully.');
      }

      setIsPending(false);
      textareaRef.current?.focus();

    } catch (err: any) {
      clearTimeout(timeout);

      // Remove "Working..." message
      setMessages((prev) => prev.filter((m) => m.id !== workingMessageId));

      if (err.name === 'AbortError') {
        addMessage('error', '⚠️ Request timed out. Please try again.');
      } else {
        addMessage('error', `⚠️ Network error: ${err.message || 'Unknown error'}`);
      }

      setIsPending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Property Assistant</h3>
            <p className="text-xs text-blue-100">Ask me anything about this property</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs text-white/80">{isPending ? 'Working...' : 'Online'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-2">Start a conversation</p>
            <p className="text-sm text-slate-400 max-w-xs">Ask me about ROI, yields, cashflow, or request changes to property details</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
                  : msg.role === 'error'
                  ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-900 border-2 border-red-300 rounded-tl-sm'
                  : msg.role === 'system'
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 border-2 border-amber-300 italic rounded-tl-sm'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 border-2 border-slate-300 rounded-tl-sm'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
              <div
                className={`text-xs mt-2 flex items-center gap-1 ${
                  msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 bg-white border-t-2 border-slate-200 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 text-sm bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-slate-400"
              rows={2}
              disabled={isPending}
              aria-label="Chat message input"
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 rounded text-xs">Enter</kbd>
                <span>to send •</span>
                <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 rounded text-xs">Shift+Enter</kbd>
                <span>for new line</span>
              </div>
              <div className="text-xs text-slate-400">
                {inputValue.length}/10,000
              </div>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={isPending || inputValue.trim() === ''}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-md flex items-center gap-2 ${
              isPending || inputValue.trim() === ''
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-95 shadow-lg hover:shadow-xl'
            }`}
            aria-label="Send message"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
