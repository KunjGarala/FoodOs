import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Edit2, Trash2, Plus, Filter, MoreHorizontal } from 'lucide-react';
import { MENU_ITEMS } from '../../data/mockData';

const MenuManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState(MENU_ITEMS);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
           <p className="text-slate-500">Manage your items, categories and pricing</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
         <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1 max-w-sm">
               <Input placeholder="Search items..." />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
         </div>

         <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Item Name</th>
                     <th className="px-6 py-3">Category</th>
                     <th className="px-6 py-3">Price</th>
                     <th className="px-6 py-3">Type</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-900">
                           <div className="flex flex-col">
                             <span>{item.name}</span>
                             <span className="text-xs text-slate-400 font-mono">{item.code}</span>
                           </div>
                        </td>
                        <td className="px-6 py-3 text-slate-600 capitalize">{item.category}</td>
                        <td className="px-6 py-3 font-semibold">₹{item.price}</td>
                        <td className="px-6 py-3">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize border ${
                              item.type === 'veg' ? 'bg-green-50 text-green-700 border-green-200' : 
                              item.type === 'non-veg' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                           }`}>
                              {item.type}
                           </span>
                        </td>
                        <td className="px-6 py-3">
                           <Badge variant="success">Available</Badge>
                        </td>
                        <td className="px-6 py-3 text-right">
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                              <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>

      <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         title="Add New Menu Item"
         footer={
            <div className="flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button>Save Item</Button>
            </div>
         }
      >
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Item Name</label>
                  <Input placeholder="e.g. Butter Chicken" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Item Code</label>
                  <Input placeholder="e.g. M001" />
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                     <option>Starters</option>
                     <option>Main Course</option>
                     <option>Beverages</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Price (₹)</label>
                  <Input type="number" placeholder="0.00" />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">Description</label>
               <textarea className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" placeholder="Item description..." />
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default MenuManagement;
