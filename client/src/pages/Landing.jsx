import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// --- ANIMATION WRAPPER COMPONENT ---
const RevealOnScroll = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1, 
        rootMargin: "0px 0px -50px 0px" 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- UI COMPONENTS ---
const FeatureCard = ({ iconPath, iconColor, iconBg, title, description }) => (
  <div className="h-full group bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-start hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 cursor-pointer">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${iconBg} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#6366f1] transition-colors duration-300">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  // Added h-full here so the card stretches to match the tallest item in the row
  <div className="h-full bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 z-10">
    <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110 cursor-default">
      <span className="text-2xl font-black text-[#6366f1]">{number}</span>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col overflow-x-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 transition-all duration-300">
        <nav className="w-full px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: '#3b82f6' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">NeuroDesk</span>
          </div>
          
          <div className="hidden md:flex space-x-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">How it Works</a>
          </div>
          
          <div className="flex items-center space-x-5">
            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link to="/register" className="px-4 py-2 bg-[#6366f1] text-white text-sm font-semibold rounded-full shadow-sm hover:bg-indigo-600 transition-all hover:shadow-md hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <div className="flex-grow">
        {/* HERO SECTION */}
        <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 flex flex-col items-center text-center relative">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-indigo-400/20 rounded-full blur-[100px] -z-10"></div>

          <RevealOnScroll delay={100}>
            <div className="inline-flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm mb-8 hover:shadow-md hover:border-indigo-100 transition-all cursor-default">
              <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-600">NeuroDesk Beta is now available</span>
            </div>
          </RevealOnScroll>
          
          <RevealOnScroll delay={200}>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight max-w-4xl">
              Your mind is for thinking, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#ec4899]">not for storing.</span>
            </h1>
          </RevealOnScroll>
          
          <RevealOnScroll delay={300}>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Offload your cognitive burden. NeuroDesk is an AI-powered workspace that seamlessly unifies your tasks, notes, goals, and daily schedule into one pristine dashboard.
            </p>
          </RevealOnScroll>
          
          <RevealOnScroll delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="px-8 py-4 bg-[#6366f1] text-white text-base font-medium rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-600 hover:shadow-indigo-500/40 transition-all hover:-translate-y-1 w-full sm:w-auto text-center group flex items-center justify-center space-x-2">
                <span>Start for free</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white text-gray-700 border border-gray-200 text-base font-medium rounded-full shadow-sm hover:bg-gray-50 hover:shadow-md transition-all w-full sm:w-auto text-center hover:-translate-y-1">
                Go to Dashboard
              </Link>
            </div>
          </RevealOnScroll>
        </main>

        {/* FULL FEATURES SECTION */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-200/50">
          <RevealOnScroll>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Everything you need to reach flow state</h2>
              <p className="text-gray-500 text-lg">We stripped away the clutter and kept only the powerful tools that actually help you get deep work done.</p>
            </div>
          </RevealOnScroll>

          {/* Added h-full to RevealOnScroll to ensure all feature cards stretch equally */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RevealOnScroll delay={100} className="h-full"><FeatureCard title="Smart Memory Vault" description="Instantly capture ideas, links, and notes. Our AI auto-tags and organizes everything so you never lose a fleeting thought again." iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" iconBg="bg-pink-50" iconColor="text-pink-500"/></RevealOnScroll>
            <RevealOnScroll delay={200} className="h-full"><FeatureCard title="Intelligent Task Routing" description="Stop staring at massive to-do lists. NeuroDesk filters your tasks and shows you exactly what needs your attention right now." iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" iconBg="bg-blue-50" iconColor="text-[#3b82f6]"/></RevealOnScroll>
            <RevealOnScroll delay={300} className="h-full"><FeatureCard title="AI Schedule Assistant" description="Let our AI analyze your workload and suggest optimal time-blocks, ensuring you have time for deep work and avoiding burnout." iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" iconBg="bg-indigo-50" iconColor="text-[#6366f1]"/></RevealOnScroll>
            <RevealOnScroll delay={100} className="h-full"><FeatureCard title="Frictionless Journaling" description="End your day with a brain dump. Track your mood, log your wins, and let the dashboard map your productivity trends over time." iconPath="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" iconBg="bg-emerald-50" iconColor="text-emerald-500"/></RevealOnScroll>
            <RevealOnScroll delay={200} className="h-full"><FeatureCard title="Unified Knowledge Base" description="Connect your goals to your daily tasks. Keep your high-level vision and your granular to-dos visible on the same screen." iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" iconBg="bg-orange-50" iconColor="text-orange-500"/></RevealOnScroll>
            <RevealOnScroll delay={300} className="h-full"><FeatureCard title="Distraction-Free UI" description="Designed with premium glassmorphism, soft typography, and intentional whitespace to keep your eyes relaxed and your mind focused." iconPath="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" iconBg="bg-purple-50" iconColor="text-purple-500"/></RevealOnScroll>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <RevealOnScroll>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">How NeuroDesk works</h2>
                <p className="text-gray-500">From chaos to absolute clarity in three simple steps.</p>
              </div>
            </RevealOnScroll>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Added className="h-full" here as well so the wrapper expands */}
              <RevealOnScroll delay={100} className="h-full">
                <StepCard number="1" title="Dump your brain" description="Input every meeting note, random idea, and task into your inbox. Don't worry about organizing it yet." />
              </RevealOnScroll>
              <RevealOnScroll delay={300} className="h-full">
                <StepCard number="2" title="AI sorts the chaos" description="NeuroDesk automatically categorizes your inputs into actionable tasks, reference notes, or calendar events." />
              </RevealOnScroll>
              <RevealOnScroll delay={500} className="h-full">
                <StepCard number="3" title="Execute with focus" description="Open your dashboard to a beautifully prioritized list. Just look at the top item and start working." />
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <RevealOnScroll>
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] rounded-[2rem] p-12 text-center shadow-2xl relative overflow-hidden group hover:shadow-indigo-900/50 transition-shadow duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Ready to organize your life?</h2>
              <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                Join the beta today and experience what it feels like to have an AI assistant that actually understands how you work.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
                <Link to="/register" className="px-8 py-4 bg-white text-indigo-900 text-base font-bold rounded-full shadow-lg hover:bg-gray-50 transition-all hover:scale-105 hover:shadow-xl w-full sm:w-auto">
                  Create Free Account
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </div>

      {/* PROFESSIONAL SAAS FOOTER */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-8 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: '#3b82f6' }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">NeuroDesk</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
                The AI-powered workspace designed to help you organize your thoughts, tasks, and files with zero friction.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Help Center</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} NeuroDesk Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <span className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>All systems operational</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;