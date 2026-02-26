import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  CheckCircle, ChefHat, LayoutGrid, Smartphone,
  TrendingUp, Users, Shield, Star, Menu, ArrowRight, X,
  Zap, Clock, BarChart3, Globe
} from 'lucide-react';
import Scene3D from '../components/landing/Scene3D';

/* ─── Animated counter hook ────────────────────────────────────────────────── */
function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return [count, ref];
}

/* ─── Scroll fade-in hook ──────────────────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

/* ─── Section wrapper with fade-in ─────────────────────────────────────────── */
function Section({ children, className = '', id }) {
  const [ref, visible] = useFadeIn();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

/* ─── Stat Item ────────────────────────────────────────────────────────────── */
function StatItem({ value, suffix, label, isDecimal }) {
  const [count, ref] = useCountUp(isDecimal ? value * 10 : value, 2000);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1">
        {isDecimal ? (count / 10).toFixed(1) : count}
        <span className="text-amber-400">{suffix}</span>
      </p>
      <p className="text-sm text-white/40 font-medium">{label}</p>
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: LayoutGrid,
      title: "Table & Floor Plan",
      description: "Drag-and-drop table management with real-time occupancy status and color coding.",
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20"
    },
    {
      icon: Smartphone,
      title: "Fast Order Entry",
      description: "Quick order taking interface designed for minimal clicks. Works perfectly on tablets.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20"
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Digital KOTs go straight to the kitchen. Track preparation time and order status.",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20"
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Role-based access control for owners, managers, waiters, and kitchen staff.",
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/20"
    },
    {
      icon: TrendingUp,
      title: "CRM & Loyalty",
      description: "Built-in customer profiles, order history, and automatic birthday rewards.",
      gradient: "from-rose-500/20 to-pink-500/20",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20"
    },
    {
      icon: Shield,
      title: "Smart Billing",
      description: "Split bills, merge tables, and handle multiple payment modes including UPI.",
      gradient: "from-sky-500/20 to-indigo-500/20",
      iconColor: "text-sky-400",
      borderColor: "border-sky-500/20"
    }
  ];

  const steps = [
    { num: "01", title: "Set Up Menu", desc: "Upload your dishes, variants, and define your floor plan.", icon: Globe },
    { num: "02", title: "Take Orders", desc: "Staff takes orders via tablet or POS. KOT sent instantly.", icon: Zap },
    { num: "03", title: "Serve & Bill", desc: "Track table time, generate bill, and collect feedback.", icon: Clock },
    { num: "04", title: "Grow Business", desc: "Analyze reports to identify top sellers and busy hours.", icon: BarChart3 }
  ];

  const benefits = [
    "Reduce order errors by 90%",
    "Increase table turnover rate",
    "Prevent pilferage & theft",
    "Retain customers with loyalty"
  ];

  const pricing = [
    {
      name: "Starter",
      price: "\u20B90",
      period: "Forever",
      features: ["50 Orders/month", "Basic Reporting", "1 Staff Login", "Email Support"],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "\u20B91,499",
      period: "per month",
      features: ["Unlimited Orders", "Advanced Analytics", "5 Staff Logins", "Inventory Management"],
      cta: "Go Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: ["Multi-outlet Chain", "Custom Integrations", "Dedicated Manager", "White Labelling"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const stats = [
    { value: 500, suffix: '+', label: 'Restaurants' },
    { value: 98, suffix: '%', label: 'Uptime' },
    { value: 2, suffix: 'M+', label: 'Orders Processed' },
    { value: 4.9, suffix: '/5', label: 'Rating', isDecimal: true }
  ];

  const handleGetStarted = () => navigate(isAuthenticated ? '/app' : '/signup');
  const handleSignIn = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans text-white antialiased">

      {/* ==================== NAVBAR ==================== */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-18">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <ChefHat className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Food<span className="text-amber-400">OS</span>
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {['Features', 'How it Works', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white font-medium rounded-lg hover:bg-white/[0.05] transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] transition-all duration-200"
                >
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] transition-all duration-200"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-4 space-y-1">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 text-white/70 hover:text-white hover:bg-white/[0.05] font-medium rounded-lg transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-2">
              {isAuthenticated ? (
                <button
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-black inline-flex items-center justify-center"
                  onClick={() => { setMobileMenuOpen(false); navigate('/app'); }}
                >
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    className="w-full h-11 rounded-xl text-sm font-medium border border-white/10 text-white hover:bg-white/[0.05] inline-flex items-center justify-center"
                    onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                  >
                    Sign In
                  </button>
                  <button
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-black inline-flex items-center justify-center"
                    onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== 3D HERO ==================== */}
      <Scene3D onNavigate={handleGetStarted} />

      {/* ==================== CONTENT SECTIONS ==================== */}
      <div className="relative z-10">

        {/* Smooth gradient transition from 3D scene */}
        <div className="h-24 bg-gradient-to-b from-[#0D0A06] to-[#0A0A0F]" />

        {/* ── STATS BAR ── */}
        <Section className="py-14 border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-[0.25em] mb-10">
              Trusted by 500+ top restaurants across India
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <StatItem key={idx} {...stat} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── FEATURES ── */}
        <Section id="features" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-amber-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">Powerful Features</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Everything you need to run<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400"> a modern restaurant</span>
              </h2>
              <p className="mt-5 text-lg text-white/50 max-w-2xl mx-auto">
                Powerful features packed in a beautifully simple interface. No training manual needed.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border ${feature.borderColor} bg-white/[0.02] backdrop-blur-sm p-7 sm:p-8 hover:bg-white/[0.05] transition-all duration-300 hover:border-white/10 hover:-translate-y-1`}
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section id="how-it-works" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Simplifying operations<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> from day one</span>
              </h2>
              <p className="mt-5 text-lg text-white/50 max-w-2xl mx-auto">
                Setup takes less than 15 minutes. Train your staff in minutes, not days.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                  <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition-all duration-300 hover:border-white/10">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 mb-4">
                      <step.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-xs font-bold text-blue-400/60 tracking-widest mb-2">STEP {step.num}</p>
                    <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── TESTIMONIAL + BENEFITS ── */}
        <Section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />
              <div className="absolute inset-0 border border-amber-500/10 rounded-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 p-8 sm:p-12 lg:p-16">
                <div className="flex-1">
                  <p className="text-amber-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">Why Switch?</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
                    Why restaurants<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">love FoodOS</span>
                  </h2>
                  <ul className="space-y-4">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-base sm:text-lg font-medium text-white/80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-shrink-0 w-full max-w-md">
                  <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 sm:p-8">
                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <span className="text-black font-bold text-xs">&ldquo;</span>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-amber-500/20">
                        R
                      </div>
                      <div>
                        <p className="font-bold text-white">Rajesh Kumar</p>
                        <p className="text-sm text-white/40">Owner, Spicy Wok</p>
                      </div>
                    </div>
                    <p className="text-white/60 italic leading-relaxed">
                      &ldquo;FoodOS changed how we manage our weekends. The KOT system is a lifesaver, and the billing is super fast. Highly recommended!&rdquo;
                    </p>
                    <div className="flex gap-1 mt-5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── PRICING ── */}
        <Section id="pricing" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">Pricing</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Simple, transparent<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"> pricing</span>
              </h2>
              <p className="mt-5 text-lg text-white/50">No hidden fees. Cancel anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
              {pricing.map((plan, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-2 border-amber-500/30 shadow-xl shadow-amber-500/10 md:scale-105 z-10'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-4 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-amber-500/30">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="ml-2 text-white/40 text-sm">/{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-4 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center text-white/60 text-sm">
                        <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02]'
                        : 'border border-white/10 text-white hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                    onClick={handleGetStarted}
                  >
                    {isAuthenticated ? 'Go to Dashboard' : plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── FINAL CTA ── */}
        <Section className="py-24 sm:py-32 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-blue-500/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Ready to modernize<br />your restaurant?
                </h2>
                <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
                  Join 500+ restaurants already using FoodOS to cut chaos and boost revenue.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-10 py-4 rounded-full text-lg font-bold shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.04] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <ChefHat className="text-white h-4 w-4" />
                  </div>
                  <span className="font-bold text-lg text-white">
                    Food<span className="text-amber-400">OS</span>
                  </span>
                </div>
                <p className="text-sm text-white/35 leading-relaxed">
                  Making restaurant management simple, efficient, and profitable.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-4">Product</h4>
                <ul className="space-y-2.5 text-sm text-white/40">
                  <li><a href="#features" className="hover:text-amber-400 transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Hardware</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-4">Company</h4>
                <ul className="space-y-2.5 text-sm text-white/40">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-4">Contact</h4>
                <ul className="space-y-2.5 text-sm text-white/40">
                  <li>support@foodos.app</li>
                  <li>+91 98765 43210</li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/[0.04] text-center text-white/25 text-sm">
              &copy; 2026 FoodOS Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
