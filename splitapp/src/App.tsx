import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { FilterType, SortMethod } from '@/types';
import { formatDateGregorian, formatMoney, formatMoneyPlain, parseDate } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Settings, ChevronLeft, Search, Trash2, Edit2, 
  FileText, Users, BarChart3, CreditCard, Download, Upload, 
  Calendar, ArrowUpDown
} from 'lucide-react';

// Message component
const Message = ({ text, type = 'success', onClose }: { text: string; type?: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white z-[2000] shadow-lg animate-in fade-in slide-in-from-top-5`}
      style={{ backgroundColor: type === 'error' ? 'var(--accent)' : 'var(--success)' }}
    >
      {type === 'error' ? '⚠️' : '✅'} {text}
    </div>
  );
};

// Loading overlay
const LoadingOverlay = ({ text, isOpen }: { text: string; isOpen: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-white/80 z-[3000] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin mb-4" />
      <p>{text}</p>
    </div>
  );
};

// Main App Component
function App() {
  // State
  const [currentScreen, setCurrentScreen] = useState<'groups' | 'bills' | 'add-bill' | 'edit-bill' | 'summary' | 'advanced' | 'settings' | 'member-reports' | 'create-group'>('groups');
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [currentBillId, setCurrentBillId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading] = useState({ isOpen: false, text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortMethod, setSortMethod] = useState<SortMethod>('date-desc');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDateGregorian(new Date()));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
  // Database hook
  const { groups, loading: dbLoading, createGroup, updateGroup, deleteGroup, addBill, updateBill, deleteBill, importData, exportData, clearAllData } = useDatabase();

  // Get current group
  const currentGroup = groups.find(g => g.id === currentGroupId);

  // Show message helper
  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
  }, []);

  // Navigation helpers
  const navigateTo = useCallback((screen: typeof currentScreen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  }, []);

  const openGroup = useCallback((groupId: string) => {
    setCurrentGroupId(groupId);
    navigateTo('bills');
  }, [navigateTo]);

  const goBack = useCallback(() => {
    switch (currentScreen) {
      case 'bills':
      case 'create-group':
        navigateTo('groups');
        break;
      case 'add-bill':
      case 'edit-bill':
      case 'summary':
      case 'advanced':
      case 'settings':
        navigateTo('bills');
        break;
      case 'member-reports':
        navigateTo('settings');
        break;
      default:
        navigateTo('groups');
    }
  }, [currentScreen, navigateTo]);

  // Filter groups
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter and sort bills
  const getFilteredBills = useCallback(() => {
    if (!currentGroup) return [];
    
    const now = new Date();
    let filtered = currentGroup.bills.filter(bill => {
      const billDate = parseDate(bill.date);
      
      switch (filter) {
        case 'today':
          return billDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return billDate >= weekAgo;
        case 'month':
          return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      
      switch (sortMethod) {
        case 'date-desc':
          return dateB.getTime() - dateA.getTime();
        case 'date-asc':
          return dateA.getTime() - dateB.getTime();
        case 'amount-desc':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-asc':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });

    return filtered;
  }, [currentGroup, filter, sortMethod]);

  // Calculate member balances
  const calculateBalances = useCallback(() => {
    if (!currentGroup) return [];
    
    return currentGroup.members.map(member => {
      const paid = currentGroup.bills
        .filter(bill => bill.payer === member)
        .reduce((sum, bill) => sum + (bill.amount || 0), 0);
      
      const owed = currentGroup.bills
        .reduce((sum, bill) => sum + ((bill.distribution && bill.distribution[member]) || 0), 0);
      
      return {
        member,
        paid,
        owed,
        balance: paid - owed
      };
    });
  }, [currentGroup]);

  // Export to JSON
  const handleExportJSON = async () => {
    if (groups.length === 0) {
      showMessage('لا توجد بيانات للتصدير', 'error');
      return;
    }

    const data = await exportData();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const time = String(hours % 12 || 12).padStart(2, '0') + '.' + minutes + period;
    const fileName = `SplitBackup_${date}_${time}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage(`تم تصدير البيانات بنجاح (${fileName})`);
    setSidebarOpen(false);
  };

  // Import from JSON
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedData)) {
          showMessage('تنسيق ملف JSON غير صحيح', 'error');
          return;
        }

        setConfirmDialog({
          isOpen: true,
          title: 'استيراد البيانات',
          message: `سيتم استبدال جميع البيانات الحالية (${groups.length} مجموعة) بـ ${importedData.length} مجموعة. هل أنت متأكد؟`,
          onConfirm: async () => {
            const success = await importData(importedData);
            if (success) {
              showMessage(`تم استيراد ${importedData.length} مجموعة بنجاح!`);
            } else {
              showMessage('فشل استيراد البيانات', 'error');
            }
            setSidebarOpen(false);
          }
        });
      } catch (err) {
        showMessage('فشل قراءة الملف، تأكد من اختيار ملف JSON صحيح.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Clear all data
  const handleClearAllData = () => {
    if (groups.length === 0) {
      showMessage('لا توجد بيانات للمسح', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'مسح جميع البيانات',
      message: `هل أنت متأكد من مسح جميع البيانات؟ سيتم حذف ${groups.length} مجموعة. لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        const success = await clearAllData();
        if (success) {
          showMessage('تم مسح جميع البيانات');
          navigateTo('groups');
        }
        setSidebarOpen(false);
      }
    });
  };

  // ==================== RENDER SCREENS ====================

  // Groups Screen
  const renderGroupsScreen = () => (
    <div className={`screen ${currentScreen === 'groups' ? 'active' : ''}`}>
      <div className="header-bar">
        <span onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer', position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
          <Settings className="w-6 h-6" />
        </span>
        🧾 تقسيم الفاتورة
      </div>
      
      <div className="search-box">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="🔍 ابحث عن مجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
          />
        </div>
      </div>

      <div className="pb-20">
        {filteredGroups.length === 0 ? (
          <div className="empty-state">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>لا توجد مجموعات بعد</p>
            <p className="text-sm text-gray-500">أنشئ مجموعة جديدة لتبدأ</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div 
              key={group.id} 
              className="group-list-item"
              onClick={() => openGroup(group.id)}
            >
              <div className="flex-1">
                <div className="mb-1">
                  <span className="font-bold text-lg">{group.name}</span>
                  <span className="badge primary mr-2">{group.members.length} أعضاء</span>
                </div>
                <div className="text-sm text-gray-500">
                  <span>🧾 {group.bills.length} فاتورة</span>
                  <span className="mx-2">|</span>
                  <span>💰 {formatMoneyPlain(group.bills.reduce((sum, bill) => sum + bill.amount, 0))} ريال</span>
                </div>
              </div>
              <ChevronLeft className="w-6 h-6 text-gray-300" />
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => navigateTo('create-group')}>
        <Plus className="w-8 h-8" />
      </button>

      <footer>
        © 2025 <span className="brand">AMMARIZE</span> creative&tech. All rights reserved.
      </footer>
    </div>
  );

  // Create Group Screen
  const renderCreateGroupScreen = () => {
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState(['', '']);

    const addMember = () => setMembers([...members, '']);
    
    const updateMember = (index: number, value: string) => {
      const newMembers = [...members];
      newMembers[index] = value;
      setMembers(newMembers);
    };

    const handleSave = async () => {
      const trimmedName = groupName.trim();
      const trimmedMembers = members.map(m => m.trim()).filter(m => m);
      
      if (!trimmedName) {
        showMessage('يرجى إدخال اسم المجموعة', 'error');
        return;
      }
      
      if (trimmedMembers.length < 2) {
        showMessage('يرجى إدخال شخصين على الأقل', 'error');
        return;
      }

      const uniqueMembers = [...new Set(trimmedMembers)];
      if (uniqueMembers.length !== trimmedMembers.length) {
        showMessage('يوجد أسماء مكررة، يرجى تعديلها', 'error');
        return;
      }

      const success = await createGroup(trimmedName, trimmedMembers);
      if (success) {
        showMessage('تم إنشاء المجموعة بنجاح');
        navigateTo('groups');
      }
    };

    return (
      <div className={`screen ${currentScreen === 'create-group' ? 'active' : ''}`}>
        <div className="input-header">
          <button className="btn-save-text" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span>إنشاء مجموعة جديدة</span>
          <button className="btn-save-text" onClick={handleSave}>حفظ</button>
        </div>

        <div className="input-row">
          <Label>اسم المجموعة</Label>
          <Input
            placeholder="مثال: رحلة الشباب"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="text-right"
          />
        </div>

        {members.map((member, index) => (
          <div key={index} className="input-row">
            <Label>الاسم {index + 1}</Label>
            <Input
              placeholder="اسم الشخص"
              value={member}
              onChange={(e) => updateMember(index, e.target.value)}
              className="text-right"
            />
          </div>
        ))}

        <button className="btn-main" onClick={addMember} style={{ background: '#999', marginTop: '20px' }}>
          <Plus className="w-5 h-5 inline ml-2" />
          إضافة شخص آخر
        </button>
      </div>
    );
  };

  // Bills Screen
  const renderBillsScreen = () => {
    if (!currentGroup) return null;
    
    const filteredBills = getFilteredBills();
    const totalAmount = currentGroup.bills.reduce((sum, bill) => sum + bill.amount, 0);

    // Group bills by date
    const billsByDate: { [date: string]: typeof filteredBills } = {};
    filteredBills.forEach(bill => {
      if (!billsByDate[bill.date]) billsByDate[bill.date] = [];
      billsByDate[bill.date].push(bill);
    });

    return (
      <div className={`screen ${currentScreen === 'bills' ? 'active' : ''}`}>
        <div className="header-bar">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer">
                <ArrowUpDown className="w-5 h-5" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortMethod('date-desc')}>📅 الأحدث أولاً</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMethod('date-asc')}>📆 الأقدم أولاً</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMethod('amount-desc')}>📊 الأعلى مبلغاً</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMethod('amount-asc')}>📉 الأقل مبلغاً</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span>{currentGroup.name}</span>
        </div>

        <div className="bill-stats">
          <div className="stat-item">
            <div className="stat-value">{currentGroup.bills.length}</div>
            <div className="stat-label">فاتورة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" dangerouslySetInnerHTML={{ __html: formatMoney(totalAmount) }} />
            <div className="stat-label">ريال</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{currentGroup.members.length}</div>
            <div className="stat-label">عضو</div>
          </div>
        </div>

        <div className="filter-section">
          {(['all', 'today', 'week', 'month'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'الكل' : f === 'today' ? 'اليوم' : f === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}
            </button>
          ))}
        </div>

        <div className="pb-24">
          {filteredBills.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>لا توجد فواتير</p>
              <p className="text-sm text-gray-500">اضغط على الزر + لإضافة فاتورة جديدة</p>
            </div>
          ) : (
            Object.keys(billsByDate).sort((a, b) => parseDate(b).getTime() - parseDate(a).getTime()).map(date => (
              <div key={date}>
                <div className="divider">📅 {date}</div>
                {billsByDate[date].map((bill) => {
                  const isAdvanced = bill.desc?.includes('[تسوية]') || bill.desc?.includes('🔄');
                  const participants = bill.distribution 
                    ? Object.keys(bill.distribution).filter(m => bill.distribution[m] > 0).join('، ')
                    : '';
                  
                  return (
                    <div
                      key={bill.id}
                      className="group-list-item mx-2 mb-2 rounded-lg"
                      style={{ 
                        backgroundColor: isAdvanced ? '#e8f5e9' : 'white',
                        borderRight: isAdvanced ? '5px solid #4caf50' : 'none'
                      }}
                      onClick={() => {
                        setCurrentBillId(bill.id);
                        navigateTo('edit-bill');
                      }}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold" style={{ color: isAdvanced ? '#2e7d32' : 'var(--primary)' }}>
                            {isAdvanced ? '💳' : '💰'} <span dangerouslySetInnerHTML={{ __html: formatMoney(bill.amount) }} />
                          </span>
                          <span className="flex-1 text-center px-2">{bill.desc}</span>
                          <span className={`badge ${isAdvanced ? 'success' : ''}`} style={{ minWidth: '70px', textAlign: 'center' }}>
                            {bill.payer}
                          </span>
                        </div>
                        {participants && (
                          <div className="participants-names">👥 {participants}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <button className="fab" onClick={() => navigateTo('add-bill')}>
          <Plus className="w-8 h-8" />
        </button>

        <div className="bottom-tabs">
          <div className="tab active" onClick={() => {}}>
            <FileText className="w-7 h-7 mb-1" />
            <span>الفواتير</span>
          </div>
          <div className="tab" onClick={() => navigateTo('advanced')}>
            <CreditCard className="w-7 h-7 mb-1" />
            <span>دفع متقدم</span>
          </div>
          <div className="tab" onClick={() => navigateTo('summary')}>
            <BarChart3 className="w-7 h-7 mb-1" />
            <span>الملخص</span>
          </div>
          <div className="tab" onClick={() => navigateTo('settings')}>
            <Settings className="w-7 h-7 mb-1" />
            <span>الإعدادات</span>
          </div>
        </div>
      </div>
    );
  };

  // Add Bill Screen
  const renderAddBillScreen = () => {
    if (!currentGroup) return null;
    
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [payer, setPayer] = useState(currentGroup.defaultPayer);
    const [distribution, setDistribution] = useState<{ [key: string]: number }>({});
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const membersToShow = currentGroup.members.filter(m => m !== payer);
    
    const calculateSplit = (total: number, members: string[]) => {
      if (members.length === 0 || total <= 0) return {};
      
      const share = parseFloat((total / members.length).toFixed(2));
      const newDist: { [key: string]: number } = {};
      let remaining = total;
      
      members.forEach((member, index) => {
        if (index === members.length - 1) {
          newDist[member] = parseFloat(remaining.toFixed(2));
        } else {
          newDist[member] = share;
          remaining -= share;
        }
      });
      
      return newDist;
    };

    const handleAmountChange = (value: string) => {
      setAmount(value);
      const numAmount = parseFloat(value) || 0;
      if (selectedMembers.length > 0 && !isCustomMode) {
        setDistribution(calculateSplit(numAmount, selectedMembers));
      }
    };

    const toggleMember = (member: string) => {
      const newSelected = selectedMembers.includes(member)
        ? selectedMembers.filter(m => m !== member)
        : [...selectedMembers, member];
      setSelectedMembers(newSelected);
      
      const numAmount = parseFloat(amount) || 0;
      if (!isCustomMode) {
        setDistribution(calculateSplit(numAmount, newSelected));
      }
    };

    const handleSave = async () => {
      if (!description.trim()) {
        showMessage('يرجى إدخال وصف الفاتورة', 'error');
        return;
      }
      
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        showMessage('يرجى إدخال مبلغ صحيح', 'error');
        return;
      }

      if (selectedMembers.length === 0) {
        showMessage('يجب اختيار مشارك واحد على الأقل', 'error');
        return;
      }

      const totalDistributed = Object.values(distribution).reduce((sum, v) => sum + v, 0);
      if (Math.abs(numAmount - totalDistributed) > 0.01) {
        showMessage('المبلغ الموزع لا يساوي المبلغ الإجمالي', 'error');
        return;
      }

      const success = await addBill(currentGroup.id, {
        desc: description.trim(),
        amount: numAmount,
        payer,
        date: selectedDate,
        distribution
      });

      if (success) {
        showMessage('تم حفظ الفاتورة بنجاح');
        navigateTo('bills');
      }
    };

    return (
      <div className={`screen ${currentScreen === 'add-bill' ? 'active' : ''}`}>
        <div className="input-header">
          <span className="text-green-500">إضافة فاتورة جديدة</span>
          <button className="btn-save-text" onClick={handleSave}>حفظ</button>
        </div>

        <div className="input-row">
          <Label>الوصف</Label>
          <Input
            placeholder="مثال: عشاء في المطعم"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-right"
          />
        </div>

        <div className="input-row">
          <Label>من دفع؟</Label>
          <Select value={payer} onValueChange={setPayer}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentGroup.members.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="input-row">
          <Label>المبلغ</Label>
          <Input
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="text-right"
          />
          <span className="pr-3 text-gray-500">ريال</span>
        </div>

        <div className="date-section" onClick={() => {
          const input = document.createElement('input');
          input.type = 'date';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
              setSelectedDate(formatDateGregorian(new Date(target.value)));
            }
          };
          input.click();
        }}>
          <Calendar className="w-6 h-6 mx-auto mb-1" />
          <span>{selectedDate}</span>
        </div>

        <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
          <span className="font-bold text-[var(--primary)]">المشاركون في الفاتورة:</span>
          <span className="selected-members-count">{selectedMembers.length} مختار</span>
        </div>

        <div className="all-header">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedMembers.length === membersToShow.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedMembers(membersToShow);
                  const numAmount = parseFloat(amount) || 0;
                  setDistribution(calculateSplit(numAmount, membersToShow));
                } else {
                  setSelectedMembers([]);
                  setDistribution({});
                }
              }}
            />
            <Label className="cursor-pointer">الكل</Label>
          </div>
          <button 
            className="font-bold text-[var(--primary)]"
            onClick={() => setIsCustomMode(!isCustomMode)}
          >
            {isCustomMode ? '↩️ توزيع تلقائي' : 'توزيع مخصص'}
          </button>
        </div>

        <div>
          {membersToShow.map(member => (
            <div key={member} className="member-line">
              <Checkbox
                checked={selectedMembers.includes(member)}
                onCheckedChange={() => toggleMember(member)}
              />
              <span className="name">{member}</span>
              <span className="amt">
                {isCustomMode ? (
                  <Input
                    type="number"
                    className="custom-amount-input"
                    value={distribution[member] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setDistribution({ ...distribution, [member]: value });
                    }}
                  />
                ) : (
                  <span>{(distribution[member] || 0).toFixed(2)}</span>
                )}
              </span>
              <span className="text-xs text-gray-500 mr-1">ريال</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Edit Bill Screen
  const renderEditBillScreen = () => {
    if (!currentGroup || !currentBillId) return null;
    
    const bill = currentGroup.bills.find(b => b.id === currentBillId);
    if (!bill) return null;

    const [description, setDescription] = useState(bill.desc);
    const [amount, setAmount] = useState(bill.amount.toString());
    const [payer, setPayer] = useState(bill.payer);
    const [editDate, setEditDate] = useState(bill.date);
    const [distribution, setDistribution] = useState(bill.distribution || {});
    const [selectedMembers, setSelectedMembers] = useState<string[]>(
      Object.keys(bill.distribution || {}).filter(m => bill.distribution[m] > 0)
    );

    const membersToShow = currentGroup.members.filter(m => m !== payer);

    const calculateSplit = (total: number, members: string[]) => {
      if (members.length === 0 || total <= 0) return {};
      
      const share = parseFloat((total / members.length).toFixed(2));
      const newDist: { [key: string]: number } = {};
      let remaining = total;
      
      members.forEach((member, index) => {
        if (index === members.length - 1) {
          newDist[member] = parseFloat(remaining.toFixed(2));
        } else {
          newDist[member] = share;
          remaining -= share;
        }
      });
      
      return newDist;
    };

    const handleAmountChange = (value: string) => {
      setAmount(value);
      const numAmount = parseFloat(value) || 0;
      if (selectedMembers.length > 0 && !isCustomMode) {
        setDistribution(calculateSplit(numAmount, selectedMembers));
      }
    };

    const toggleMember = (member: string) => {
      const newSelected = selectedMembers.includes(member)
        ? selectedMembers.filter(m => m !== member)
        : [...selectedMembers, member];
      setSelectedMembers(newSelected);
      
      const numAmount = parseFloat(amount) || 0;
      if (!isCustomMode) {
        setDistribution(calculateSplit(numAmount, newSelected));
      }
    };

    const handleUpdate = async () => {
      if (!description.trim()) {
        showMessage('يرجى إدخال وصف الفاتورة', 'error');
        return;
      }
      
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        showMessage('يرجى إدخال مبلغ صحيح', 'error');
        return;
      }

      if (selectedMembers.length === 0) {
        showMessage('يجب اختيار مشارك واحد على الأقل', 'error');
        return;
      }

      const success = await updateBill(currentGroup.id, currentBillId, {
        desc: description.trim(),
        amount: numAmount,
        payer,
        date: editDate,
        distribution
      });

      if (success) {
        showMessage('تم تحديث الفاتورة بنجاح');
        navigateTo('bills');
      }
    };

    const handleDelete = () => {
      setConfirmDialog({
        isOpen: true,
        title: 'حذف الفاتورة',
        message: 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.',
        onConfirm: async () => {
          const success = await deleteBill(currentGroup.id, currentBillId);
          if (success) {
            showMessage('تم حذف الفاتورة');
            navigateTo('bills');
          }
        }
      });
    };

    return (
      <div className={`screen ${currentScreen === 'edit-bill' ? 'active' : ''}`}>
        <div className="input-header">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span>تعديل الفاتورة</span>
          <button className="btn-save-text" onClick={handleUpdate}>تحديث</button>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50">
          <span>تفاصيل الفاتورة</span>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
          </Button>
        </div>

        <div className="input-row">
          <Label>الوصف</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-right"
          />
        </div>

        <div className="input-row">
          <Label>من دفع؟</Label>
          <Select value={payer} onValueChange={setPayer}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentGroup.members.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="input-row">
          <Label>المبلغ</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="text-right"
          />
          <span className="pr-3 text-gray-500">ريال</span>
        </div>

        <div className="date-section" onClick={() => {
          const input = document.createElement('input');
          input.type = 'date';
          const [day, month, year] = editDate.split('/');
          if (day && month && year) {
            input.value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
              setEditDate(formatDateGregorian(new Date(target.value)));
            }
          };
          input.click();
        }}>
          <Calendar className="w-6 h-6 mx-auto mb-1" />
          <span>{editDate}</span>
        </div>

        <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
          <span className="font-bold text-[var(--primary)]">المشاركون في الفاتورة:</span>
          <span className="selected-members-count">{selectedMembers.length} مختار</span>
        </div>

        <div className="all-header">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedMembers.length === membersToShow.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedMembers(membersToShow);
                  const numAmount = parseFloat(amount) || 0;
                  setDistribution(calculateSplit(numAmount, membersToShow));
                } else {
                  setSelectedMembers([]);
                  setDistribution({});
                }
              }}
            />
            <Label className="cursor-pointer">الكل</Label>
          </div>
          <button 
            className="font-bold text-[var(--primary)]"
            onClick={() => setIsCustomMode(!isCustomMode)}
          >
            {isCustomMode ? '↩️ توزيع تلقائي' : 'توزيع مخصص'}
          </button>
        </div>

        <div>
          {membersToShow.map(member => (
            <div key={member} className="member-line">
              <Checkbox
                checked={selectedMembers.includes(member)}
                onCheckedChange={() => toggleMember(member)}
              />
              <span className="name">{member}</span>
              <span className="amt">
                {isCustomMode ? (
                  <Input
                    type="number"
                    className="custom-amount-input"
                    value={distribution[member] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setDistribution({ ...distribution, [member]: value });
                    }}
                  />
                ) : (
                  <span>{(distribution[member] || 0).toFixed(2)}</span>
                )}
              </span>
              <span className="text-xs text-gray-500 mr-1">ريال</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Summary Screen
  const renderSummaryScreen = () => {
    if (!currentGroup) return null;
    
    const total = currentGroup.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const billsCount = currentGroup.bills.length;
    const average = billsCount > 0 ? total / billsCount : 0;
    const balances = calculateBalances();

    return (
      <div className={`screen ${currentScreen === 'summary' ? 'active' : ''}`}>
        <div className="header-bar">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          ملخص الحسابات
        </div>

        <div className="total-summary">
          <h3 className="text-lg font-bold mb-4">📈 إجمالي الإحصائيات</h3>
          <div className="stat-row">
            <span>إجمالي المصروفات</span>
            <span dangerouslySetInnerHTML={{ __html: formatMoney(total) + ' ريال' }} />
          </div>
          <div className="stat-row">
            <span>عدد الفواتير</span>
            <span>{billsCount}</span>
          </div>
          <div className="stat-row">
            <span>متوسط الفاتورة</span>
            <span dangerouslySetInnerHTML={{ __html: formatMoney(average) + ' ريال' }} />
          </div>
        </div>

        <div className="pb-24">
          {balances.map(({ member, paid, owed, balance }) => (
            <div key={member} className="summary-item">
              <div>
                <div className="font-bold">{member}</div>
                <div className="text-sm text-gray-500">
                  دفع: {formatMoneyPlain(paid)} | عليه: {formatMoneyPlain(owed)}
                </div>
              </div>
              <div className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                {balance >= 0 ? '+' : ''}{formatMoneyPlain(balance)}
              </div>
            </div>
          ))}
        </div>

        <div className="bottom-tabs">
          <div className="tab" onClick={() => navigateTo('bills')}>
            <FileText className="w-7 h-7 mb-1" />
            <span>الفواتير</span>
          </div>
          <div className="tab" onClick={() => navigateTo('advanced')}>
            <CreditCard className="w-7 h-7 mb-1" />
            <span>دفع متقدم</span>
          </div>
          <div className="tab active" onClick={() => {}}>
            <BarChart3 className="w-7 h-7 mb-1" />
            <span>الملخص</span>
          </div>
          <div className="tab" onClick={() => navigateTo('settings')}>
            <Settings className="w-7 h-7 mb-1" />
            <span>الإعدادات</span>
          </div>
        </div>
      </div>
    );
  };

  // Advanced Payment Screen
  const renderAdvancedPaymentScreen = () => {
    if (!currentGroup) return null;
    
    const [description, setDescription] = useState('');
    const [from, setFrom] = useState(currentGroup.members[0] || '');
    const [to, setTo] = useState(currentGroup.members[1] || '');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [advDate, setAdvDate] = useState(formatDateGregorian(new Date()));

    const handleSave = async () => {
      if (!description.trim()) {
        showMessage('يرجى إدخال وصف العملية', 'error');
        return;
      }

      const numAmount = parseFloat(paymentAmount);
      if (!numAmount || numAmount <= 0) {
        showMessage('يرجى إدخال مبلغ صحيح', 'error');
        return;
      }

      if (from === to) {
        showMessage('لا يمكن الدفع لنفس الشخص', 'error');
        return;
      }

      const distribution: { [key: string]: number } = {};
      currentGroup.members.forEach(member => {
        distribution[member] = member === to ? numAmount : 0;
      });

      const success = await addBill(currentGroup.id, {
        desc: `🔄 [تسوية] ${description.trim()}`,
        amount: numAmount,
        payer: from,
        date: advDate,
        distribution,
        isAdvancedPayment: true
      });

      if (success) {
        showMessage('تم تسجيل الدفع المتقدم بنجاح');
        navigateTo('bills');
      }
    };

    return (
      <div className={`screen ${currentScreen === 'advanced' ? 'active' : ''}`}>
        <div className="header-bar">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          تسجيل دفع مباشر
        </div>

        <div className="m-4 p-5 border rounded-lg">
          <h3 className="text-[var(--primary)] mb-4 font-bold">💳 تسوية بين الأعضاء</h3>

          <div className="input-row">
            <Label>الوصف</Label>
            <Input
              placeholder="مثال: تسديد دين قديم"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-right"
            />
          </div>

          <div className="input-row">
            <Label>من دفع؟</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentGroup.members.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="input-row">
            <Label>لمن؟</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentGroup.members.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="input-row">
            <Label>المبلغ</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="text-right"
            />
          </div>

          <div className="date-section" onClick={() => {
            const input = document.createElement('input');
            input.type = 'date';
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.value) {
                setAdvDate(formatDateGregorian(new Date(target.value)));
              }
            };
            input.click();
          }}>
            <Calendar className="w-6 h-6 mx-auto mb-1" />
            <span>{advDate}</span>
          </div>

          <button className="btn-main w-full mt-5" onClick={handleSave}>
            حفظ العملية
          </button>
        </div>

        <div className="bottom-tabs">
          <div className="tab" onClick={() => navigateTo('bills')}>
            <FileText className="w-7 h-7 mb-1" />
            <span>الفواتير</span>
          </div>
          <div className="tab active" onClick={() => {}}>
            <CreditCard className="w-7 h-7 mb-1" />
            <span>دفع متقدم</span>
          </div>
          <div className="tab" onClick={() => navigateTo('summary')}>
            <BarChart3 className="w-7 h-7 mb-1" />
            <span>الملخص</span>
          </div>
          <div className="tab" onClick={() => navigateTo('settings')}>
            <Settings className="w-7 h-7 mb-1" />
            <span>الإعدادات</span>
          </div>
        </div>
      </div>
    );
  };

  // Settings Screen
  const renderSettingsScreen = () => {
    if (!currentGroup) return null;

    const handleEditGroupName = () => {
      const newName = prompt('أدخل اسم المجموعة الجديد:', currentGroup.name);
      if (newName && newName.trim() && newName !== currentGroup.name) {
        updateGroup(currentGroup.id, { name: newName.trim() });
        showMessage('تم تحديث اسم المجموعة');
      }
    };

    const handleDeleteGroup = () => {
      setConfirmDialog({
        isOpen: true,
        title: 'حذف المجموعة',
        message: `هل أنت متأكد من حذف المجموعة "${currentGroup.name}" وجميع فواتيرها؟ لا يمكن التراجع عن هذا الإجراء.`,
        onConfirm: async () => {
          const success = await deleteGroup(currentGroup.id);
          if (success) {
            showMessage('تم حذف المجموعة');
            navigateTo('groups');
          }
        }
      });
    };

    const exportGroupCSV = () => {
      let csv = '\uFEFF';
      csv += `اسم المجموعة,${currentGroup.name}\n`;
      csv += `تاريخ التصدير,${new Date().toLocaleDateString('ar-SA')}\n`;
      csv += `عدد الأعضاء,${currentGroup.members.length}\n`;
      csv += `عدد الفواتير,${currentGroup.bills.length}\n\n`;

      csv += `أولاً: جدول المصاريف والفواتير\n`;
      csv += 'من دفع,الوصف,التاريخ,المبلغ للكل\n';
      
      let totalGeneral = 0;
      currentGroup.bills.forEach(bill => {
        const isAdvanced = bill.desc?.includes('[تسوية]') || bill.desc?.includes('🔄');
        if (!isAdvanced) {
          csv += `"${bill.payer || ''}","${bill.desc || ''}","${bill.date || ''}",${(bill.amount || 0).toFixed(2)}\n`;
          totalGeneral += bill.amount || 0;
        }
      });
      csv += `,,,إجمالي المصاريف,${totalGeneral.toFixed(2)}\n\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentGroup.name}_تقرير.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('تم تصدير التقرير بنجاح');
    };

    return (
      <div className={`screen ${currentScreen === 'settings' ? 'active' : ''}`}>
        <div className="header-bar">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          إعدادات المجموعة
        </div>

        <div className="settings-item" onClick={handleEditGroupName}>
          <span className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            تعديل اسم المجموعة
          </span>
          <ChevronLeft className="w-5 h-5" />
        </div>

        <div className="settings-item" onClick={() => navigateTo('member-reports')}>
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            تقارير الأعضاء المفصلة
          </span>
          <ChevronLeft className="w-5 h-5" />
        </div>

        <div className="p-5 space-y-3">
          <Button 
            className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700"
            onClick={exportGroupCSV}
          >
            <Download className="w-5 h-5" />
            تقرير المجموعة (CSV)
          </Button>

          <Button 
            variant="destructive" 
            className="w-full justify-start gap-2"
            onClick={handleDeleteGroup}
          >
            <Trash2 className="w-5 h-5" />
            حذف المجموعة
          </Button>
        </div>

        <div className="bottom-tabs">
          <div className="tab" onClick={() => navigateTo('bills')}>
            <FileText className="w-7 h-7 mb-1" />
            <span>الفواتير</span>
          </div>
          <div className="tab" onClick={() => navigateTo('advanced')}>
            <CreditCard className="w-7 h-7 mb-1" />
            <span>دفع متقدم</span>
          </div>
          <div className="tab" onClick={() => navigateTo('summary')}>
            <BarChart3 className="w-7 h-7 mb-1" />
            <span>الملخص</span>
          </div>
          <div className="tab active" onClick={() => {}}>
            <Settings className="w-7 h-7 mb-1" />
            <span>الإعدادات</span>
          </div>
        </div>
      </div>
    );
  };

  // Member Reports Screen
  const renderMemberReportsScreen = () => {
    if (!currentGroup) return null;

    return (
      <div className={`screen ${currentScreen === 'member-reports' ? 'active' : ''}`}>
        <div className="header-bar">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          تقارير الأعضاء المفصلة
        </div>

        <div className="p-4">
          {currentGroup.members.map(member => {
            const paidBills = currentGroup.bills.filter(b => b.payer === member && !b.desc?.includes('🔄'));
            const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);
            const owedBills = currentGroup.bills.filter(b => !b.desc?.includes('🔄') && b.distribution?.[member] > 0);
            const totalOwed = owedBills.reduce((sum, b) => sum + (b.distribution[member] || 0), 0);
            const balance = totalPaid - totalOwed;

            return (
              <div key={member} className="report-table-container mb-4">
                <div className="report-title">تقرير العضو: {member}</div>
                
                <div className="report-subtitle">الفواتير التي دفعها</div>
                <div className="table-responsive">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidBills.map(bill => (
                        <tr key={bill.id}>
                          <td>{bill.date}</td>
                          <td>{bill.desc}</td>
                          <td>{formatMoneyPlain(bill.amount)}</td>
                        </tr>
                      ))}
                      {paidBills.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-gray-500">لا توجد فواتير</td></tr>
                      )}
                      <tr className="total-row">
                        <td colSpan={2}>إجمالي المدفوعات</td>
                        <td>{formatMoneyPlain(totalPaid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="report-subtitle">المستحقات عليه</div>
                <div className="table-responsive">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الوصف</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owedBills.map(bill => (
                        <tr key={bill.id}>
                          <td>{bill.date}</td>
                          <td>{bill.desc}</td>
                          <td>{formatMoneyPlain(bill.distribution[member] || 0)}</td>
                        </tr>
                      ))}
                      {owedBills.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-gray-500">لا توجد مستحقات</td></tr>
                      )}
                      <tr className="total-row">
                        <td colSpan={2}>إجمالي المستحقات</td>
                        <td>{formatMoneyPlain(totalOwed)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="report-summary-box">
                  <div className="summary-box-item">
                    <span className="summary-box-label">دفع</span>
                    <span className="summary-box-value">{formatMoneyPlain(totalPaid)}</span>
                  </div>
                  <div className="summary-box-item">
                    <span className="summary-box-label">عليه</span>
                    <span className="summary-box-value">{formatMoneyPlain(totalOwed)}</span>
                  </div>
                  <div className="summary-box-item">
                    <span className="summary-box-label">الرصيد</span>
                    <span className={`summary-box-value ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balance >= 0 ? '+' : ''}{formatMoneyPlain(balance)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {dbLoading ? (
        <LoadingOverlay text="جاري التحميل..." isOpen={true} />
      ) : (
        <>
          {renderGroupsScreen()}
          {renderCreateGroupScreen()}
          {renderBillsScreen()}
          {renderAddBillScreen()}
          {renderEditBillScreen()}
          {renderSummaryScreen()}
          {renderAdvancedPaymentScreen()}
          {renderSettingsScreen()}
          {renderMemberReportsScreen()}

          {/* Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-right">الإعدادات العامة</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)] mt-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportJSON}>
                    <Download className="w-4 h-4" />
                    تصدير JSON
                  </Button>
                  
                  <Label className="w-full">
                    <Input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleImportJSON}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 w-full">
                      <Upload className="w-4 h-4" />
                      استيراد JSON
                    </div>
                  </Label>

                  <Separator className="my-4" />

                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={handleClearAllData}
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح جميع البيانات
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Message */}
          {message && (
            <Message 
              text={message.text} 
              type={message.type} 
              onClose={() => setMessage(null)} 
            />
          )}

          {/* Loading */}
          <LoadingOverlay text={loading.text} isOpen={loading.isOpen} />

          {/* Confirm Dialog */}
          <AlertDialog open={confirmDialog?.isOpen} onOpenChange={() => setConfirmDialog(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right">{confirmDialog?.title}</AlertDialogTitle>
                <AlertDialogDescription className="text-right">
                  {confirmDialog?.message}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogAction onClick={() => {
                  confirmDialog?.onConfirm();
                  setConfirmDialog(null);
                }}>
                  تأكيد
                </AlertDialogAction>
                <AlertDialogCancel onClick={() => setConfirmDialog(null)}>
                  إلغاء
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

export default App;
