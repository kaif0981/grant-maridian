
import React, { useState, useMemo } from 'react';
import { Staff, AttendanceStatus, AttendanceRecord, Payout } from '../types';
import { 
  UserCircle, Shield, Phone, Plus, Trash2, Search, X, Users, 
  IndianRupee, Calendar, Briefcase, TrendingUp, Wallet, CheckCircle2,
  Clock, CheckCircle, AlertCircle, Coffee, Printer, Download, FileText, ChevronRight, HandCoins, History
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface StaffViewProps {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  payouts: Payout[];
  setPayouts: React.Dispatch<React.SetStateAction<Payout[]>>;
}

const StaffView: React.FC<StaffViewProps> = ({ staff, setStaff, payouts, setPayouts }) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ATTENDANCE' | 'PAYROLL'>('DIRECTORY');
  const [showAdd, setShowAdd] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState<Staff | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showPayslip, setShowPayslip] = useState<{ member: Staff; payroll: any } | null>(null);
  const [newMember, setNewMember] = useState<Partial<Staff>>({ 
    role: 'WAITER', 
    status: 'ACTIVE', 
    salary: 0, 
    paidHolidays: 12,
    holidaysTaken: 0,
    advanceTaken: 0,
    attendance: []
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const addMember = () => {
    if (newMember.name && newMember.phone) {
      setStaff(prev => [...prev, { 
        ...newMember, 
        id: `s${Date.now()}`,
        salary: Number(newMember.salary) || 0,
        paidHolidays: Number(newMember.paidHolidays) || 0,
        holidaysTaken: 0,
        advanceTaken: 0,
        attendance: []
      } as Staff]);
      setShowAdd(false);
      setNewMember({ role: 'WAITER', status: 'ACTIVE', salary: 0, paidHolidays: 12, holidaysTaken: 0, advanceTaken: 0, attendance: [] });
    }
  };

  const removeMember = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const issueAdvance = () => {
    if (!showAdvanceModal || !advanceAmount) return;
    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

    setStaff(prev => prev.map(s => 
      s.id === showAdvanceModal.id 
        ? { ...s, advanceTaken: (s.advanceTaken || 0) + amount } 
        : s
    ));
    setShowAdvanceModal(null);
    setAdvanceAmount('');
  };

  const markAttendance = (staffId: string, status: AttendanceStatus) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;

      const existingRecordIndex = s.attendance.findIndex(r => r.date === todayStr);
      let updatedAttendance = [...(s.attendance || [])];
      let updatedHolidaysTaken = s.holidaysTaken;

      if (existingRecordIndex !== -1 && updatedAttendance[existingRecordIndex].status === 'PAID_LEAVE') {
        updatedHolidaysTaken = Math.max(0, updatedHolidaysTaken - 1);
      }

      if (status === 'PAID_LEAVE') {
        if (updatedHolidaysTaken >= s.paidHolidays) {
          alert(`Staff ${s.name} has no paid holidays left!`);
          return s;
        }
        updatedHolidaysTaken += 1;
      }

      const newRecord: AttendanceRecord = { date: todayStr, status };

      if (existingRecordIndex !== -1) {
        updatedAttendance[existingRecordIndex] = newRecord;
      } else {
        updatedAttendance.push(newRecord);
      }

      return { ...s, attendance: updatedAttendance, holidaysTaken: updatedHolidaysTaken };
    }));
  };

  const filteredStaff = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return staff;
    
    return staff.filter(member => 
      member.name.toLowerCase().includes(term) || 
      member.id.toLowerCase().includes(term) ||
      member.role.toLowerCase().includes(term)
    );
  }, [staff, searchQuery]);

  const calculateMonthPayroll = (s: Staff) => {
    const yearMonth = selectedMonth; 
    const monthAttendance = s.attendance?.filter(r => r.date.startsWith(yearMonth)) || [];
    
    const presentCount = monthAttendance.filter(r => r.status === 'PRESENT').length;
    const unpaidAbsences = monthAttendance.filter(r => r.status === 'ABSENT').length;
    const halfDays = monthAttendance.filter(r => r.status === 'HALF_DAY').length;
    const paidLeaves = monthAttendance.filter(r => r.status === 'PAID_LEAVE').length;
    
    const isPaid = payouts.some(p => p.staffId === s.id && p.month === yearMonth);
    
    const daysInMonth = 30; 
    const dailyRate = s.salary / daysInMonth;
    const leaveDeduction = (unpaidAbsences * dailyRate) + (halfDays * dailyRate * 0.5);
    
    // If already paid, we don't subtract current advance balance from display total 
    // because that advance might be for NEXT month. Payout record stores historical amount.
    const advanceTaken = isPaid ? 0 : (s.advanceTaken || 0);
    
    return {
      total: Math.round(s.salary - leaveDeduction - (isPaid ? 0 : advanceTaken)),
      absences: unpaidAbsences,
      halfDays,
      paidLeaves,
      presentCount,
      leaveDeduction: Math.round(leaveDeduction),
      advanceTaken: Math.round(advanceTaken),
      baseSalary: s.salary,
      month: yearMonth,
      isPaid
    };
  };

  const handleConfirmPayout = (staffId: string, amount: number, month: string) => {
    // 1. Create a historical payout record
    const newPayout: Payout = {
      id: `PAY-${Date.now()}`,
      staffId,
      month,
      amount,
      timestamp: Date.now()
    };
    
    setPayouts(prev => [newPayout, ...prev]);

    // 2. Reset the advanceTaken for the next cycle
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, advanceTaken: 0 } : s
    ));
    
    alert(`Payout of ${formatCurrency(amount)} confirmed for ${month}. Salary advance settled.`);
    setShowPayslip(null);
  };

  const totalPayroll = useMemo(() => 
    staff.reduce((acc, curr) => acc + calculateMonthPayroll(curr).total, 0), 
  [staff, selectedMonth, payouts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Team Hub</h2>
          <p className="text-gray-400 text-sm font-medium">Directory, Daily Attendance, and Dynamic Payroll.</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('DIRECTORY')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'DIRECTORY' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Users size={16} /> Directory
          </button>
          <button 
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ATTENDANCE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Clock size={16} /> Attendance
          </button>
          <button 
            onClick={() => setActiveTab('PAYROLL')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'PAYROLL' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Wallet size={16} /> Payroll
          </button>
        </div>
      </div>

      {activeTab === 'DIRECTORY' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative group flex-1">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                <Search size={20} strokeWidth={3} />
              </div>
              <input 
                type="text" 
                placeholder="Search staff by name or role..."
                className="w-full pl-16 pr-24 py-5 bg-white border-2 border-transparent rounded-3xl text-sm font-bold shadow-sm outline-none focus:border-green-500/20 focus:ring-8 focus:ring-green-500/5 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-gray-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all"
            >
              <Plus size={18} strokeWidth={3} /> Add New Staff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map(member => (
              <div key={member.id} className="bg-white p-7 rounded-[40px] border border-gray-100 shadow-sm flex items-start gap-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden">
                <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-300 group-hover:bg-green-50 group-hover:text-green-600 transition-colors shrink-0">
                  <UserCircle size={40} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <h3 className="font-black text-gray-900 text-lg leading-tight truncate">{member.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Shield size={12} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{member.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowAdvanceModal(member)} className="p-2 text-gray-200 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Request Advance">
                        <HandCoins size={18} />
                      </button>
                      <button onClick={() => removeMember(member.id)} className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Phone size={14} className="text-gray-300" /> {member.phone}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{member.status}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        <Calendar size={12} /> {member.paidHolidays - member.holidaysTaken} Left
                      </div>
                    </div>
                    {member.advanceTaken > 0 && (
                      <div className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit mt-1">
                        ADVANCE: {formatCurrency(member.advanceTaken)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'ATTENDANCE' ? (
        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
             <div className="flex items-center gap-5">
                <div className="p-4 bg-white/10 rounded-2xl"><Calendar size={32} /></div>
                <div>
                   <h3 className="text-2xl font-black tracking-tight leading-none mb-1">Mark Today's Log</h3>
                   <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
             </div>
             <div className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Quick Filter:</span>
                <select className="bg-transparent border-none outline-none font-black text-sm text-white appearance-none cursor-pointer">
                   <option value="ALL" className="text-gray-900">All Departments</option>
                   <option value="WAITER" className="text-gray-900">Waiters</option>
                   <option value="CHEF" className="text-gray-900">Kitchen</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => {
              const todayRecord = member.attendance?.find(r => r.date === todayStr);
              const status = todayRecord?.status;

              return (
                <div key={member.id} className={`bg-white p-7 rounded-[40px] border-2 transition-all duration-300 flex flex-col gap-6 ${status ? 'border-blue-200' : 'border-gray-50 hover:border-blue-100'}`}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                        <UserCircle size={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-black text-gray-900 leading-tight truncate">{member.name}</h4>
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{member.role}</span>
                      </div>
                      {status === 'PRESENT' && <CheckCircle className="text-green-500 animate-in zoom-in duration-300" size={24} />}
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <AttendanceBtn 
                        active={status === 'PRESENT'} 
                        label="Present" 
                        icon={CheckCircle2} 
                        color="bg-green-600" 
                        onClick={() => markAttendance(member.id, 'PRESENT')} 
                      />
                      <AttendanceBtn 
                        active={status === 'ABSENT'} 
                        label="Absent" 
                        icon={X} 
                        color="bg-red-600" 
                        onClick={() => markAttendance(member.id, 'ABSENT')} 
                      />
                      <AttendanceBtn 
                        active={status === 'PAID_LEAVE'} 
                        label="Paid Leave" 
                        icon={Coffee} 
                        color="bg-blue-600" 
                        onClick={() => markAttendance(member.id, 'PAID_LEAVE')} 
                      />
                      <AttendanceBtn 
                        active={status === 'HALF_DAY'} 
                        label="Half Day" 
                        icon={Clock} 
                        color="bg-orange-600" 
                        onClick={() => markAttendance(member.id, 'HALF_DAY')} 
                      />
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 flex-1">
                <StatBox icon={IndianRupee} label="Estimated Payout" value={formatCurrency(totalPayroll)} color="bg-green-50 text-green-600" />
                <StatBox icon={Briefcase} label="Active Headcount" value={staff.length.toString()} color="bg-blue-50 text-blue-600" />
                <StatBox icon={TrendingUp} label="Month Variance" value="-4.2%" color="bg-orange-50 text-orange-600" />
             </div>
             <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100">
                <Calendar size={20} className="text-gray-400" />
                <input 
                  type="month" 
                  className="bg-transparent border-none outline-none font-black text-sm text-gray-900 cursor-pointer" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
             </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6">Staff Member</th>
                  <th className="px-8 py-6">Base Salary</th>
                  <th className="px-8 py-6 text-center">Month Log</th>
                  <th className="px-8 py-6 text-center text-green-600">Net Due</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map(member => {
                  const payroll = calculateMonthPayroll(member);
                  return (
                    <tr key={member.id} className={`transition-colors group ${payroll.isPaid ? 'bg-green-50/20 opacity-60' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                            <UserCircle size={24} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{member.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-gray-400">{formatCurrency(member.salary)}</td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                           {payroll.absences > 0 && (
                             <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                               <AlertCircle size={12} /> {payroll.absences} Abs
                             </span>
                           )}
                           {payroll.paidLeaves > 0 && (
                             <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                               <Coffee size={12} /> {payroll.paidLeaves} PL
                             </span>
                           )}
                           {payroll.advanceTaken > 0 && !payroll.isPaid && (
                             <span className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                               <HandCoins size={12} /> Adv
                             </span>
                           )}
                           {payroll.isPaid && (
                             <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-200">SETTLED</span>
                           )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className={`text-lg font-black ${payroll.isPaid ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {formatCurrency(payroll.total)}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         {payroll.isPaid ? (
                           <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Payout History Logged</span>
                         ) : (
                           <button 
                             onClick={() => setShowPayslip({ member, payroll })}
                             className="px-5 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                           >
                              Generate Payslip
                           </button>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* History of Payouts section */}
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <History className="text-gray-400" />
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Confirmed Payouts History</h3>
             </div>
             {payouts.length === 0 ? (
               <div className="py-20 text-center opacity-20">
                  <Wallet size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">No payout history found</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {payouts.map(pay => {
                   const m = staff.find(s => s.id === pay.staffId);
                   return (
                     <div key={pay.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{pay.month}</p>
                           <h4 className="font-black text-gray-900 leading-tight">{m?.name || 'Former Staff'}</h4>
                           <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(pay.timestamp)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-green-600">{formatCurrency(pay.amount)}</p>
                           <span className="text-[8px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">Paid Out</span>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><HandCoins size={20} /></div>
                   <h2 className="text-lg font-black text-gray-900 tracking-tight">Salary Advance</h2>
                </div>
                <button onClick={() => setShowAdvanceModal(null)} className="text-gray-300 hover:text-gray-900"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <p className="text-xs font-bold text-gray-500">Issue a salary advance to <span className="text-gray-900">{showAdvanceModal.name}</span>. This will be deducted from the current month's payout.</p>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Amount (₹)</label>
                   <input 
                     type="number" 
                     className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all" 
                     value={advanceAmount} 
                     onChange={e => setAdvanceAmount(e.target.value)} 
                     placeholder="0" 
                     autoFocus 
                   />
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => setShowAdvanceModal(null)} className="flex-1 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                 <button onClick={issueAdvance} className="flex-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">Approve Advance</button>
              </div>
           </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslip && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] print:p-0 print:shadow-none print:rounded-none">
              <div className="flex justify-between items-start mb-10 print:hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-[24px] flex items-center justify-center">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Staff Payslip</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period: {showPayslip.payroll.month}</p>
                  </div>
                </div>
                <button onClick={() => setShowPayslip(null)} className="p-3 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-2xl"><X size={20} /></button>
              </div>

              {/* Printable Area */}
              <div className="space-y-8">
                 <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                    <div>
                       <h3 className="text-xl font-black text-gray-900 leading-tight">{showPayslip.member.name}</h3>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{showPayslip.member.role}</p>
                       <p className="text-xs font-bold text-gray-400 mt-2">{showPayslip.member.phone}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generated On</p>
                       <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Monthly Salary</p>
                       <p className="text-2xl font-black text-gray-900">{formatCurrency(showPayslip.member.salary)}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-[32px] border border-red-100">
                       <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Deductions</p>
                       <p className="text-2xl font-black text-red-600">-{formatCurrency(showPayslip.payroll.leaveDeduction + showPayslip.payroll.advanceTaken)}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deduction Breakdown</h4>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Leave & Half-Days</span>
                          <span className="text-xs font-black text-gray-900">{formatCurrency(showPayslip.payroll.leaveDeduction)}</span>
                       </div>
                       <div className="p-4 bg-orange-50 rounded-2xl flex justify-between items-center">
                          <span className="text-[10px] font-black text-orange-400 uppercase">Cash Advances</span>
                          <span className="text-xs font-black text-orange-900">{formatCurrency(showPayslip.payroll.advanceTaken)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Attendance Summary</h4>
                    <div className="grid grid-cols-4 gap-2">
                       <AttendanceStat label="Present" val={showPayslip.payroll.presentCount} color="text-green-600 bg-green-50" />
                       <AttendanceStat label="Absent" val={showPayslip.payroll.absences} color="text-red-600 bg-red-50" />
                       <AttendanceStat label="Holidays" val={showPayslip.payroll.paidLeaves} color="text-blue-600 bg-blue-50" />
                       <AttendanceStat label="Half Day" val={showPayslip.payroll.halfDays} color="text-orange-600 bg-orange-50" />
                    </div>
                 </div>

                 <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-2xl shadow-gray-200">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable Amount</span>
                       <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">READY FOR PAYOUT</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(showPayslip.payroll.total)}</h3>
                 </div>

                 <div className="flex gap-4 pt-4 print:hidden">
                    <button onClick={() => window.print()} className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                       <Printer size={16} /> Print Payslip
                    </button>
                    <button 
                      onClick={() => handleConfirmPayout(showPayslip.member.id, showPayslip.payroll.total, showPayslip.payroll.month)} 
                      className="flex-2 bg-green-600 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       <CheckCircle2 size={16} /> Confirm Payout
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Onboard Staff</h2>
                <p className="text-gray-400 text-sm font-medium">Add a new team member and set payroll terms.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-xl"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Full Name</label>
                   <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Rahul Sharma" autoFocus />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Organizational Role</label>
                   <select className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value as any})}>
                      <option value="ADMIN">Administrator</option>
                      <option value="CHEF">Chef / Kitchen Staff</option>
                      <option value="WAITER">Waiter / Captain</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Contact Phone</label>
                   <input type="tel" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" value={newMember.phone || ''} onChange={e => setNewMember({...newMember, phone: e.target.value})} placeholder="+91 99999 00000" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Monthly Salary (₹)</label>
                   <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" value={newMember.salary || ''} onChange={e => setNewMember({...newMember, salary: Number(e.target.value)})} placeholder="0" />
                 </div>
                 <div className="md:col-span-2 space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">Annual Paid Holidays (Allowance)</label>
                   <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <Calendar size={20} className="text-gray-400" />
                     <input type="range" min="0" max="30" step="1" className="flex-1 accent-green-600" value={newMember.paidHolidays || 12} onChange={e => setNewMember({...newMember, paidHolidays: Number(e.target.value)})} />
                     <span className="font-black text-gray-900 w-12 text-center">{newMember.paidHolidays}d</span>
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="flex gap-4 mt-12 pt-8 border-t border-gray-50">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 font-black text-xs text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
              <button onClick={addMember} className="flex-2 bg-green-600 text-white px-10 py-5 rounded-3xl font-black text-xs shadow-2xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95">Onboard Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceStat = ({ label, val, color }: any) => (
  <div className={`p-4 rounded-2xl border border-gray-100 flex flex-col items-center ${color}`}>
     <span className="text-base font-black leading-none">{val}</span>
     <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{label}</span>
  </div>
);

const AttendanceBtn = ({ active, label, icon: Icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${
      active 
        ? `${color} text-white border-transparent shadow-lg scale-105 z-10` 
        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const StatBox = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center gap-6">
    <div className={`p-5 rounded-2xl ${color}`}><Icon size={24} /></div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black text-gray-900 leading-none">{value}</h4>
    </div>
  </div>
);

export default StaffView;
