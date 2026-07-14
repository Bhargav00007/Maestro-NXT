'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import domtoimage from 'dom-to-image-more';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  apiUrl?: string;
  welcomeMessage?: string;
  inputPlaceholder?: string;
  chatTitle?: string;
}

export default function AIChat({
  apiUrl = 'https://watchwing.vercel.app/api/describe',
  welcomeMessage = "Hi there! I'm WatchWing AI. I can see your screen and help you with testing, debugging, or anything you're working on. What can I assist you with?",
  inputPlaceholder = 'Ask about your screen or testing...',
  chatTitle = 'WatchWing AI',
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('aiChatMessages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
          return;
        }
      } catch {}
    }
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
  }, [welcomeMessage]);

  useEffect(() => {
    sessionStorage.setItem('aiChatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const captureWebpage = async (): Promise<string | null> => {
    try {
      let target = document.getElementById('__next');
      if (!target) target = document.querySelector('main') as HTMLElement;
      if (!target) target = document.body;

      const dataUrl = await domtoimage.toJpeg(target, {
        quality: 0.6,
        bgcolor: '#ffffff',
        width: window.innerWidth,
        height: window.innerHeight,
        filter: (node: Node) => {
          if (node === chatContainerRef.current) return false;
          return true;
        },
      });
      return dataUrl;
    } catch (err) {
      console.error('Page capture error:', err);
      setError('Could not capture the page. Please refresh and try again.');
      return null;
    }
  };

  const formatMessage = (content: string): React.ReactNode => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let inList = false;

    const renderInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={`li-${idx}`} className="ml-4 list-disc">
            {renderInline(trimmed.slice(2))}
          </li>
        );
      } else {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${idx}`} className="mb-1">{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        if (trimmed) {
          elements.push(
            <p key={`p-${idx}`} className="mb-1">
              {renderInline(trimmed)}
            </p>
          );
        } else {
          elements.push(<br key={`br-${idx}`} />);
        }
      }
    });
    if (inList && listItems.length > 0) {
      elements.push(<ul key="ul-final">{listItems}</ul>);
    }
    return elements;
  };

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    setIsCapturing(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const imageDataUrl = await captureWebpage();

    setIsCapturing(false);

    if (!imageDataUrl) {
      setIsLoading(false);
      return;
    }

    try {
      const requestBody = {
        prompt: trimmed,
        image: imageDataUrl,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      let assistantContent: string;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        assistantContent = data.response || data.reply || data.message || data.content || data.text || data.description || JSON.stringify(data);
      } else {
        assistantContent = await response.text();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Sorry, I couldn't process your request. ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const primaryColor = '#5C1F9C';

  return (
    <>
      <button
        onClick={toggleOpen}
        className="chat-toggle-button fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: primaryColor }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <span className="font-medium text-sm">Ask AI</span>}
      </button>

      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[500px] max-h-[70vh]'
          } ${isCapturing ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-sm">{chatTitle}</span>
            </div>
            <button
              onClick={toggleOpen}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100%-110px)] bg-gray-50 dark:bg-gray-800/50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                      }`}
                      style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {formatMessage(message.content)}
                      </div>
                      <span
                        className={`text-[10px] mt-1 block ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-center text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    ⚠️ {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900"
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={inputPlaceholder}
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="rounded-xl px-4 py-2 text-white hover:shadow-lg transition-shadow duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: primaryColor }}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}