import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CheckCircle, ChefHat, LayoutGrid, Smartphone, TrendingUp, Users, Shield, Star, Menu, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: LayoutGrid,
      title: "Table & Floor Plan",
      description: "Drag-and-drop table management with real-time occupancy status and color coding."
    },
    {
      icon: Smartphone,
      title: "Fast Order Entry",
      description: "Quick order taking interface designed for minimal clicks. Works perfectly on tablets."
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Digital KOTs go straight to the kitchen. Track preparation time and order status."
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Role-based access control for owners, managers, waiters, and kitchen staff."
    },
    {
      icon: TrendingUp,
      title: "CRM & Loyalty",
      description: "Built-in customer profiles, order history, and automatic birthday rewards."
    },
    {
      icon: Shield,
      title: "Smart Billing",
      description: "Split bills, merge tables, and handle multiple payment modes including UPI."
    }
  ];

  const steps = [
    { num: "01", title: "Set Up Menu", desc: "Upload your dishes, variants, and define your floor plan." },
    { num: "02", title: "Take Orders", desc: "Staff takes orders via tablet or POS. KOT sent instantly." },
    { num: "03", title: "Serve & Bill", desc: "Track table time, generate bill, and collect feedback." },
    { num: "04", title: "Grow Business", desc: "Analyze reports to identify top sellers and busy hours." }
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
       price: "₹0",
       period: "Forever",
       features: ["50 Orders/month", "Basic Reporting", "1 Staff Login", "Email Support"],
       cta: "Start Free",
       variant: "outline"
    },
    {
       name: "Pro",
       price: "₹1,499",
       period: "per month",
       features: ["Unlimited Orders", "Advanced Analytics", "5 Staff Logins", "Inventory Management"],
       cta: "Go Pro",
       variant: "primary",
       popular: true
    },
    {
       name: "Enterprise",
       price: "Custom",
       period: "contact us",
       features: ["Multi-outlet Chain", "Custom Integrations", "Dedicated Manager", "White Labelling"],
       cta: "Contact Sales",
       variant: "outline"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ChefHat className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-900">FoodOS</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 font-medium">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium">How it Works</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 font-medium">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="hidden md:flex" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          The <span className="text-blue-600">Operating System</span> for <br /> Modern Restaurants.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
          Manage tables, orders, KOTs, billing, and customers from one simple, beautiful dashboard. 
          Designed for speed and reliability.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Button size="lg" className="rounded-full px-8 text-lg" onClick={() => navigate('/signup')}>
            Book Free Demo
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 text-lg">
            View Live Menu
          </Button>
        </div>
        
        {/* Mockup Image Placeholder */}
        <div className="relative mx-auto max-w-5xl rounded-2xl bg-slate-100 p-2 sm:p-4 border border-slate-200 shadow-2xl">
           <div className="aspect-[16/9] bg-white rounded-xl overflow-hidden relative group">
              {/* Abstract representation of UI */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                  <div className="text-center">
                     <p className="text-slate-400 font-medium text-sm lg:text-base">Interactive Dashboard Preview</p>
                     <p className="text-slate-300 text-xs mt-2">1280x800</p>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-10 bg-slate-50 border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-4 text-center">
             <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Trusted by 500+ Top Restaurants</p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
                 {/* Placeholder Logos */}
                 <div className="h-8 w-24 bg-slate-300 rounded"></div>
                 <div className="h-8 w-24 bg-slate-300 rounded"></div>
                 <div className="h-8 w-24 bg-slate-300 rounded"></div>
                 <div className="h-8 w-24 bg-slate-300 rounded"></div>
                 <div className="h-8 w-24 bg-slate-300 rounded"></div>
             </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need to run a restaurant</h2>
          <p className="mt-4 text-lg text-slate-600">Powerful features packed in a simple interface.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-12">
                 <div>
                    <h2 className="text-3xl font-bold mb-4">Simplifying Operations from Day 1</h2>
                    <p className="text-slate-400 text-lg">Setup takes less than 15 minutes. Train your staff in minutes, not days.</p>
                 </div>
                 <div className="space-y-8">
                    {steps.map((step, idx) => (
                       <div key={idx} className="flex gap-4">
                          <span className="text-2xl font-bold text-blue-500 opacity-60">{step.num}</span>
                          <div>
                             <h4 className="text-xl font-bold mb-1">{step.title}</h4>
                             <p className="text-slate-400">{step.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex-1 flex justify-center">
                 <div className="relative w-full max-w-md aspect-square bg-slate-800 rounded-2xl p-8 border border-slate-700">
                    <div className="h-full w-full bg-slate-700/50 rounded-xl flex items-center justify-center">
                        <span className="text-slate-500 font-mono">Workflow Animation</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="bg-blue-600 rounded-3xl p-12 overflow-hidden relative">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="text-white">
                  <h2 className="text-3xl font-bold mb-6">Why switch to FoodOS?</h2>
                  <ul className="space-y-4">
                     {benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3">
                           <CheckCircle className="h-6 w-6 text-blue-200" />
                           <span className="text-lg font-medium">{benefit}</span>
                        </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 text-xl">
                        R
                     </div>
                     <div>
                        <p className="font-bold text-slate-900">Rajesh Kumar</p>
                        <p className="text-sm text-slate-500">Owner, Spicy Wok</p>
                     </div>
                  </div>
                  <p className="text-slate-600 italic">"FoodOS changed how we manage our weekends. The KOT system is a lifesaver, and the billing is super fast. Highly recommended!"</p>
                  <div className="flex gap-1 mt-4 text-yellow-400">
                     {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-slate-600">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
               <Card key={idx} className={`relative p-8 ${plan.popular ? 'border-blue-500 shadow-xl scale-105 z-10' : ''}`}>
                  {plan.popular && (
                     <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Most Popular
                     </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                     <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                     <span className="ml-2 text-slate-500">{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-4 mb-8">
                     {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center text-slate-600">
                           <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                           {feat}
                        </li>
                     ))}
                  </ul>
                  <Button variant={plan.variant} className="w-full h-12" onClick={() => navigate('/signup')}>
                     {plan.cta}
                  </Button>
               </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
         <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-8">Ready to modernize your restaurant?</h2>
         <Button size="lg" className="rounded-full px-12 h-16 text-xl shadow-xl shadow-blue-200" onClick={() => navigate('/signup')}>
            Get Started for Free <ArrowRight className="ml-2 h-6 w-6" />
         </Button>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
               <div>
                  <div className="flex items-center gap-2 mb-4">
                     <ChefHat className="text-blue-600 h-6 w-6" />
                     <span className="font-bold text-xl text-slate-900">FoodOS</span>
                  </div>
                  <p className="text-sm text-slate-500">Making restaurant management simple, efficient, and profitable.</p>
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                     <li><a href="#" className="hover:text-blue-600">Features</a></li>
                     <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                     <li><a href="#" className="hover:text-blue-600">Hardware</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                     <li><a href="#" className="hover:text-blue-600">About Us</a></li>
                     <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                     <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                     <li>support@foodos.app</li>
                     <li>+91 98765 43210</li>
                  </ul>
               </div>
            </div>
            <div className="pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
               © 2026 FoodOS Inc. All rights reserved.
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
