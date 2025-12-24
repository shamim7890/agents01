"use client"; 
import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageSquare, Zap, Shield, Code, PenTool, Search, Palette, Globe, ChevronRight, Check, Github, Twitter, Mail, LogIn, UserPlus } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useUser, SignedIn, SignedOut } from '@clerk/nextjs';

export default function LandingPage() {
  const { isSignedIn, user } = useUser();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Unlimited AI Agents",
      description: "Create as many specialized AI assistants as you need, each with unique personalities and capabilities."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Multiple Conversations",
      description: "Organize separate conversations with each agent. Never lose context or mix up different topics."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "11 Powerful Models",
      description: "Choose from cutting-edge AI models including Llama, Mistral, Qwen, and more for different tasks."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Pre-Made Templates",
      description: "Start instantly with ready-to-use templates for coding, writing, research, creative work, and languages."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security. Only you can access your agents and conversations."
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Fully Customizable",
      description: "Fine-tune temperature, tokens, system prompts, and more to perfect each agent's behavior."
    }
  ];

  const templates = [
    { name: "Code Assistant", color: "from-blue-500 to-cyan-500", icon: <Code className="w-8 h-8" /> },
    { name: "Content Writer", color: "from-purple-500 to-pink-500", icon: <PenTool className="w-8 h-8" /> },
    { name: "Research Helper", color: "from-green-500 to-emerald-500", icon: <Search className="w-8 h-8" /> },
    { name: "Creative Muse", color: "from-orange-500 to-red-500", icon: <Sparkles className="w-8 h-8" /> },
    { name: "Language Tutor", color: "from-indigo-500 to-purple-500", icon: <Globe className="w-8 h-8" /> }
  ];

  const models = [
    "Meta Llama 3.2",
    "Mistral 7B",
    "Qwen 2.5",
    "Phi 3.5",
    "Gemma 2"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ top: '10%', left: '10%', animationDuration: '4s' }} />
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ bottom: '10%', right: '10%', animationDuration: '6s' }} />
        <div className="absolute w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ top: '50%', left: '50%', animationDuration: '5s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center transform rotate-3">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">AgentHub</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
              <a href="#templates" className="hover:text-purple-400 transition-colors">Templates</a>
              <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="flex items-center space-x-2 px-4 py-2 hover:text-purple-400 transition-colors">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Get Started</span>
                  </button>
                </SignUpButton>
              </SignedOut>
              
              <SignedIn>
                <a href="/dashboard" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105">
                  Go to Dashboard
                </a>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Now supporting 11+ AI models</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Your Personal Army of<br />AI Assistants
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Create unlimited specialized AI agents, each with unique personalities and expertise. 
            All organized in one powerful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center space-x-2">
              <span>Start Building Free</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-lg hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2">
              <Github className="w-5 h-5" />
              <span>View on GitHub</span>
            </button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {templates.map((template, idx) => (
                  <div 
                    key={idx}
                    className={`bg-gradient-to-br ${template.color} p-6 rounded-2xl transform hover:scale-110 transition-all cursor-pointer`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center space-y-2 text-white">
                      {template.icon}
                      <span className="font-semibold text-sm">{template.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-left">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center space-x-2">
                    <span className="text-purple-400">User:</span>
                    <span>Help me debug this React component</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-pink-400">Code Assistant:</span>
                    <span>I'll analyze the component for you...</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-300">Powerful features to supercharge your AI workflow</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all transform hover:scale-105 cursor-pointer ${
                  activeFeature === idx ? 'ring-2 ring-purple-500 bg-white/10' : ''
                }`}
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Start with Templates</h2>
            <p className="text-xl text-gray-300">Pre-configured agents ready to use in seconds</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all transform hover:scale-110 cursor-pointer"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform`}>
                  {template.icon}
                </div>
                <h3 className="text-center font-semibold">{template.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">11+ Powerful Models</h2>
              <p className="text-xl text-gray-300">Choose the perfect model for every task</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {models.map((model, idx) => (
                <div
                  key={idx}
                  className="bg-black/30 rounded-xl p-4 text-center hover:bg-black/50 transition-colors border border-white/10"
                >
                  <Check className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <span className="text-sm font-medium">{model}</span>
                </div>
              ))}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 text-center flex items-center justify-center">
                <span className="text-sm font-bold">+6 More</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">∞</div>
              <div className="text-xl font-semibold mb-1">Unlimited Agents</div>
              <div className="text-gray-400">Create as many as you need</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">11+</div>
              <div className="text-xl font-semibold mb-1">AI Models</div>
              <div className="text-gray-400">Latest and greatest</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-xl font-semibold mb-1">Type Safe</div>
              <div className="text-gray-400">Zero any types</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="relative z-10 py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Build Your<br />AI Dream Team?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Get started in less than 5 minutes. No credit card required.
          </p>
          <button className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto">
            <span>Start Building Now</span>
            <Zap className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-6">Open source • Self-hosted • Full control</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">AgentHub</span>
              </div>
              <p className="text-gray-400 text-sm">Your personal AI assistant platform</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Quick Start</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 AgentHub. Built with Next.js, Supabase, and ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}