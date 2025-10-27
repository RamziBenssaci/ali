import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX, Download, Printer, FileSpreadsheet, Calendar, Banknote, Package, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dentalContractsApi } from '@/lib/api';
import SemiGauge from '@/components/charts/SemiGauge';

const HOSPITAL_NAME = 'مستشفى الامير محمد بن عبدالعزيز';
const BUDGET_GROUP = 19877299.25;
const BUDGET_HOSPITAL = 3011712.01;
const BUDGET_GENERAL = BUDGET_GROUP + BUDGET_HOSPITAL;

export default function DentalDashboard() {
  const [originalDashboardData, setOriginalDashboardData] = useState({
    total: 0, new: 0, approved: 0, contracted: 0, delivered: 0, rejected: 0,
    totalValue: 0, receivedValue: 0, remainingValue: 0
  });
  const [allContracts, setAllContracts] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [topClinics, setTopClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const statusOptions = [
    { value: 'جديد', label: 'جديد', color: '#3b82f6' },
    { value: 'موافق عليه', label: 'موافق عليه', color: '#f59e0b' },
    { value: 'تم التعاقد', label: 'تم التعاقد', color: '#8b5cf6' },
    { value: 'تم التسليم', label: 'تم التسليم', color: '#10b981' },
    { value: 'مرفوض', label: 'مرفوض', color: '#ef4444' }
  ];

  const filteredContracts = useMemo(() => {
    let filtered = [...allContracts];
    if (selectedClinic && selectedClinic !== "all") {
      filtered = filtered.filter(item => item.facilityName?.toLowerCase().includes(selectedClinic.toLowerCase()));
    }
    if (selectedSupplier && selectedSupplier !== "all") {
      filtered = filtered.filter(item => item.supplierCompanyName?.toLowerCase().includes(selectedSupplier.toLowerCase()));
    }
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }
    if (dateFrom) {
      filtered = filtered.filter(item => new Date(item.orderDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(item => new Date(item.orderDate) <= new Date(dateTo));
    }
    return filtered;
  }, [allContracts, selectedClinic, selectedSupplier, selectedStatus, dateFrom, dateTo]);

  const dashboardData = useMemo(() => {
    const nonRejectedContracts = filteredContracts.filter(item => item.status !== 'مرفوض');
    const totalValue = nonRejectedContracts.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0);
    const receivedValue = nonRejectedContracts.reduce((sum, item) => sum + (parseFloat(item.receivedValue) || 0), 0);
    const remainingValue = totalValue - receivedValue;

    return {
      total: filteredContracts.length,
      new: filteredContracts.filter(item => item.status === 'جديد').length,
      approved: filteredContracts.filter(item => item.status === 'موافق عليه').length,
      contracted: filteredContracts.filter(item => item.status === 'تم التعاقد').length,
      delivered: filteredContracts.filter(item => item.status === 'تم التسليم').length,
      rejected: filteredContracts.filter(item => item.status === 'مرفوض').length,
      totalValue, receivedValue, remainingValue
    };
  }, [filteredContracts]);

  const statusData = useMemo(() => {
    return statusOptions.map(status => ({
      name: status.label,
      value: filteredContracts.filter(item => item.status === status.value).length,
      color: status.color
    }));
  }, [filteredContracts]);

  const monthlyData = useMemo(() => {
    const monthCounts = {};
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    months.forEach(month => { monthCounts[month] = 0; });
    filteredContracts.forEach(contract => {
      const date = new Date(contract.orderDate);
      if (!isNaN(date.getTime())) {
        monthCounts[months[date.getMonth()]]++;
      }
    });
    return months.map(month => ({ month, count: monthCounts[month] }));
  }, [filteredContracts]);

  const uniqueClinics = useMemo(() => {
    return [...new Set(allContracts.map(item => item.facilityName).filter(clinic => clinic && clinic.trim() !== ''))].sort();
  }, [allContracts]);
  
  const uniqueSuppliers = useMemo(() => {
    return [...new Set(allContracts.map(item => item.supplierCompanyName).filter(supplier => supplier && supplier.trim() !== ''))].sort();
  }, [allContracts]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dentalContractsApi.getDashboardData();
      if (response.success && response.data) {
        setOriginalDashboardData(response.data);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات لوحة التحكم');
    }
  };

  const loadContractsData = async () => {
    try {
      const response = await dentalContractsApi.getContracts();
      if (response.success && response.data) {
        setAllContracts(response.data);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات العقود');
    } finally {
      setLoading(false);
    }
  };

  const loadTopSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await dentalContractsApi.getTopSuppliers();
      if (response.success && response.data) {
        setTopSuppliers(response.data);
      }
    } catch (err) {
      console.error('Top suppliers loading error:', err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const loadTopClinics = async () => {
    try {
      setClinicsLoading(true);
      const response = await dentalContractsApi.getTopClinics();
      if (response.success && response.data) {
        setTopClinics(response.data);
      }
    } catch (err) {
      console.error('Top clinics loading error:', err);
    } finally {
      setClinicsLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([loadDashboardData(), loadContractsData(), loadTopSuppliers(), loadTopClinics()]);
    };
    loadAllData();
  }, []);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedSupplier('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadDashboardData(), loadContractsData(), loadTopSuppliers(), loadTopClinics()]);
  };

  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      const allNonRejected = allContracts.filter((c) => c.status !== 'مرفوض');
      const fullTotalValue = allNonRejected.reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);
      const groupConsumedAll = allNonRejected.filter((c) => c.facilityName !== HOSPITAL_NAME).reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);
      
      const printContent = `<html dir="rtl"><head><title>تقرير عقود الأسنان</title><style>body{font-family:Arial;direction:rtl;text-align:right;padding:20px}.header{background:linear-gradient(135deg,#8b5cf6,#6366f1);color:white;padding:20px;margin-bottom:20px;border-radius:8px}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin:20px 0}.stat-card{border:1px solid #ddd;padding:15px;border-radius:8px;background:#f9f9f9}.stat-card h3{margin:0 0 10px 0;font-size:14px;color:#666}.stat-card p{margin:0;font-size:24px;font-weight:bold;color:#333}.section{margin:30px 0;page-break-inside:avoid}.section-title{font-size:18px;font-weight:bold;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #8b5cf6}.data-table{width:100%;border-collapse:collapse;margin:15px 0}.data-table th,.data-table td{border:1px solid #ddd;padding:10px;text-align:right}.data-table th{background:#f5f5f5;font-weight:bold}.data-table tr:nth-child(even){background:#f9f9f9}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.section{page-break-inside:avoid}}</style></head><body><div class="header"><h1>لوحة تحكم عقود الأسنان</h1><p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p></div><div class="section"><div class="section-title">📊 الإحصائيات الرئيسية</div><div class="stats-grid"><div class="stat-card"><h3>إجمالي العقود</h3><p>${dashboardData.total}</p></div><div class="stat-card"><h3>القيمة الإجمالية</h3><p>${dashboardData.totalValue?.toLocaleString()} ريال</p></div><div class="stat-card"><h3>قيمة الكميات المستلمة</h3><p>${dashboardData.receivedValue?.toLocaleString()} ريال</p></div><div class="stat-card"><h3>قيمة الكميات المتبقية</h3><p>${dashboardData.remainingValue?.toLocaleString()} ريال</p></div><div class="stat-card"><h3>جديد</h3><p>${dashboardData.new}</p></div><div class="stat-card"><h3>موافق عليه</h3><p>${dashboardData.approved}</p></div><div class="stat-card"><h3>تم التعاقد</h3><p>${dashboardData.contracted}</p></div><div class="stat-card"><h3>تم التسليم</h3><p>${dashboardData.delivered}</p></div><div class="stat-card"><h3>مرفوض</h3><p>${dashboardData.rejected}</p></div></div></div><div class="section"><div class="section-title">📈 توزيع حالة العقود</div><table class="data-table"><thead><tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr></thead><tbody>${statusData.filter(s => s.value > 0).map(status => `<tr><td>${status.name}</td><td>${status.value}</td><td>${dashboardData.total > 0 ? Math.round((status.value / dashboardData.total) * 100) : 0}%</td></tr>`).join('')}</tbody></table></div><div class="section"><div class="section-title">🏢 أفضل الشركات الموردة</div><table class="data-table"><thead><tr><th>الترتيب</th><th>اسم الشركة</th><th>عدد العقود</th><th>القيمة (ريال)</th></tr></thead><tbody>${topSuppliers.map((supplier, index) => `<tr><td>#${index + 1}</td><td>${supplier.name}</td><td>${supplier.contracts}</td><td>${supplier.value?.toLocaleString()}</td></tr>`).join('')}</tbody></table></div><div class="section"><div class="section-title">🏥 أكثر المنشآت نشاطاً</div><table class="data-table"><thead><tr><th>الترتيب</th><th>اسم المنشأة</th><th>عدد العقود</th><th>القيمة (ريال)</th></tr></thead><tbody>${topClinics.map((clinic, index) => `<tr><td>#${index + 1}</td><td>${clinic.name}</td><td>${clinic.contracts}</td><td>${clinic.value?.toLocaleString()}</td></tr>`).join('')}</tbody></table></div></body></html>`;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('PDF export error:', error);
      alert('حدث خطأ في تصدير PDF');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const allNonRejected = allContracts.filter((c) => c.status !== 'مرفوض');
      const fullTotalValue = allNonRejected.reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);
      const groupConsumedAll = allNonRejected.filter((c) => c.facilityName !== HOSPITAL_NAME).reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);

      const csvSections = ['الإحصائيات الرئيسية', 'المؤشر,القيمة', `إجمالي العقود,${dashboardData.total}`, `القيمة الإجمالية,${dashboardData.totalValue}`, `قيمة الكميات المستلمة,${dashboardData.receivedValue}`, `قيمة الكميات المتبقية,${dashboardData.remainingValue}`, `جديد,${dashboardData.new}`, `موافق عليه,${dashboardData.approved}`, `تم التعاقد,${dashboardData.contracted}`, `تم التسليم,${dashboardData.delivered}`, `مرفوض,${dashboardData.rejected}`, '', 'توزيع حالة العقود', 'الحالة,العدد,النسبة'];
      
      statusData.filter(s => s.value > 0).forEach(status => {
        const percentage = dashboardData.total > 0 ? Math.round((status.value / dashboardData.total) * 100) : 0;
        csvSections.push(`"${status.name}",${status.value},${percentage}%`);
      });
      
      csvSections.push('', 'الاتجاه الشهري', 'الشهر,عدد العقود');
      monthlyData.forEach(month => {
        csvSections.push(`"${month.month}",${month.count}`);
      });
      
      csvSections.push('', 'أفضل الشركات الموردة', 'الترتيب,اسم الشركة,عدد العقود,القيمة');
      topSuppliers.forEach((supplier, index) => {
        csvSections.push(`#${index + 1},"${supplier.name}",${supplier.contracts},${supplier.value || 0}`);
      });
      
      csvSections.push('', 'أكثر المنشآت نشاطاً', 'الترتيب,اسم المنشأة,عدد العقود,القيمة');
      topClinics.forEach((clinic, index) => {
        csvSections.push(`#${index + 1},"${clinic.name}",${clinic.contracts},${clinic.value || 0}`);
      });

      const csvContent = csvSections.join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dental-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Excel export error:', error);
      alert('حدث خطأ في تصدير Excel');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">جاري تحميل بيانات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} className="w-full">
              <Loader2 className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم عقود الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right">إدارة شاملة لعقود معدات طب الأسنان</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportToPDF} disabled={exportLoading} className="bg-white/20 hover:bg-white/30 text-white border-white/30" title="طباعة / تصدير PDF">
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" onClick={exportToExcel} disabled={exportLoading} className="bg-white/20 hover:bg-white/30 text-white border-white/30" title="تصدير Excel">
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" onClick={refreshData} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Loader2 className="h-4 w-4 mr-2" />
              تحديث البيانات
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Download className="h-5 w-5" />
            فلاتر البحث والتصدير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="facility-select" className="text-right block mb-2">المنشأة</Label>
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger id="facility-select">
                  <SelectValue placeholder="اختر المنشأة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنشآت</SelectItem>
                  {uniqueClinics.map((clinic) => (
                    <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier-select" className="text-right block mb-2">الشركة الموردة</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier-select">
                  <SelectValue placeholder="اختر الشركة الموردة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-select" className="text-right block mb-2">الحالة</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-select">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from" className="text-right block mb-2">من تاريخ</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-right" />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-right block mb-2">إلى تاريخ</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-right" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={clearFilters}>
              <Calendar className="h-4 w-4 mr-2" />
              مسح الفلاتر
            </Button>
          </div>
          {(selectedClinic || selectedSupplier || selectedStatus || dateFrom || dateTo) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800 text-right">
                  عرض {filteredContracts.length} من أصل {allContracts.length} عقد
                  {selectedClinic && <span className="block">المنشأة: {selectedClinic}</span>}
                  {selectedSupplier && <span className="block">المورد: {selectedSupplier}</span>}
                  {selectedStatus && <span className="block">الحالة: {selectedStatus}</span>}
                  {dateFrom && <span className="block">من: {dateFrom}</span>}
                  {dateTo && <span className="block">إلى: {dateTo}</span>}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportToPDF} disabled={exportLoading || filteredContracts.length === 0} className="text-xs">
                    <Printer className="h-3 w-3 mr-1" />
                    طباعة
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportToExcel} disabled={exportLoading || filteredContracts.length === 0} className="text-xs">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">إجمالي العقود</p>
                <p className="text-2xl font-bold text-purple-800">{dashboardData.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-indigo-800">{dashboardData.totalValue?.toLocaleString()}</p>
                <p className="text-xs text-indigo-600">ريال سعودي</p>
              </div>
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">قيمة الكميات المستلمة</p>
                <p className="text-xl font-bold text-green-800">{dashboardData.receivedValue?.toLocaleString()}</p>
                <p className="text-xs text-green-600">ريال سعودي</p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">قيمة الكميات المتبقية</p>
                <p className="text-xl font-bold text-orange-800">{dashboardData.remainingValue?.toLocaleString()}</p>
                <p className="text-xs text-orange-600">ريال سعودي</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full">
          {(() => {
            const isPrinceHospitalFilter = selectedClinic === HOSPITAL_NAME;
            const allNonRejected = allContracts.filter((c) => c.status !== 'مرفوض');
            const fullTotalValue = allNonRejected.reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);
            const groupConsumedAll = allNonRejected.filter((c) => c.facilityName !== HOSPITAL_NAME).reduce((sum, c) => sum + (parseFloat(c.totalValue) || 0), 0);

            if (isPrinceHospitalFilter) {
              const consumed = dashboardData.totalValue || 0;
              const pct = BUDGET_HOSPITAL > 0 ? (consumed / BUDGET_HOSPITAL) * 100 : 0;
              return (
                <Card className="md:col-span-2 bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                    <CardTitle className="text-right flex items-center gap-3 text-orange-800">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                      ميزانية مستشفى الامير محمد بن عبدالعزيز
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="w-52 mx-auto">
                        <SemiGauge percentage={pct} label="نسبة الاستهلاك" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-3 border border-orange-200 shadow-sm">
                          <p className="text-xs text-orange-600 mb-1 font-medium">المستهلك</p>
                          <p className="text-lg font-bold text-orange-700">{consumed.toLocaleString()}</p>
                          <p className="text-xs text-orange-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-lg p-3 border border-red-200 shadow-sm">
                          <p className="text-xs text-red-600 mb-1 font-medium">الميزانية</p>
                          <p className="text-lg font-bold text-red-700">{BUDGET_HOSPITAL.toLocaleString()}</p>
                          <p className="text-xs text-red-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-3 border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-600 mb-1 font-medium">المتبقي</p>
                          <p className="text-lg font-bold text-slate-700">{(BUDGET_HOSPITAL - consumed).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">ريال</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const generalPct = BUDGET_GENERAL > 0 ? (fullTotalValue / BUDGET_GENERAL) * 100 : 0;
            const groupPct = BUDGET_GROUP > 0 ? (groupConsumedAll / BUDGET_GROUP) * 100 : 0;

            return (
              <>
                <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                    <CardTitle className="text-right flex items-center gap-3 text-blue-800">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                      الميزانية العامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="w-52 mx-auto">
                        <SemiGauge percentage={generalPct} label="نسبة الاستهلاك" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                          <p className="text-xs text-blue-600 mb-1 font-medium">المستهلك</p>
                          <p className="text-lg font-bold text-blue-700">{fullTotalValue.toLocaleString()}</p>
                          <p className="text-xs text-blue-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-lg p-3 border border-cyan-200 shadow-sm">
                          <p className="text-xs text-cyan-600 mb-1 font-medium">الميزانية الإجمالية</p>
                          <p className="text-lg font-bold text-cyan-700">{BUDGET_GENERAL.toLocaleString()}</p>
                          <p className="text-xs text-cyan-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-3 border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-600 mb-1 font-medium">المتبقي</p>
                          <p className="text-lg font-bold text-slate-700">{(BUDGET_GENERAL - fullTotalValue).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">ريال</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                    <CardTitle className="text-right flex items-center gap-3 text-emerald-800">
                      <BarChart3 className="h-6 w-6 text-emerald-600" />
                      ميزانية التجمع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="w-52 mx-auto">
                        <SemiGauge percentage={groupPct} label="نسبة الاستهلاك" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg p-3 border border-emerald-200 shadow-sm">
                          <p className="text-xs text-emerald-600 mb-1 font-medium">المستهلك</p>
                          <p className="text-lg font-bold text-emerald-700">{groupConsumedAll.toLocaleString()}</p>
                          <p className="text-xs text-emerald-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg p-3 border border-teal-200 shadow-sm">
                          <p className="text-xs text-teal-600 mb-1 font-medium">الميزانية</p>
                          <p className="text-lg font-bold text-teal-700">{BUDGET_GROUP.toLocaleString()}</p>
                          <p className="text-xs text-teal-500">ريال</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-3 border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-600 mb-1 font-medium">المتبقي</p>
                          <p className="text-lg font-bold text-slate-700">{(BUDGET_GROUP - groupConsumedAll).toLocaleString()}</p>
                          <p className="text-xs text-slate-500">ريال</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-amber-700 text-center font-medium">* لا يشمل عقود مستشفى الأمير محمد بن عبدالعزيز</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">جديد</p>
              <p className="text-xl font-bold text-blue-800">{dashboardData.new}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">موافق عليه</p>
              <p className="text-xl font-bold text-yellow-800">{dashboardData.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">تم التعاقد</p>
              <p className="text-xl font-bold text-purple-800">{dashboardData.contracted}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">تم التسليم</p>
              <p className="text-xl font-bold text-green-800">{dashboardData.delivered}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">مرفوض</p>
              <p className="text-xl font-bold text-red-800">{dashboardData.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              توزيع حالة العقود
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.some(item => item.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData.filter(item => item.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                      {statusData.filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {statusData.filter(item => item.value > 0).map((item) => (
                    <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-accent/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs sm:text-sm font-medium">
                        {item.name} ({item.value})
                        {dashboardData.total > 0 && ` - ${Math.round((item.value / dashboardData.total) * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الاتجاه الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(item => item.count > 0) ? (
              <div className="h-[300px] sm:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
                    <XAxis dataKey="month" fontSize={10} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis fontSize={10} tick={{ fontSize: 10 }} width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات شهرية لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أفضل الشركات الموردة</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topSuppliers.length > 0 ? (
              <div className="space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{supplier.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{supplier.contracts} عقد</p>
                        <p>{supplier.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات موردين</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">أكثر المنشآت نشاطاً</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : topClinics.length > 0 ? (
              <div className="space-y-4">
                {topClinics.map((clinic, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-right">
                      <p className="font-medium">{clinic.name}</p>
                      <div className="text-sm text-gray-600">
                        <p>{clinic.contracts} عقد</p>
                        <p>{clinic.value?.toLocaleString()} ريال</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-purple-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد بيانات منشآت</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}