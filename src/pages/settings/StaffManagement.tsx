import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, Edit, Search, Mail, Phone, Calendar, UserCheck, Settings, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { staffApi } from '@/lib/api';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
}

interface StaffStats {
  totalStaff: number;
  totalDepartments: number;
  totalRoles: number;
}

const availablePermissions: Permission[] = [
  {
    id: 'reports_view',
    name: 'عرض البلاغات',
    description: 'إمكانية عرض وقراءة البلاغات',
    category: 'البلاغات'
  },
  {
    id: 'reports_create',
    name: 'إنشاء البلاغات',
    description: 'إمكانية إنشاء بلاغات جديدة',
    category: 'البلاغات'
  },
  {
    id: 'reports_edit',
    name: 'تعديل البلاغات',
    description: 'إمكانية تعديل البلاغات الموجودة',
    category: 'البلاغات'
  },
  {
    id: 'reports_dashboard',
    name: 'لوحة تحكم البلاغات',
    description: 'الوصول إلى إحصائيات البلاغات',
    category: 'البلاغات'
  },
  {
    id: 'supply_view',
    name: 'عرض التموين',
    description: 'إمكانية عرض معلومات التموين',
    category: 'التموين'
  },
  {
    id: 'supply_manage',
    name: 'إدارة التموين',
    description: 'إمكانية إدارة وتعديل التموين',
    category: 'التموين'
  },
  {
    id: 'supply_warehouse',
    name: 'إدارة المستودع',
    description: 'إمكانية إدارة المستودعات',
    category: 'التموين'
  },
  {
    id: 'purchase_view',
    name: 'عرض الشراء المباشر',
    description: 'إمكانية عرض طلبات الشراء',
    category: 'الشراء المباشر'
  },
  {
    id: 'purchase_create',
    name: 'إنشاء طلبات شراء',
    description: 'إمكانية إنشاء طلبات شراء جديدة',
    category: 'الشراء المباشر'
  },
  {
    id: 'purchase_track',
    name: 'متابعة الطلبات',
    description: 'إمكانية متابعة مسار الطلبات',
    category: 'الشراء المباشر'
  },
  {
    id: 'dental_view',
    name: 'عرض قسم الأسنان',
    description: 'إمكانية عرض معلومات قسم الأسنان',
    category: 'قسم الأسنان'
  },
  {
    id: 'dental_contracts',
    name: 'إدارة عقود الأسنان',
    description: 'إمكانية إدارة عقود الأسنان',
    category: 'قسم الأسنان'
  },
  {
    id: 'dental_assets',
    name: 'إدارة أصول الأسنان',
    description: 'إمكانية إدارة أصول قسم الأسنان',
    category: 'قسم الأسنان'
  },
  {
    id: 'transactions_view',
    name: 'عرض المعاملات',
    description: 'إمكانية عرض المعاملات الإدارية',
    category: 'المعاملات الإدارية'
  },
  {
    id: 'transactions_create',
    name: 'إنشاء المعاملات',
    description: 'إمكانية إنشاء معاملات جديدة',
    category: 'المعاملات الإدارية'
  },
  {
    id: 'transactions_manage',
    name: 'إدارة المعاملات',
    description: 'إمكانية إدارة وتعديل المعاملات',
    category: 'المعاملات الإدارية'
  }
];

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'سارة أحمد المحمد',
    email: 'sara.ahmed@health.gov.sa',
    phone: '0501234567',
    role: 'مسؤولة البلاغات',
    department: 'البلاغات',
    permissions: ['reports_view', 'reports_create', 'reports_edit', 'reports_dashboard'],
    createdAt: '2024-01-15',
    lastLogin: '2024-08-05 09:30'
  },
  {
    id: '2',
    name: 'محمد علي السالم',
    email: 'mohammed.ali@health.gov.sa',
    phone: '0509876543',
    role: 'مسؤول التموين',
    department: 'التموين',
    permissions: ['supply_view', 'supply_manage', 'supply_warehouse'],
    createdAt: '2024-02-20',
    lastLogin: '2024-08-04 14:15'
  },
  {
    id: '3',
    name: 'فاطمة خالد النور',
    email: 'fatima.khaled@health.gov.sa',
    phone: '0555555555',
    role: 'محاسبة',
    department: 'الشراء المباشر',
    permissions: ['purchase_view', 'purchase_track'],
    createdAt: '2024-03-10',
    lastLogin: '2024-07-28 11:45'
  }
];

