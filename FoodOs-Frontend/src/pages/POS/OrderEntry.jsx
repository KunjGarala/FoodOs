import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, ChefHat, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MENU_ITEMS, CATEGORIES } from '../../data/mockData';

const OrderEntry = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = cartTotal * 0.05; // 5% Tax
  const finalTotal = cartTotal + tax;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left: Menu Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search & Categories */}
        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search items by name or code..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-32"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-800 line-clamp-2">{item.name}</h3>
                  <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                    item.type === 'veg' ? 'border-green-600' : 'border-red-600'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      item.type === 'veg' ? 'bg-green-600' : 'bg-red-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-end">
                  <span className="font-bold text-slate-900">₹{item.price}</span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-50 px-1 rounded">{item.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart Summary */}
      <Card className="w-96 flex flex-col h-full border-0 shadow-lg ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <div className="flex justify-between items-center mb-1">
             <h2 className="font-bold text-lg text-slate-800">Hasnain Ali</h2>
             <Badge variant="primary">Table 4</Badge>
          </div>
          <p className="text-xs text-slate-500">Order #3492 • Waiter: Amit</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <div className="bg-slate-50 p-4 rounded-full mb-3">
                 <CreditCard className="h-8 w-8 text-slate-300" />
               </div>
               <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3">
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                     <p className="font-semibold text-slate-900 text-sm">₹{item.price * item.qty}</p>
                   </div>
                   <div className="flex items-center gap-3 mt-2">
                     <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all">
                          <Plus className="h-3 w-3" />
                        </button>
                     </div>
                   </div>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (5%)</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300">
               <ChefHat className="h-4 w-4 mr-2" />
               KOT
            </Button>
            <Button variant="primary" className="w-full bg-slate-900 hover:bg-slate-800">
               Charge
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderEntry;
