import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Clock, CheckCircle } from 'lucide-react';
import { KOT_ITEMS } from '../../data/mockData';

const KitchenDisplay = () => {
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Kitchen Display System</h1>
           <p className="text-slate-500">Live feed of incoming orders</p>
        </div>
        <Badge variant="primary" className="text-lg px-4 py-1">Avg Time: 12m</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {KOT_ITEMS.map(kot => (
          <Card key={kot.id} className={`border-t-4 ${kot.status === 'pending' ? 'border-t-orange-500' : 'border-t-blue-500'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-xl font-bold text-slate-800">Table {kot.table}</h3>
                   <span className="text-xs text-slate-400 font-mono">#{kot.id + 1020}</span>
                </div>
                <Badge variant={kot.status === 'pending' ? 'warning' : 'primary'}>
                  {kot.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-500">
                <Clock className="h-3 w-3" />
                {kot.time}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {kot.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-sm">x{item.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-100">
                 <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors">
                   <CheckCircle className="h-4 w-4" />
                   Mark Prepared
                 </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KitchenDisplay;
