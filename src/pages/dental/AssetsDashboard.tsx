import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Loader2, FileX, Download, Printer, FileSpreadsheet, FileText, Monitor, Wrench, Shield, ShieldCheck, ShieldX, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dentalAssetsApi } from '@/lib/api';

export default function DentalDashboard() {
  // State management
  const [originalDashboardData, setOriginalDashboardData] = useState({
    total: 0,
    working: 0,
    notWorking: 0,
    underWarranty: 0,
    outOfWarranty: 0
  });
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    working: 0,
    notWorking: 0,
    underWarranty: 0,
    outOfWarranty: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [facilitiesDistribution, setFacilitiesDistribution] = useState([]);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWorkingStatus, setSelectedWorkingStatus] = useState('');
  const [selectedWarrantyStatus, setSelectedWarrantyStatus] = useState('');

  // Equipment filter options
  const workingStatusOptions = [
    { value: 'working', label: 'الأجهزة التي تعمل' },
    { value: 'not_working', label: 'الأجهزة المكهنة' }
  ];

  const warrantyStatusOptions = [
    { value: 'under_warranty', label: 'الأجهزة تحت الضمان' },
    { value: 'out_of_warranty', label: 'الأجهزة خارج الضمان' }
  ];

  // Calculate filtered statistics
  const calculateFilteredStats = (data) => {
    const stats = {
      total: data.length,
      working: data.filter(item => item.deviceStatus === 'يعمل').length,
      notWorking: data.filter(item => item.deviceStatus === 'مكهن' || item.deviceStatus === 'لا يعمل').length,
      underWarranty: data.filter(item => item.warrantyActive === 'yes').length,
      outOfWarranty: data.filter(item => item.warrantyActive === 'no').length
    };
    return stats;
  };

  // Calculate facilities distribution for chart
  const calculateFacilitiesDistribution = (data) => {
    const facilityCount = {};
    data.forEach(item => {
      if (item.facilityName) {
        facilityCount[item.facilityName] = (facilityCount[item.facilityName] || 0) + 1;
      }
    });

    return Object.entries(facilityCount)
      .map(([name, count]) => ({ name, count: Number(count), value: Number(count), fill: `hsl(${Math.random() * 360}, 65%, 55%)` }))
      .sort((a, b) => Number(b.count) - Number(a.count));
  };

  // Load assets data
  const loadAssetsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await dentalAssetsApi.getAssets();
      
      if (response.success && response.data) {
        setAllData(response.data);
        setFilteredData(response.data);
        
        // Calculate dashboard stats
        const stats = calculateFilteredStats(response.data);
        setOriginalDashboardData(stats);
        setDashboardData(stats);
        
        // Update status data for pie chart
        const newStatusData = [
          { name: 'يعمل', value: stats.working, color: '#10b981' },
          { name: 'لا يعمل', value: stats.notWorking, color: '#ef4444' },
          { name: 'تحت الضمان', value: stats.underWarranty, color: '#3b82f6' },
          { name: 'خارج الضمان', value: stats.outOfWarranty, color: '#f59e0b' }
        ];
        setStatusData(newStatusData);
        
        setFacilitiesDistribution(calculateFacilitiesDistribution(response.data));
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات الأجهزة');
      console.error('Assets data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadAssetsData();
  }, []);

  // Real-time filtering with useEffect
  useEffect(() => {
    let filtered = [...allData];

    if (selectedClinic && selectedClinic !== "all") {
      filtered = filtered.filter(item => 
        item.facilityName?.toLowerCase().includes(selectedClinic.toLowerCase())
      );
    }

    if (selectedSupplier && selectedSupplier !== "all") {
      filtered = filtered.filter(item => 
        item.supplierName?.toLowerCase().includes(selectedSupplier.toLowerCase())
      );
    }

    if (selectedWorkingStatus && selectedWorkingStatus !== "all") {
      filtered = filtered.filter(item => {
        if (selectedWorkingStatus === 'working') {
          return item.deviceStatus === 'يعمل';
        } else if (selectedWorkingStatus === 'not_working') {
          return item.deviceStatus === 'مكهن' || item.deviceStatus === 'لا يعمل';
        }
        return true;
      });
    }

    if (selectedWarrantyStatus && selectedWarrantyStatus !== "all") {
      filtered = filtered.filter(item => {
        if (selectedWarrantyStatus === 'under_warranty') {
          return item.warrantyActive === 'yes';
        } else if (selectedWarrantyStatus === 'out_of_warranty') {
          return item.warrantyActive === 'no';
        }
        return true;
      });
    }

    setFilteredData(filtered);
    
    // Update dashboard stats based on filtered data
    const filteredStats = calculateFilteredStats(filtered);
    setDashboardData(filteredStats);

    // Update status data based on filtered results
    const newStatusData = [
      { name: 'يعمل', value: filteredStats.working, color: '#10b981' },
      { name: 'لا يعمل', value: filteredStats.notWorking, color: '#ef4444' },
      { name: 'تحت الضمان', value: filteredStats.underWarranty, color: '#3b82f6' },
      { name: 'خارج الضمان', value: filteredStats.outOfWarranty, color: '#f59e0b' }
    ];
    setStatusData(newStatusData);

    // Update facilities distribution
    setFacilitiesDistribution(calculateFacilitiesDistribution(filtered));

  }, [selectedClinic, selectedSupplier, selectedWorkingStatus, selectedWarrantyStatus, allData]);

  const clearFilters = () => {
    setSelectedClinic('');
    setSelectedSupplier('');
    setSelectedWorkingStatus('');
    setSelectedWarrantyStatus('');
    // Reset to original dashboard data
    setDashboardData(originalDashboardData);
    setFilteredData(allData);
    setFacilitiesDistribution(calculateFacilitiesDistribution(allData));
    
    // Reset status data to original
    const originalStatusData = [
      { name: 'يعمل', value: originalDashboardData.working, color: '#10b981' },
      { name: 'لا يعمل', value: originalDashboardData.notWorking, color: '#ef4444' },
      { name: 'تحت الضمان', value: originalDashboardData.underWarranty, color: '#3b82f6' },
      { name: 'خارج الضمان', value: originalDashboardData.outOfWarranty, color: '#f59e0b' }
    ];
    setStatusData(originalStatusData);
  };

  const refreshData = async () => {
    await loadAssetsData();
  };

  // Export functions
  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      // Create a print-friendly version
      const printContent = `
        <html dir="rtl">
          <head>
            <title>تقرير أجهزة طب الأسنان</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
              .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
              .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
              .stat-card h3 { font-size: 14px; color: #666; margin: 0 0 8px 0; }
              .stat-card p { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
              .chart-section { margin: 30px 0; page-break-inside: avoid; }
              .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
              .chart-bar { background: #f5f5f5; padding: 8px; margin: 5px 0; border-radius: 4px; display: flex; align-items: center; }
              .bar-label { flex: 0 0 150px; font-weight: 500; }
              .bar-container { flex: 1; background: #e0e0e0; height: 30px; border-radius: 4px; overflow: hidden; margin: 0 10px; position: relative; }
              .bar-fill { height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; }
              .bar-value { flex: 0 0 80px; text-align: left; font-weight: bold; }
              @media print { 
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .chart-section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير أجهزة طب الأسنان</h1>
              <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card"><h3>إجمالي الأجهزة</h3><p>${dashboardData.total}</p></div>
              <div class="stat-card"><h3>الأجهزة التي تعمل</h3><p>${dashboardData.working}</p></div>
              <div class="stat-card"><h3>الأجهزة المكهنة</h3><p>${dashboardData.notWorking}</p></div>
              <div class="stat-card"><h3>تحت الضمان</h3><p>${dashboardData.underWarranty}</p></div>
              <div class="stat-card"><h3>خارج الضمان</h3><p>${dashboardData.outOfWarranty}</p></div>
            </div>

            <div class="chart-section">
              <div class="chart-title">توزيع حالة الأجهزة</div>
              ${statusData.map(item => `
                <div class="chart-bar">
                  <div class="bar-label">${item.name}</div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${dashboardData.total > 0 ? (item.value / dashboardData.total * 100) : 0}%; background-color: ${item.color};">
                      ${dashboardData.total > 0 ? Math.round((item.value / dashboardData.total) * 100) : 0}%
                    </div>
                  </div>
                  <div class="bar-value">${item.value} جهاز</div>
                </div>
              `).join('')}
            </div>

            <div class="chart-section">
              <div class="chart-title">توزيع الأجهزة حسب المنشأة (أعلى ${Math.min(10, facilitiesDistribution.length)} منشآت)</div>
              ${facilitiesDistribution.slice(0, 10).map(facility => `
                <div class="chart-bar">
                  <div class="bar-label">${facility.name}</div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${dashboardData.total > 0 ? (facility.count / dashboardData.total * 100) : 0}%; background-color: ${facility.fill};">
                      ${dashboardData.total > 0 ? Math.round((facility.count / dashboardData.total) * 100) : 0}%
                    </div>
                  </div>
                  <div class="bar-value">${facility.count} جهاز</div>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;
      
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
      // Create CSV content with summary stats and chart data
      const summarySection = [
        'تقرير أجهزة طب الأسنان',
        `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
        '',
        'الإحصائيات العامة',
        'إجمالي الأجهزة,' + dashboardData.total,
        'الأجهزة التي تعمل,' + dashboardData.working,
        'الأجهزة المكهنة,' + dashboardData.notWorking,
        'تحت الضمان,' + dashboardData.underWarranty,
        'خارج الضمان,' + dashboardData.outOfWarranty,
        '',
        'توزيع حالة الأجهزة',
        'الحالة,العدد,النسبة المئوية'
      ];
      
      const statusSection = statusData.map(item => 
        `"${item.name}",${item.value},${dashboardData.total > 0 ? ((item.value / dashboardData.total) * 100).toFixed(1) : 0}%`
      );
      
      const facilitiesSection = [
        '',
        'توزيع الأجهزة حسب المنشأة',
        'المنشأة,العدد,النسبة المئوية',
        ...facilitiesDistribution.map(facility => 
          `"${facility.name}",${facility.count},${dashboardData.total > 0 ? ((facility.count / dashboardData.total) * 100).toFixed(1) : 0}%`
        )
      ];
      
      const csvContent = [
        ...summarySection,
        ...statusSection,
        ...facilitiesSection
      ].join('\n');
      
      // Add BOM for Arabic support
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dental-assets-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
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

  // Get unique values for dropdown options from the actual assets data
  const uniqueClinics = [...new Set(allData
    .map(item => item.facilityName)
    .filter(clinic => clinic && clinic.trim() !== '')
  )].sort();
  
  const uniqueSuppliers = [...new Set(allData
    .map(item => item.supplierName)
    .filter(supplier => supplier && supplier.trim() !== '')
  )].sort();

  // Check if any filters are active
  const hasActiveFilters = selectedClinic || selectedSupplier || selectedWorkingStatus || selectedWarrantyStatus;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">جاري تحميل بيانات أجهزة طب الأسنان...</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <Monitor className="h-8 w-8" />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم أجهزة طب الأسنان</h1>
            <p className="text-purple-100 mt-1 text-right">إدارة شاملة لأجهزة ومعدات طب الأسنان</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Export buttons */}
            <Button 
              variant="secondary" 
              onClick={exportToPDF}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              title="طباعة / تصدير PDF"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={exportToExcel}
              disabled={exportLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              title="تصدير Excel"
            >
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              onClick={refreshData}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              تحديث البيانات
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Download className="h-5 w-5" />
            فلاتر البحث والتصدير
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنشأة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنشآت</SelectItem>
                {uniqueClinics.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموردين</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWorkingStatus} onValueChange={setSelectedWorkingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة التشغيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {workingStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${option.value === 'working' ? 'text-green-600' : 'text-red-600'}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Select value={selectedWarrantyStatus} onValueChange={setSelectedWarrantyStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الضمان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {warrantyStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.value === 'under_warranty' ? (
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <ShieldX className="w-4 h-4 text-red-600" />
                      )}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                مسح الفلاتر
              </Button>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="text-sm text-blue-800 text-right flex-1">
                  <p className="font-medium mb-2">عرض {filteredData.length} من أصل {allData.length} جهاز</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {selectedClinic && <span>المنشأة: {selectedClinic}</span>}
                    {selectedSupplier && <span>المورد: {selectedSupplier}</span>}
                    {selectedWorkingStatus && <span>حالة التشغيل: {workingStatusOptions.find(o => o.value === selectedWorkingStatus)?.label}</span>}
                    {selectedWarrantyStatus && <span>حالة الضمان: {warrantyStatusOptions.find(o => o.value === selectedWarrantyStatus)?.label}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={exportLoading || filteredData.length === 0}
                    className="text-xs"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    طباعة
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={exportLoading || filteredData.length === 0}
                    className="text-xs"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards - Removed maintenance card */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <Monitor className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">إجمالي الأجهزة</p>
              <p className="text-xl font-bold text-purple-800">{dashboardData.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">تعمل</p>
              <p className="text-xl font-bold text-green-800">{dashboardData.working}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">مكهنة</p>
              <p className="text-xl font-bold text-red-800">{dashboardData.notWorking}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <ShieldCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">تحت الضمان</p>
              <p className="text-xl font-bold text-blue-800">{dashboardData.underWarranty}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <ShieldX className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-600">خارج الضمان</p>
              <p className="text-xl font-bold text-orange-800">{dashboardData.outOfWarranty}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع حالة الأجهزة</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-gray-700">
                        {entry.name}: {entry.value} ({dashboardData.total > 0 ? ((entry.value / dashboardData.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">لا توجد بيانات لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facilities Distribution - New Style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Building className="h-5 w-5" />
              توزيع الأجهزة حسب المنشآت
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facilitiesDistribution.length > 0 ? (
              <div className="space-y-4">
                {/* Display first 7 facilities or all if showAllFacilities is true */}
                <div className="space-y-3">
                  {(showAllFacilities ? facilitiesDistribution : facilitiesDistribution.slice(0, 7)).map((facility, index) => (
                    <div key={facility.name} className="group">
                      {/* Facility Name and Count */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: facility.fill }}
                          ></div>
                          <span className="text-sm font-medium text-foreground">
                            {facility.count}
                          </span>
                        </div>
                        <div className="text-right flex-1 min-w-0 mr-3">
                          <span className="text-sm font-medium text-foreground block truncate">
                            {facility.name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-accent rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out group-hover:shadow-lg"
                            style={{ 
                              backgroundColor: facility.fill,
                              width: `${dashboardData.total > 0 ? (facility.count / Math.max(...facilitiesDistribution.map(f => f.count))) * 100 : 0}%`,
                              background: `linear-gradient(90deg, ${facility.fill}, ${facility.fill}dd)`
                            }}
                          ></div>
                        </div>
                        
                      {/* Percentage Label */}
                        <div className="absolute left-2 top-0 h-full flex items-center">
                          <span className="text-xs font-medium text-gray-900 drop-shadow-sm">
                            {dashboardData.total > 0 ? Math.round((facility.count / dashboardData.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More/Less Button */}
                {facilitiesDistribution.length > 7 && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowAllFacilities(!showAllFacilities)}
                      className="text-sm px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                    >
                      {showAllFacilities ? (
                        <>
                          <span>عرض أقل</span>
                        </>
                      ) : (
                        <>
                          <span>عرض المزيد ({facilitiesDistribution.length - 7} أخرى)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد بيانات منشآت لعرضها</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers and Facilities Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers by Device Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أكثر الموردين نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const supplierCounts = {};
              filteredData.forEach(item => {
                if (item.supplierName) {
                  supplierCounts[item.supplierName] = (supplierCounts[item.supplierName] || 0) + 1;
                }
              });
              
              const topSuppliersList = Object.entries(supplierCounts)
                .map(([name, count]) => ({ name, count: Number(count) }))
                .sort((a, b) => Number(b.count) - Number(a.count))
                .slice(0, 5);

              return topSuppliersList.length > 0 ? (
                <div className="space-y-3">
                  {topSuppliersList.map((supplier, index) => (
                    <div key={supplier.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="text-right flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={supplier.name}>{supplier.name}</p>
                        <p className="text-xs text-gray-600">{String(supplier.count)} جهاز</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-purple-600 text-sm">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد بيانات موردين</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Top Facilities by Device Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Building className="h-5 w-5" />
              أكثر المنشآت احتواءً للأجهزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const facilityCounts = {};
              filteredData.forEach(item => {
                if (item.facilityName) {
                  facilityCounts[item.facilityName] = (facilityCounts[item.facilityName] || 0) + 1;
                }
              });
              
              const topFacilitiesList = Object.entries(facilityCounts)
                .map(([name, count]) => ({ name, count: Number(count) }))
                .sort((a, b) => Number(b.count) - Number(a.count))
                .slice(0, 5);

              return topFacilitiesList.length > 0 ? (
                <div className="space-y-3">
                  {topFacilitiesList.map((facility, index) => (
                    <div key={facility.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="text-right flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={facility.name}>{facility.name}</p>
                        <p className="text-xs text-gray-600">{String(facility.count)} جهاز</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Building className="h-4 w-4 text-purple-600" />
                        <span className="font-bold text-purple-600 text-sm">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد بيانات منشآت</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Device Status Summary Table - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            ملخص حالة الأجهزة المفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="block md:hidden space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-800">الأجهزة العاملة</p>
                      <p className="text-xs text-green-600">حالة جيدة وجاهزة للاستخدام</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <span className="text-2xl font-bold text-green-800">{dashboardData.working}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-800">الأجهزة المكهنة</p>
                      <p className="text-xs text-red-600">تحتاج إلى إصلاح أو صيانة</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <span className="text-2xl font-bold text-red-800">{dashboardData.notWorking}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-3 font-medium text-gray-700">الحالة</th>
                        <th className="p-3 font-medium text-gray-700">العدد</th>
                        <th className="p-3 font-medium text-gray-700">النسبة</th>
                        <th className="p-3 font-medium text-gray-700">الوصف</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span>الأجهزة العاملة</span>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-green-800">{dashboardData.working}</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {dashboardData.total > 0 ? ((dashboardData.working / dashboardData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">حالة جيدة وجاهزة للاستخدام</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span>الأجهزة المكهنة</span>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-red-800">{dashboardData.notWorking}</td>
                        <td className="p-3">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            {dashboardData.total > 0 ? ((dashboardData.notWorking / dashboardData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">تحتاج إلى إصلاح أو صيانة</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span>تحت الضمان</span>
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-blue-800">{dashboardData.underWarranty}</td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {dashboardData.total > 0 ? ((dashboardData.underWarranty / dashboardData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">مغطاة بالضمان من المورد</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span>خارج الضمان</span>
                            <ShieldX className="h-4 w-4 text-orange-600" />
                          </div>
                        </td>
                        <td className="p-3 font-bold text-orange-800">{dashboardData.outOfWarranty}</td>
                        <td className="p-3">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                            {dashboardData.total > 0 ? ((dashboardData.outOfWarranty / dashboardData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">انتهت فترة الضمان</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد أجهزة لعرضها</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
