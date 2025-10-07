// src/components/FloatingChatButton.tsx
'use client';

import { useState } from 'react';
import ChatBox from './ChatBox';

export interface FloatingChatButtonProps {
  propertyId: string;
}

export default function FloatingChatButton({ propertyId }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-bounce-subtle"
          aria-label="Open Property Assistant"
        >
          <div className="relative">
            {/* Chat Icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>

            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>

          {/* Tooltip on Hover */}
          <div className="absolute right-full mr-3 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            Need help? Ask me anything!
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-md h-[600px] shadow-2xl rounded-2xl overflow-hidden animate-slideIn">
          <div className="h-full flex flex-col bg-white rounded-2xl">
            {/* Close Button */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ChatBox Component */}
            <ChatBox propertyId={propertyId} className="h-full" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
      `}</style>
    </>
  );
}
