// src/components/ChatBox.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

export interface ChatBoxProps {
  propertyId: string;
  initialRunId?: string | null;
  onRunId?: (runId: string) => void;
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
}

const REQUEST_TIMEOUT_MS = 45000;

export default function ChatBox({ propertyId, initialRunId, onRunId, className = '' }: ChatBoxProps) {
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
      return; // Silent ignore for empty messages
    }

    if (trimmedMessage.length > 10000) {
      addMessage('error', '⚠️ Message is too long (max 10,000 characters).');
      return;
    }

    if (isPending) {
      return; // Prevent duplicate sends
    }

    // Start request
    setIsPending(true);
    const userMessageContent = trimmedMessage;
    setInputValue(''); // Clear immediately for better UX

    // Optimistically add user message
    addMessage('user', userMessageContent);

    // Add "Working..." indicator
    const workingMessageId = `working-${Date.now()}`;
    const workingMessage: Message = {
      id: workingMessageId,
      role: 'system',
      content: 'Working…',
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

      const data: ChatbotResponseItem[] = await response.json();
      const duration = Date.now() - startTime;
      console.log('[chatbot] Response received in', duration, 'ms, items:', data.length);

      // Handle response
      if (!Array.isArray(data) || data.length === 0) {
        addMessage('bot', 'No actionable response.');
        setIsPending(false);
        textareaRef.current?.focus();
        return;
      }

      // Display all user_message entries
      for (const item of data) {
        if (item.user_message) {
          addMessage('bot', item.user_message);
        }
      }

      // Use first item's run_id for refresh
      const firstItem = data[0];
      if (firstItem.run_id && onRunId) {
        console.log('[chatbot] Triggering refresh with run_id:', firstItem.run_id);
        onRunId(firstItem.run_id);
      }

      // If no user_message was present, show generic success
      if (!data.some((item) => item.user_message)) {
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
    <div className={`flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <h3 className="text-sm font-semibold text-slate-900">Property Assistant</h3>
        {initialRunId && (
          <p className="text-xs text-slate-500 mt-0.5">Current run: {initialRunId.substring(0, 8)}...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-400 mt-8">
            Ask me anything about this property...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.role === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : msg.role === 'system'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 italic'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
              <div
                className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isPending}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={isPending || inputValue.trim() === ''}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isPending || inputValue.trim() === ''
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }`}
            aria-label="Send message"
          >
            {isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
