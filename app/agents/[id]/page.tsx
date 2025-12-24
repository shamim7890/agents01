'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AVAILABLE_MODELS, 
  Agent,
  UpdateAgentRequest,
  ApiResponse
} from '@/types/database';

const AVATAR_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
  '#EF4444', '#06B6D4', '#6366F1', '#F97316', '#14B8A6'
];

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditAgentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<UpdateAgentRequest>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isLoaded && userId) {
      fetchAgent();
    }
  }, [isLoaded, userId, resolvedParams.id]);

  const fetchAgent = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/agents/${resolvedParams.id}`);
      const data: ApiResponse<Agent> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Agent not found' : data.error);
      }

      setAgent(data.data);
      setFormData({
        name: data.data.name,
        description: data.data.description || '',
        system_prompt: data.data.system_prompt,
        model_id: data.data.model_id,
        temperature: data.data.temperature,
        max_tokens: data.data.max_tokens,
        is_active: data.data.is_active,
        avatar_color: data.data.avatar_color
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/agents/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Agent> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Failed to update agent' : data.error);
      }

      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  const categories = Array.from(new Set(AVAILABLE_MODELS.map(m => m.category)));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Agent</h1>
              <p className="mt-1 text-sm text-gray-500">Update your agent configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">{(formData.name || '').length}/100 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              maxLength={200}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt *
            </label>
            <textarea
              id="system_prompt"
              required
              rows={6}
              value={formData.system_prompt || ''}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              maxLength={5000}
            />
            <p className="mt-1 text-xs text-gray-500">{(formData.system_prompt || '').length}/5000 characters</p>
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <select
              id="model"
              value={formData.model_id || agent.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categories.map(category => (
                <optgroup key={category} label={category}>
                  {AVAILABLE_MODELS.filter(m => m.category === category).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Color
            </label>
            <div className="flex space-x-2">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_color: color })}
                  className={`w-10 h-10 rounded-full transition-all ${
                    (formData.avatar_color || agent.avatar_color) === color
                      ? 'ring-4 ring-offset-2 ring-purple-600'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.is_active ?? agent.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Agent is active</span>
            </label>
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {formData.temperature ?? agent.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature ?? agent.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Higher = more creative, Lower = more focused</p>
              </div>
              <div>
                <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="max_tokens"
                  min="64"
                  max="4096"
                  step="64"
                  value={formData.max_tokens ?? agent.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}