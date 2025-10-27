import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, FileDown, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { directPurchaseApi, facilitiesApi, suppliersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function DirectPurchaseDashboard() {
  const [dashboardData, setDashboardData] = useState<any>({
    total: 0,
    new: 0,
    approved: 0,
    contracted: 0,
    delivered: 0,
    rejected: 0,
    totalValue: 0,
    topSuppliers: [],
    monthlyData: [],
    statusData: []
  });
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const { toast } = useToast();
  const summaryCardsRef = useRef<HTMLDivElement>(null);
  const statusCardsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const suppliersRef = useRef<HTMLDivElement>(null);

  // Fetch all dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [selectedFacility, selectedItem, selectedSupplier, allOrders]);

  const applyFilters = () => {
    let filtered = allOrders;

    if (selectedFacility) {
      filtered = filtered.filter(order => order.beneficiary === selectedFacility);
    }

    if (selectedItem) {
      filtered = filtered.filter(order => 
        order.itemNumber?.includes(selectedItem) || order.itemName?.includes(selectedItem)
      );
    }

    if (selectedSupplier) {
      filtered = filtered.filter(order => order.supplier === selectedSupplier);
    }

    setFilteredOrders(filtered);
    
    // Recalculate stats with filtered data
    const filteredStats = calculateDashboardStats(filtered);
    setDashboardData(filteredStats);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data in parallel
      const [ordersResponse, facilitiesResponse, suppliersResponse] = await Promise.all([
        directPurchaseApi.getOrders(),
        facilitiesApi.getFacilities(),
        suppliersApi.getSuppliers()
      ]);

      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse.data || []);
      const facilitiesData = Array.isArray(facilitiesResponse) ? facilitiesResponse : (facilitiesResponse.data || []);
      const suppliersData = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse.data || []);
      
      setAllOrders(ordersData);
      setFilteredOrders(ordersData);
      setFacilities(facilitiesData);
      setSuppliers(suppliersData);
      
      // Calculate dashboard statistics
      const stats = calculateDashboardStats(ordersData);
      setDashboardData(stats);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const calculateDashboardStats = (orders: any[]) => {
    const stats = {
      total: orders.length,
      new: orders.filter(o => o.status === 'جديد').length,
      approved: orders.filter(o => o.status === 'موافق عليه').length,
      contracted: orders.filter(o => o.status === 'تم التعاقد').length,
      delivered: orders.filter(o => o.status === 'تم التسليم').length,
      rejected: orders.filter(o => o.status === 'مرفوض').length,
      totalValue: orders.filter(o => o.status !== 'مرفوض').reduce((sum, order) => sum + (parseFloat(order.totalCost) || 0), 0)
    };

    // Calculate top suppliers
    const supplierStats = orders.reduce((acc: any, order) => {
      if (order.supplier) {
        if (!acc[order.supplier]) {
          acc[order.supplier] = { name: order.supplier, orders: 0, value: 0 };
        }
        acc[order.supplier].orders += 1;
        acc[order.supplier].value += order.totalCost || 0;
      }
      return acc;
    }, {});

    const topSuppliers = Object.values(supplierStats)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 4);

    // Calculate monthly data (all 12 months)
    const monthlyData = calculateMonthlyData(orders);
    
    // Status distribution data
    const statusData = [
      { name: 'جديد', value: stats.new, color: '#3b82f6' },
      { name: 'موافق عليه', value: stats.approved, color: '#f59e0b' },
      { name: 'تم التعاقد', value: stats.contracted, color: '#8b5cf6' },
      { name: 'تم التسليم', value: stats.delivered, color: '#10b981' },
      { name: 'مرفوض', value: stats.rejected, color: '#ef4444' }
    ];

    return {
      ...stats,
      topSuppliers,
      monthlyData,
      statusData
    };
  };

  const calculateMonthlyData = (orders: any[]) => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyStats: any[] = [];

    // Initialize all 12 months with 0
    months.forEach((monthName, monthIndex) => {
      const monthOrders = orders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === monthIndex;
      });

      monthlyStats.push({
        month: monthName,
        orders: monthOrders.length,
        value: monthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0)
      });
    });

    return monthlyStats;
  };

  const clearFilters = () => {
    setSelectedFacility('');
    setSelectedItem('');
    setSelectedSupplier('');
    setFilteredOrders(allOrders);
    
    // Reset stats to original data
    const originalStats = calculateDashboardStats(allOrders);
    setDashboardData(originalStats);
  };

  const handleExportPDF = () => {
    try {
      // Create a print-friendly page
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'خطأ',
          description: 'يرجى السماح بالنوافذ المنبثقة لتصدير PDF',
          variant: 'destructive',
        });
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير لوحة تحكم الشراء المباشر</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              padding: 20px;
              background: white;
            }
            .header {
              background: linear-gradient(to right, #16a34a, #15803d);
              color: white;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .card {
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              padding: 20px;
              background: white;
            }
            .card.blue { background: #eff6ff; border-color: #bfdbfe; }
            .card.purple { background: #f5f3ff; border-color: #ddd6fe; }
            .card.yellow { background: #fefce8; border-color: #fef08a; }
            .card.green { background: #f0fdf4; border-color: #bbf7d0; }
            .card.red { background: #fef2f2; border-color: #fecaca; }
            
            .card-header {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .card-value {
              font-size: 32px;
              font-weight: bold;
            }
            .card-label {
              font-size: 12px;
              margin-top: 5px;
              opacity: 0.8;
            }
            
            .status-cards {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .status-card {
              border: 2px solid;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            
            .section-title {
              font-size: 20px;
              font-weight: bold;
              margin: 30px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 3px solid #16a34a;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
            }
            table th {
              background: #16a34a;
              color: white;
              padding: 12px;
              text-align: right;
              font-weight: bold;
            }
            table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              text-align: right;
            }
            table tr:nth-child(even) {
              background: #f9fafb;
            }
            
            .supplier-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .supplier-item {
              background: #f9fafb;
              border-radius: 8px;
              padding: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .supplier-info {
              text-align: right;
            }
            .supplier-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .supplier-stats {
              font-size: 13px;
              color: #6b7280;
            }
            .supplier-rank {
              font-size: 24px;
              font-weight: bold;
              color: #16a34a;
            }
            
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
            
            @media print {
              body { padding: 10px; }
              .header { break-inside: avoid; }
              .card { break-inside: avoid; }
              table { break-inside: avoid; }
              .supplier-item { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>تقرير لوحة تحكم الشراء المباشر</h1>
            <p>إدارة شاملة لطلبات الشراء المباشر</p>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="card blue">
              <div class="card-header" style="color: #1e40af;">إجمالي الطلبات</div>
              <div class="card-value" style="color: #1e3a8a;">${dashboardData.total || 0}</div>
            </div>
            <div class="card purple">
              <div class="card-header" style="color: #7c3aed;">القيمة الإجمالية</div>
              <div class="card-value" style="color: #6b21a8;">${(dashboardData.totalValue || 0).toLocaleString()}</div>
              <div class="card-label" style="color: #7c3aed;">ريال سعودي</div>
            </div>
          </div>

          <!-- Status Cards -->
          <div class="status-cards">
            <div class="status-card blue" style="border-color: #bfdbfe; background: #eff6ff;">
              <div style="color: #1e40af; font-size: 14px; font-weight: 600; margin-bottom: 8px;">جديد</div>
              <div style="color: #1e3a8a; font-size: 24px; font-weight: bold;">${dashboardData.new || 0}</div>
            </div>
            <div class="status-card yellow" style="border-color: #fef08a; background: #fefce8;">
              <div style="color: #ca8a04; font-size: 14px; font-weight: 600; margin-bottom: 8px;">موافق عليه</div>
              <div style="color: #a16207; font-size: 24px; font-weight: bold;">${dashboardData.approved || 0}</div>
            </div>
            <div class="status-card purple" style="border-color: #ddd6fe; background: #f5f3ff;">
              <div style="color: #7c3aed; font-size: 14px; font-weight: 600; margin-bottom: 8px;">تم التعاقد</div>
              <div style="color: #6b21a8; font-size: 24px; font-weight: bold;">${dashboardData.contracted || 0}</div>
            </div>
            <div class="status-card green" style="border-color: #bbf7d0; background: #f0fdf4;">
              <div style="color: #16a34a; font-size: 14px; font-weight: 600; margin-bottom: 8px;">تم التسليم</div>
              <div style="color: #15803d; font-size: 24px; font-weight: bold;">${dashboardData.delivered || 0}</div>
            </div>
            <div class="status-card red" style="border-color: #fecaca; background: #fef2f2;">
              <div style="color: #dc2626; font-size: 14px; font-weight: 600; margin-bottom: 8px;">مرفوض</div>
              <div style="color: #b91c1c; font-size: 24px; font-weight: bold;">${dashboardData.rejected || 0}</div>
            </div>
          </div>

          <!-- Status Distribution Table -->
          <h2 class="section-title">توزيع حالة الطلبات</h2>
          <table>
            <thead>
              <tr>
                <th>الحالة</th>
                <th>العدد</th>
                <th>النسبة المئوية</th>
              </tr>
            </thead>
            <tbody>
              ${(dashboardData.statusData || []).map((item: any) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.value}</td>
                  <td>${dashboardData.total > 0 ? ((item.value / dashboardData.total) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Monthly Trends -->
          <h2 class="section-title">الاتجاه الشهري للطلبات</h2>
          <table>
            <thead>
              <tr>
                <th>الشهر</th>
                <th>عدد الطلبات</th>
                <th>القيمة (ريال)</th>
              </tr>
            </thead>
            <tbody>
              ${(dashboardData.monthlyData || []).map((month: any) => `
                <tr>
                  <td><strong>${month.month}</strong></td>
                  <td>${month.orders}</td>
                  <td>${month.value.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Top Suppliers -->
          <h2 class="section-title">أفضل الشركات الموردة</h2>
          <div class="supplier-grid">
            ${(dashboardData.topSuppliers || []).map((supplier: any, index: number) => `
              <div class="supplier-item">
                <div class="supplier-info">
                  <div class="supplier-name">${supplier.name}</div>
                  <div class="supplier-stats">
                    <div>${supplier.orders} طلب</div>
                    <div>${supplier.value.toLocaleString()} ريال</div>
                  </div>
                </div>
                <div class="supplier-rank">#${index + 1}</div>
              </div>
            `).join('')}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
            <p>نظام إدارة الشراء المباشر</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
      
      toast({
        title: 'جاهز للطباعة',
        description: 'تم فتح نافذة الطباعة. يمكنك الطباعة أو حفظها كـ PDF',
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'فشل في تصدير التقرير',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = () => {
    try {
      // Summary statistics
      const summaryData = [
        { 'البيان': 'إجمالي الطلبات', 'القيمة': dashboardData.total || 0 },
        { 'البيان': 'القيمة الإجمالية (ريال)', 'القيمة': dashboardData.totalValue || 0 },
        { 'البيان': 'طلبات جديدة', 'القيمة': dashboardData.new || 0 },
        { 'البيان': 'طلبات موافق عليها', 'القيمة': dashboardData.approved || 0 },
        { 'البيان': 'طلبات تم التعاقد', 'القيمة': dashboardData.contracted || 0 },
        { 'البيان': 'طلبات تم التسليم', 'القيمة': dashboardData.delivered || 0 },
        { 'البيان': 'طلبات مرفوضة', 'القيمة': dashboardData.rejected || 0 },
      ];

      // Top Suppliers
      const suppliersData = (dashboardData.topSuppliers || []).map((supplier: any, index: number) => ({
        'الترتيب': `#${index + 1}`,
        'اسم المورد': supplier.name,
        'عدد الطلبات': supplier.orders,
        'القيمة الإجمالية (ريال)': supplier.value
      }));

      // Monthly Data
      const monthlyDataExport = (dashboardData.monthlyData || []).map((month: any) => ({
        'الشهر': month.month,
        'عدد الطلبات': month.orders,
        'القيمة (ريال)': month.value
      }));

      // Orders Details
      const ordersData = filteredOrders.map((order: any) => ({
        'رقم الطلب': order.id || '',
        'رقم الصنف': order.itemNumber || '',
        'اسم الصنف': order.itemName || order.deviceType || '',
        'الجهة المستفيدة': order.beneficiary || '',
        'المورد': order.supplier || '',
        'الحالة': order.status || '',
        'التكلفة الإجمالية': order.totalCost || 0,
        'تاريخ الطلب': order.orderDate || '',
      }));

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Add sheets
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'الإحصائيات الإجمالية');
      
      const ws2 = XLSX.utils.json_to_sheet(suppliersData);
      XLSX.utils.book_append_sheet(wb, ws2, 'أفضل الشركات');
      
      const ws3 = XLSX.utils.json_to_sheet(monthlyDataExport);
      XLSX.utils.book_append_sheet(wb, ws3, 'الاتجاه الشهري');
      
      const ws4 = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(wb, ws4, 'تفاصيل الطلبات');
      
      // Save file
      XLSX.writeFile(wb, 'تقرير_الشراء_المباشر_شامل.xlsx');
      
      toast({
        title: "نجح التصدير",
        description: "تم تصدير التقرير الشامل إلى Excel بنجاح",
      });
    } catch (error) {
      console.error('Excel Export Error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات إلى Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-right">لوحة تحكم الشراء المباشر</h1>
              <p className="text-green-100 mt-1 text-right">إدارة شاملة لطلبات الشراء المباشر</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="sm"
            >
              <FileDown className="ml-2 h-4 w-4" />
              تصدير PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="sm"
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filters - NOT included in PDF export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنشأة" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility: any) => (
                  <SelectItem key={facility.id || facility.name} value={facility.name}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="رقم أو اسم الصنف"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            />

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: any, index: number) => (
                  <SelectItem key={index} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Content - This is what gets exported */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" ref={summaryCardsRef}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.total || 0}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">القيمة الإجمالية</p>
                  <p className="text-xl font-bold text-purple-800">{(dashboardData.totalValue || 0).toLocaleString()}</p>
                  <p className="text-xs text-purple-600">ريال سعودي</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" ref={statusCardsRef}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-600">جديد</p>
                <p className="text-xl font-bold text-blue-800">{dashboardData.new || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-yellow-600">موافق عليه</p>
                <p className="text-xl font-bold text-yellow-800">{dashboardData.approved || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-600">تم التعاقد</p>
                <p className="text-xl font-bold text-purple-800">{dashboardData.contracted || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600">تم التسليم</p>
                <p className="text-xl font-bold text-green-800">{dashboardData.delivered || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-center">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-600">مرفوض</p>
                <p className="text-xl font-bold text-red-800">{dashboardData.rejected || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={chartsRef}>
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">توزيع حالة الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.statusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(dashboardData.statusData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, name]}
                    labelFormatter={() => ''}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend below chart */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                {(dashboardData.statusData || []).map((item: any) => (
                  <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-accent/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm font-medium">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">اتجاه الطلبات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={dashboardData.monthlyData || []} 
                    margin={{ 
                      top: 20, 
                      right: 10, 
                      left: 10, 
                      bottom: 40 
                    }}
                  >
                    <XAxis 
                      dataKey="month" 
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      fontSize={10} 
                      tick={{ fontSize: 10 }}
                      width={30}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                      name="عدد الطلبات"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Suppliers */}
        <Card ref={suppliersRef}>
          <CardHeader>
            <CardTitle className="text-right">أفضل الشركات الموردة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(dashboardData.topSuppliers || []).map((supplier: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <p className="font-medium">{supplier.name}</p>
                    <div className="text-sm text-gray-600">
                      <p>{supplier.orders} طلب</p>
                      <p>{supplier.value.toLocaleString()} ريال</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-green-600">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
