import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { User, Shield, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { STAFF } from '../../data/mockData';
import AddEmployee from './AddEmployee';

const StaffManagement = () => {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const handleEmployeeCreated = (data) => {
    console.log('Employee created:', data);
    // TODO: Refresh staff list or add new employee to state
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
           <p className="text-slate-500">Manage employees, roles and permissions</p>
        </div>
        <Button onClick={() => setIsAddEmployeeOpen(true)}>Add Employee</Button>
      </div>

      <AddEmployee 
        isOpen={isAddEmployeeOpen} 
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={handleEmployeeCreated}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAFF.map(staff => (
          <Card key={staff.id} className="hover:shadow-md transition-shadow">
            <div className="p-6 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                   <h3 className="font-semibold text-slate-800 text-lg">{staff.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <Shield className="h-3 w-3 text-blue-500" />
                     <span className="text-sm text-slate-500">{staff.role}</span>
                   </div>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
               <div className="text-xs text-slate-500 font-medium">
                 ID: EMP-{staff.id + 100}
               </div>
               <Badge variant="success">Active</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;
