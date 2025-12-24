'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Agent,
  Conversation,
  Message,
  ConversationWithAgent,
  ChatResponse,
  ApiResponse
} from '@/types/database';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<ConversationWithAgent[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchAgent();
      fetchConversations();
    }
  }, [isLoaded, userId, resolvedParams.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAgent = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/agents/${resolvedParams.id}`);
      const data: ApiResponse<Agent> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Agent not found' : data.error);
      }

      setAgent(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversations = async (): Promise<void> => {
    try {
      const response = await fetch('/api/conversations');
      const data: ApiResponse<ConversationWithAgent[]> = await response.json();

      if (response.ok && data.success) {
        const agentConvs = data.data.filter(c => c.agent_id === resolvedParams.id);
        setConversations(agentConvs);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const loadConversation = async (conversationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data: ApiResponse<{ messages: Message[]; id: string; agent_id: string; user_id: string; title: string; created_at: string; updated_at: string; last_message_at: string }> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Failed to load conversation' : data.error);
      }

      setCurrentConversation({
        id: data.data.id,
        agent_id: data.data.agent_id,
        user_id: data.data.user_id,
        title: data.data.title,
        created_at: data.data.created_at,
        updated_at: data.data.updated_at,
        last_message_at: data.data.last_message_at
      });
      setMessages(data.data.messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  const startNewConversation = (): void => {
    setCurrentConversation(null);
    setMessages([]);
    setInputMessage('');
    setError('');
  };

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsSending(true);

    const tempUserMessage: Message = {
      id: 'temp-user',
      conversation_id: currentConversation?.id || '',
      role: 'user',
      content: userMessage,
      tokens_used: 0,
      processing_time: 0,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/agents/${resolvedParams.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: currentConversation?.id
        })
      });

      const data: ApiResponse<ChatResponse> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Failed to send message' : data.error);
      }

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'temp-user');
        return [...filtered, data.data.message];
      });

      if (!currentConversation) {
        setCurrentConversation(data.data.conversation);
        fetchConversations();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ id: string }> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Failed to delete conversation' : data.error);
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        startNewConversation();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!userId) {
    router.push('/sign-in');
    return null;
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Agent not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-950">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: agent.avatar_color }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{agent.name}</h2>
              {agent.description && (
                <p className="text-xs text-gray-500 truncate">{agent.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No conversations yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    currentConversation?.id === conv.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      loadConversation(conv.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm text-gray-900 truncate flex-1">
                      {conv.title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering conversation load
                        handleDeleteConversation(conv.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 focus:outline-none"
                      aria-label="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(conv.last_message_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentConversation ? currentConversation.title : 'New Conversation'}
              </h1>
              <p className="text-sm text-gray-500">{agent.model_id.split('/')[1]}</p>
            </div>
            <Link
              href={`/agents/${resolvedParams.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Agent
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
                  style={{ backgroundColor: agent.avatar_color }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start chatting with {agent.name}
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  {agent.description || 'Your AI agent is ready to assist you'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    {message.processing_time > 0 && (
                      <p className="text-xs opacity-70 mt-2">
                        {message.processing_time}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={10000}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {inputMessage.length}/10,000 characters
          </p>
        </div>
      </div>
    </div>
  );
}