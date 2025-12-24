'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AVAILABLE_MODELS, 
  AgentTemplate,
  CreateAgentRequest,
  ApiResponse,
  Agent
} from '@/types/database';

const AVATAR_COLORS = [
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
  '#EF4444', '#06B6D4', '#6366F1', '#F97316', '#14B8A6'
];

export default function CreateAgentPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    system_prompt: '',
    model_id: 'meta-llama/Llama-3.2-3B-Instruct',
    temperature: 0.7,
    max_tokens: 512,
    avatar_color: AVATAR_COLORS[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (): Promise<void> => {
    try {
      const response = await fetch('/api/templates');
      const data: ApiResponse<AgentTemplate[]> = await response.json();

      if (response.ok && data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleTemplateSelect = (template: AgentTemplate): void => {
    setSelectedTemplate(template.id);
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      system_prompt: template.system_prompt,
      model_id: template.model_id,
      avatar_color: template.avatar_color
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Agent> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.success ? 'Failed to create agent' : data.error);
      }

      router.push(`/agents/${data.data.id}/chat`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
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
              <h1 className="text-3xl font-bold text-gray-900">Create Agent</h1>
              <p className="mt-1 text-sm text-gray-500">Configure your new AI agent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Start with a Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: template.avatar_color }}
                    >
                      {template.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="My Coding Assistant"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.name.length}/100 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Helps with coding and debugging"
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
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="You are a helpful assistant that..."
              maxLength={5000}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.system_prompt.length}/5000 characters</p>
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <select
              id="model"
              value={formData.model_id}
              onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categories.map(category => (
                <optgroup key={category} label={category}>
                  {AVAILABLE_MODELS.filter(m => m.category === category).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
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
                    formData.avatar_color === color
                      ? 'ring-4 ring-offset-2 ring-purple-600'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
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
                  value={formData.max_tokens}
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
              {isSubmitting ? 'Creating...' : 'Create Agent'}
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