const departments = [
  'البلاغات',
  'التموين',
  'الشراء المباشر',
  'قسم الأسنان',
  'المعاملات الإدارية',
  'الإدارة العامة'
];

const roles = [
  'مسؤول القسم',
  'مساعد إداري',
  'محاسب',
  'فني',
  'مراجع',
  'منسق'
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [staffStats, setStaffStats] = useState<StaffStats>({ totalStaff: 0, totalDepartments: 0, totalRoles: 0 });
  const { toast } = useToast();

  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id' | 'createdAt' | 'lastLogin'> & { password: string }>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    permissions: [],
    password: ''
  });

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || s.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Fetch staff data and statistics
  useEffect(() => {
    fetchStaffData();
    fetchStaffStats();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await staffApi.getStaff();
      if (response.success && response.data) {
        setStaff(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      // Use mock data on error
      setStaff(mockStaff);
      toast({
        title: "تحذير",
        description: "تم تحميل البيانات التجريبية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffStats = async () => {
    try {
      const response = await staffApi.getStaffStats();
      if (response.success && response.data) {
        setStaffStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching staff stats:', error);
      // Calculate stats from current data
      const uniqueDepartments = new Set(staff.map(s => s.department)).size;
      const uniqueRoles = new Set(staff.map(s => s.role)).size;
      setStaffStats({
        totalStaff: staff.length || mockStaff.length,
        totalDepartments: uniqueDepartments || departments.length,
        totalRoles: uniqueRoles || roles.length
      });
    }
  };

  const handleAddStaff = async () => {
    try {
      setUpdating(true);
      const response = await staffApi.createStaff(newStaff);
      
      if (response.success) {
        await fetchStaffData(); // Refresh staff list
        await fetchStaffStats(); // Refresh stats
        setNewStaff({
          name: '', email: '', phone: '', role: '', department: '', permissions: [], password: ''
        });
        setShowAddDialog(false);
        toast({
          title: "تم إضافة الموظف بنجاح",
          description: `تم إضافة ${newStaff.name} إلى النظام`,
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الموظف",
        description: error.message || "فشل في إضافة الموظف",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      setUpdating(true);
      const response = await staffApi.updateStaff(selectedStaff.id, selectedStaff);
      
      if (response.success) {
        await fetchStaffData(); // Refresh staff list
        setIsEditMode(false);
        toast({
          title: "تم تحديث معلومات الموظف",
          description: `تم تحديث بيانات ${selectedStaff.name}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الموظف",
        description: error.message || "فشل في تحديث معلومات الموظف",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean, isNewStaff = false) => {
    if (isNewStaff) {
      setNewStaff(prev => ({
        ...prev,
        permissions: checked 
          ? [...prev.permissions, permissionId]
          : prev.permissions.filter(p => p !== permissionId)
      }));
    } else if (selectedStaff) {
      setSelectedStaff(prev => prev ? ({
        ...prev,
        permissions: checked 
          ? [...prev.permissions, permissionId]
          : prev.permissions.filter(p => p !== permissionId)
      }) : null);
    }
  };

  const getPermissionsByCategory = () => {
    const categories: {[key: string]: Permission[]} = {};
    availablePermissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const permissionsByCategory = getPermissionsByCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل بيانات الموظفين...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">إجمالي الموظفين</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{staffStats.totalStaff}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">الأقسام</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{staffStats.totalDepartments}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                <Settings className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">الأدوار الوظيفية</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{staffStats.totalRoles}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-primary mb-2">إدارة الموظفين</h1>
            <p className="text-muted-foreground">إدارة حسابات الموظفين والصلاحيات</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة موظف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle>إضافة موظف جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات الموظف وحدد الصلاحيات المناسبة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                        placeholder="أدخل الاسم الكامل"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                        placeholder="example@health.gov.sa"
                        className="text-right"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الجوال</Label>
                      <Input
                        id="phone"
                        value={newStaff.phone}
                        onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                        placeholder="05xxxxxxxx"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                        placeholder="أدخل كلمة المرور"
                        className="text-right"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">القسم</Label>
                      <Select value={newStaff.department} onValueChange={(value) => setNewStaff({...newStaff, department: value})}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">الدور الوظيفي</Label>
                      <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">الصلاحيات</h3>
                    <div className="space-y-6">
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-primary text-right">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-2 space-x-reverse p-3 border rounded-lg">
                                <Checkbox
                                  id={`new-${permission.id}`}
                                  checked={newStaff.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.id, checked as boolean, true)
                                  }
                                />
                                <div className="text-right">
                                  <Label htmlFor={`new-${permission.id}`} className="text-sm font-medium">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddStaff} disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الإضافة...
                      </>
                    ) : (
                      'إضافة الموظف'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-right">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right w-full md:w-80"
              />
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full md:w-48 text-right">
                  <SelectValue placeholder="فلترة حسب القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map((staffMember) => (
          <Card key={staffMember.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-right flex-1">
                  <CardTitle className="text-lg mb-1">{staffMember.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">{staffMember.role}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStaff(staffMember);
                      setIsEditMode(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-right">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{staffMember.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-right">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{staffMember.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-right">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{staffMember.phone}</span>
              </div>
              {staffMember.lastLogin && (
                <div className="flex items-center gap-2 text-sm text-right">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>آخر دخول: {staffMember.lastLogin}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-right">
                  الصلاحيات: {staffMember.permissions.length}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  عرض الصلاحيات
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Details Dialog */}
      {selectedStaff && (
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>
                {isEditMode ? "تعديل معلومات الموظف" : "تفاصيل الموظف"}
              </DialogTitle>
              <DialogDescription>
                {selectedStaff.name} - {selectedStaff.department}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedStaff.name}
                      onChange={(e) => setSelectedStaff({...selectedStaff, name: e.target.value})}
                      className="text-right"
                    />
                  ) : (
                    <p className="text-right p-2 bg-muted rounded">{selectedStaff.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedStaff.email}
                      onChange={(e) => setSelectedStaff({...selectedStaff, email: e.target.value})}
                      className="text-right"
                    />
                  ) : (
                    <p className="text-right p-2 bg-muted rounded">{selectedStaff.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  {isEditMode ? (
                    <Input
                      value={selectedStaff.phone}
                      onChange={(e) => setSelectedStaff({...selectedStaff, phone: e.target.value})}
                      className="text-right"
                    />
                  ) : (
                    <p className="text-right p-2 bg-muted rounded">{selectedStaff.phone}</p>
                  )}
                </div>
                {isEditMode && (
                  <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      className="text-right"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>القسم</Label>
                  {isEditMode ? (
                    <Select value={selectedStaff.department} onValueChange={(value) => setSelectedStaff({...selectedStaff, department: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-right p-2 bg-muted rounded">{selectedStaff.department}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>الدور الوظيفي</Label>
                  {isEditMode ? (
                    <Select value={selectedStaff.role} onValueChange={(value) => setSelectedStaff({...selectedStaff, role: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-right p-2 bg-muted rounded">{selectedStaff.role}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-right">الصلاحيات</h3>
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-primary text-right">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-2 space-x-reverse p-3 border rounded-lg">
                            {isEditMode ? (
                              <Checkbox
                                id={`edit-${permission.id}`}
                                checked={selectedStaff.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean, false)
                                }
                              />
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center">
                                {selectedStaff.permissions.includes(permission.id) ? (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                  <div className="h-4 w-4 rounded border-2 border-gray-300" />
                                )}
                              </div>
                            )}
                            <div className="text-right">
                              <Label htmlFor={`edit-${permission.id}`} className="text-sm font-medium">
                                {permission.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleUpdateStaff} disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : (
                      'حفظ التغييرات'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setSelectedStaff(null)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => setIsEditMode(true)}>
                    تعديل
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
