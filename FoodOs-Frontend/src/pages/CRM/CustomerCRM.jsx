import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Gift, Calendar, Phone } from 'lucide-react';
import { CUSTOMERS } from '../../data/mockData';

const CustomerCRM = () => {
  return (
    <div className="flex flex-col h-full">
       <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Customer CRM</h1>
           <p className="text-slate-500">Loyalty program and customer insights</p>
        </div>
        <Button>
           <Gift className="h-4 w-4 mr-2" />
           New Campaign
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
         <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-md">
               <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
               <Input className="pl-10" placeholder="Search by name or phone number..." />
            </div>
         </div>
         
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Customer Name</th>
                     <th className="px-6 py-3">Phone</th>
                     <th className="px-6 py-3">Visits</th>
                     <th className="px-6 py-3">Last Visit</th>
                     <th className="px-6 py-3">Favorite Item</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {CUSTOMERS.map(customer => (
                     <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-900">{customer.name}</td>
                        <td className="px-6 py-3 text-slate-600">
                           <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                           </div>
                        </td>
                        <td className="px-6 py-3 text-slate-900 font-semibold">{customer.visits}</td>
                        <td className="px-6 py-3 text-slate-500">{customer.lastVisit}</td>
                        <td className="px-6 py-3">
                           <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                              {customer.favorite}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                           <Button variant="outline" size="sm">View History</Button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};

export default CustomerCRM;
