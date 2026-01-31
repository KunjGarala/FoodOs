import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, Clock, Receipt } from 'lucide-react';
import { TABLES } from '../../data/mockData';

const TableManagement = () => {
  const [activeSection, setActiveSection] = useState('All');
  const sections = ['All', 'Indoor', 'Bar', 'Outdoor', 'VIP'];

  const filteredTables = activeSection === 'All' 
    ? TABLES 
    : TABLES.filter(t => t.section === activeSection);

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-table-occupied border-yellow-400 text-yellow-900';
      case 'billing': return 'bg-table-billing border-green-400 text-green-900';
      default: return 'bg-table-free border-slate-300 text-slate-500 hover:border-blue-400 hover:bg-slate-50';
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="flex-1 flex flex-col">
        {/* Floor Plan Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Floor Plan</h1>
            <p className="text-slate-500">Manage tables and seating</p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200">
            {sections.map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeSection === section 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-auto p-1">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map(table => (
              <div 
                key={table.id}
                className={`
                  relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md
                  ${getStatusColor(table.status)}
                `}
              >
                <span className="text-2xl font-bold">{table.name}</span>
                <div className="flex items-center gap-1 mt-2 text-sm font-medium opacity-80">
                  <Users className="h-4 w-4" />
                  <span>{table.capacity} Seats</span>
                </div>
                
                {table.status !== 'free' && (
                  <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg py-1 px-2 text-xs font-semibold shadow-sm mb-1">
                      Rs. {table.bill}
                    </div>
                    {table.elapsed && (
                      <div className="inline-flex items-center gap-1 text-xs font-medium bg-black/5 rounded px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        {table.elapsed}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Active Tables Summary */}
      <Card className="w-80 flex flex-col h-full bg-white hidden lg:flex">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Live Status</h3>
          <Badge variant="success">8 Occupied</Badge>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {TABLES.filter(t => t.status !== 'free').map(table => (
            <div key={table.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                  {table.name}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Rs. {table.bill}</div>
                  <div className="text-xs text-slate-500">{table.elapsed} • {table.capacity} Guests</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Receipt className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
         <div className="p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-slate-500">Total Running</span>
             <span className="text-lg font-bold text-slate-800">Rs. 8,450</span>
           </div>
           <Button className="w-full">View All Bills</Button>
         </div>
      </Card>
    </div>
  );
};

export default TableManagement;
