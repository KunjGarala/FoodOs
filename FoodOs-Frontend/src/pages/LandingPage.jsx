import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  CheckCircle, ChefHat, LayoutGrid, Smartphone,
  TrendingUp, Users, Shield, Star, Menu, ArrowRight, X,
  Zap, Clock, BarChart3, Globe
} from 'lucide-react';
import { BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import logoUrl from '../assets/foodos-logo.svg';

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
      <p className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-txt-light mb-1 tracking-[-0.02em]">
        {isDecimal ? (count / 10).toFixed(1) : count}
        <span className="text-marigold">{suffix}</span>
      </p>
      <p className="text-sm text-txt-mutedDark font-medium">{label}</p>
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
    <div className="min-h-screen bg-ink font-sans text-txt-light antialiased">

      {/* ==================== NAVBAR ==================== */}
      <nav className={cn(
        'fixed top-0 w-full z-50 transition-all duration-500',
        scrolled
          ? 'bg-ink/90 backdrop-blur-xl border-b border-ink-line/60 shadow-float'
          : 'bg-transparent',
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-18">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <img src={logoUrl} alt="FoodOS" className="h-9 w-9 rounded-tile" />
              <span className="font-display font-bold text-xl tracking-tight text-txt-light">
                Food<span className="text-marigold">OS</span>
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {['Features', 'How it Works', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-4 py-2 text-sm text-txt-mutedDark hover:text-txt-light font-medium rounded-input hover:bg-white/[0.05] transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <BtnPrimary onClick={() => navigate('/app')}>
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </BtnPrimary>
              ) : (
                <>
                  <BtnGhost
                    onClick={handleSignIn}
                    className="border-transparent bg-transparent text-txt-mutedDark hover:bg-white/[0.06] hover:text-txt-light"
                  >
                    Sign In
                  </BtnGhost>
                  <BtnPrimary onClick={handleGetStarted}>
                    Get Started
                  </BtnPrimary>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-txt-mutedDark hover:text-txt-light hover:bg-white/10 rounded-input transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={cn(
          'md:hidden overflow-hidden transition-all duration-300',
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
        )}>
          <div className="bg-ink/95 backdrop-blur-xl border-t border-ink-line/60 px-4 py-4 space-y-1">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 text-txt-mutedDark hover:text-txt-light hover:bg-white/[0.05] font-medium rounded-input transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-ink-line/60 space-y-2">
              {isAuthenticated ? (
                <BtnPrimary
                  className="w-full h-11"
                  onClick={() => { setMobileMenuOpen(false); navigate('/app'); }}
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </BtnPrimary>
              ) : (
                <>
                  <BtnGhost
                    className="w-full h-11 border-ink-line bg-transparent text-txt-light hover:bg-white/[0.05]"
                    onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                  >
                    Sign In
                  </BtnGhost>
                  <BtnPrimary
                    className="w-full h-11"
                    onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                  >
                    Get Started
                  </BtnPrimary>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <header className="relative overflow-hidden">
        {/* Radial brand glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(252,163,17,0.14),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28 text-center">
          <p className="eyebrow text-marigold text-xs mb-5">Restaurant Operating System</p>
          <h1 className="font-display font-bold text-txt-light tracking-[-0.03em] text-4xl sm:text-6xl lg:text-7xl leading-[1.05]">
            Served with <span className="text-marigold">precision.</span>
            <br className="hidden sm:block" /> Every time.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-txt-mutedDark">
            Tables, orders, kitchen, billing and analytics — one fast, beautifully simple
            system that keeps your whole floor in sync.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <BtnPrimary onClick={() => navigate('/app')} className="h-auto px-8 py-3.5 rounded-full text-base font-bold">
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </BtnPrimary>
            ) : (
              <>
                <BtnPrimary onClick={handleGetStarted} className="h-auto px-8 py-3.5 rounded-full text-base font-bold">
                  Get Started for Free <ArrowRight className="h-5 w-5" />
                </BtnPrimary>
                <BtnGhost
                  onClick={handleSignIn}
                  className="h-auto px-8 py-3.5 rounded-full text-base border-ink-line bg-transparent text-txt-light hover:bg-white/[0.05]"
                >
                  Sign In
                </BtnGhost>
              </>
            )}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-txt-mutedDark">
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 text-gold fill-gold" />
              ))}
            </span>
            <span className="font-medium">4.9/5</span>
            <span className="text-txt-faintDark">from 500+ restaurants</span>
          </div>
        </div>
      </header>

      {/* ==================== CONTENT SECTIONS ==================== */}
      <div className="relative z-10">

        {/* ── STATS BAR ── */}
        <Section className="py-14 border-y border-ink-line/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="eyebrow text-center text-xs text-txt-faintDark mb-10">
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
              <p className="eyebrow text-marigold text-xs mb-4">Powerful Features</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-txt-light leading-tight tracking-[-0.02em]">
                Everything you need to run<br className="hidden sm:block" />
                <span className="text-marigold"> a modern restaurant</span>
              </h2>
              <p className="mt-5 text-lg text-txt-mutedDark max-w-2xl mx-auto">
                Powerful features packed in a beautifully simple interface. No training manual needed.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {features.map((feature, idx) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="group relative rounded-card border border-ink-line/50 bg-ink-card/40 backdrop-blur-sm p-7 sm:p-8 hover:bg-ink-card/70 transition-all duration-300 hover:border-marigold/30 hover:-translate-y-1"
                  >
                    <div className="h-12 w-12 rounded-tile bg-marigold/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <FeatureIcon className="h-6 w-6 text-marigold" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-txt-light mb-2">{feature.title}</h3>
                    <p className="text-txt-mutedDark leading-relaxed text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section id="how-it-works" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="eyebrow text-marigold text-xs mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-txt-light leading-tight tracking-[-0.02em]">
                Simplifying operations<br className="hidden sm:block" />
                <span className="text-marigold"> from day one</span>
              </h2>
              <p className="mt-5 text-lg text-txt-mutedDark max-w-2xl mx-auto">
                Setup takes less than 15 minutes. Train your staff in minutes, not days.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={idx} className="relative group">
                    {idx < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-ink-line to-transparent" />
                    )}
                    <div className="relative rounded-card border border-ink-line/50 bg-ink-card/40 p-6 text-center hover:bg-ink-card/70 transition-all duration-300 hover:border-marigold/30">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-tile bg-marigold/15 border border-marigold/20 mb-4">
                        <StepIcon className="h-6 w-6 text-marigold" />
                      </div>
                      <p className="eyebrow text-xs text-marigold/70 mb-2">STEP {step.num}</p>
                      <h4 className="text-lg font-display font-bold text-txt-light mb-2">{step.title}</h4>
                      <p className="text-txt-mutedDark text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── TESTIMONIAL + BENEFITS ── */}
        <Section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-marigold/10 via-marigold/[0.04] to-transparent" />
              <div className="absolute inset-0 border border-marigold/15 rounded-card" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 p-8 sm:p-12 lg:p-16">
                <div className="flex-1">
                  <p className="eyebrow text-marigold text-xs mb-4">Why Switch?</p>
                  <h2 className="text-3xl sm:text-4xl font-display font-bold text-txt-light mb-8 tracking-[-0.02em]">
                    Why restaurants<br />
                    <span className="text-marigold">love FoodOS</span>
                  </h2>
                  <ul className="space-y-4">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-success-bright" />
                        </div>
                        <span className="text-base sm:text-lg font-medium text-txt-light">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-shrink-0 w-full max-w-md">
                  <div className="relative rounded-card border border-ink-line/60 bg-ink-card/60 backdrop-blur-sm p-7 sm:p-8">
                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-marigold rounded-full flex items-center justify-center shadow-float">
                      <span className="text-ink font-bold text-xs">&ldquo;</span>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-12 w-12 rounded-full bg-marigold flex items-center justify-center font-display font-bold text-ink text-lg">
                        R
                      </div>
                      <div>
                        <p className="font-display font-bold text-txt-light">Rajesh Kumar</p>
                        <p className="text-sm text-txt-mutedDark">Owner, Spicy Wok</p>
                      </div>
                    </div>
                    <p className="text-txt-mutedDark italic leading-relaxed">
                      &ldquo;FoodOS changed how we manage our weekends. The KOT system is a lifesaver, and the billing is super fast. Highly recommended!&rdquo;
                    </p>
                    <div className="flex gap-1 mt-5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-4 w-4 text-gold fill-gold" />
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
              <p className="eyebrow text-marigold text-xs mb-4">Pricing</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-txt-light leading-tight tracking-[-0.02em]">
                Simple, transparent<br className="hidden sm:block" />
                <span className="text-marigold"> pricing</span>
              </h2>
              <p className="mt-5 text-lg text-txt-mutedDark">No hidden fees. Cancel anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
              {pricing.map((plan, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'relative rounded-card p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1',
                    plan.popular
                      ? 'bg-gradient-to-b from-marigold/10 to-marigold/[0.04] border-2 border-marigold/40 shadow-float md:scale-105 z-10'
                      : 'bg-ink-card/40 border border-ink-line/50 hover:border-marigold/30',
                  )}
                >
                  {plan.popular && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-marigold text-ink px-4 py-1 rounded-full text-xs font-bold tracking-wide shadow-float">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-display font-bold text-txt-light">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl sm:text-5xl font-display font-extrabold text-txt-light tracking-[-0.02em]">{plan.price}</span>
                    <span className="ml-2 text-txt-mutedDark text-sm">/{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-4 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center text-txt-mutedDark text-sm">
                        <CheckCircle className="h-5 w-5 text-success-bright mr-3 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  {plan.popular ? (
                    <BtnPrimary className="w-full h-12" onClick={handleGetStarted}>
                      {isAuthenticated ? 'Go to Dashboard' : plan.cta}
                    </BtnPrimary>
                  ) : (
                    <BtnGhost
                      className="w-full h-12 border-ink-line bg-transparent text-txt-light hover:bg-white/[0.05]"
                      onClick={handleGetStarted}
                    >
                      {isAuthenticated ? 'Go to Dashboard' : plan.cta}
                    </BtnGhost>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── FINAL CTA ── */}
        <Section className="py-24 sm:py-32 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-marigold/10 via-marigold/[0.04] to-gold/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-txt-light mb-6 leading-tight tracking-[-0.02em]">
                  Ready to modernize<br />your restaurant?
                </h2>
                <p className="text-lg text-txt-mutedDark mb-10 max-w-xl mx-auto">
                  Join 500+ restaurants already using FoodOS to cut chaos and boost revenue.
                </p>
                <BtnPrimary
                  onClick={handleGetStarted}
                  className="h-auto px-10 py-4 rounded-full text-lg font-bold shadow-float hover:scale-105"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                  <ArrowRight className="h-5 w-5" />
                </BtnPrimary>
              </div>
            </div>
          </div>
        </Section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-ink-line/40 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src={logoUrl} alt="FoodOS" className="h-8 w-8 rounded-tile" />
                  <span className="font-display font-bold text-lg text-txt-light">
                    Food<span className="text-marigold">OS</span>
                  </span>
                </div>
                <p className="text-sm text-txt-mutedDark leading-relaxed">
                  Making restaurant management simple, efficient, and profitable.
                </p>
              </div>
              <div>
                <h4 className="eyebrow text-txt-light text-xs mb-4">Product</h4>
                <ul className="space-y-2.5 text-sm text-txt-mutedDark">
                  <li><a href="#features" className="hover:text-marigold transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-marigold transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-marigold transition-colors">Hardware</a></li>
                </ul>
              </div>
              <div>
                <h4 className="eyebrow text-txt-light text-xs mb-4">Company</h4>
                <ul className="space-y-2.5 text-sm text-txt-mutedDark">
                  <li><a href="#" className="hover:text-marigold transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-marigold transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-marigold transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="eyebrow text-txt-light text-xs mb-4">Contact</h4>
                <ul className="space-y-2.5 text-sm text-txt-mutedDark">
                  <li>support@foodos.app</li>
                  <li>+91 98765 43210</li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-ink-line/40 text-center text-txt-faintDark text-sm">
              &copy; 2026 FoodOS Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
