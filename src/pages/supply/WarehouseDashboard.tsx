import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, CheckCircle, XCircle, Clock, Building, Users, FileDown, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function WarehouseDashboard() {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [searchedItem, setSearchedItem] = useState<any>(null);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const { toast } = useToast();

  // Get current dashboard data based on selected facility or searched item
  const getCurrentDashboardData = () => {
    // If we have a searched item, use its data
    if (searchedItem) {
      const availableQty = Number(searchedItem.availableQty ?? 0);
      const minQuantity = Number(searchedItem.minQuantity ?? 0);
      const lowStock = availableQty < minQuantity ? 1 : 0;
      
      const withdrawalCount = Number(searchedItem.withdrawalOrdersCount ?? 0) || 0;
      const refusedCount = Number(searchedItem.refusedOrders ?? 0) || 0;
      
      // If no completed orders, treat as one open order to render the chart
      const openOrders = withdrawalCount === 0 ? 1 : 0;
      
      return {
        totalItems: 1,
        lowStockItems: lowStock,
        orders: { 
          open: openOrders, 
          completed: withdrawalCount, 
          rejected: refusedCount 
        },
        orderStatusData: [
          { name: 'مفتوح', value: openOrders, color: '#3b82f6' },
          { name: 'مصروف', value: withdrawalCount, color: '#10b981' },
          { name: 'مرفوض', value: refusedCount, color: '#ef4444' }
        ]
      };
    }

    if (!dashboardData) return null;

    if (selectedFacility) {
      // Find the selected facility's data
      const facilityData = dashboardData.facilitiesData?.find((facility: any) => 
        facility.name === selectedFacility
      );
      
      if (facilityData) {
        return {
          totalItems: facilityData.totalItems,
          lowStockItems: facilityData.lowStockItems,
          orders: facilityData.orders,
          orderStatusData: facilityData.orderStatusData
        };
      }
    }
    
    // Return overall dashboard data if no facility selected
    return {
      totalItems: dashboardData.totalItems,
      lowStockItems: dashboardData.lowStockItems,
      orders: dashboardData.orders,
      orderStatusData: dashboardData.orderStatusData
    };
  };

  // Get current dashboard data
  const currentData = getCurrentDashboardData() || {
    totalItems: 0,
    lowStockItems: 0,
    orders: { open: 0, completed: 0, rejected: 0 },
    orderStatusData: []
  };

  // Filtered data for facilities chart
  const filteredFacilitiesData = searchedItem && searchedItem.withdrawalOrders 
    ? (() => {
        // Count withdrawal orders per facility
        const facilityCounts = searchedItem.withdrawalOrders.reduce((acc: any, order: any) => {
          const facilityName = order.facilityName;
          acc[facilityName] = (acc[facilityName] || 0) + 1;
          return acc;
        }, {});
        
        // Convert to array format
        return Object.entries(facilityCounts).map(([name, count]) => ({
          name,
          items: count
        }));
      })()
    : dashboardData?.facilitiesData?.filter((facility: any) => 
        !selectedFacility || facility.name === selectedFacility
      ) || [];

  const filteredSuppliers = topSuppliers.filter(supplier => 
    !selectedSupplier || supplier.name === selectedSupplier
  );

  // Prepare facilities data for the new bar-style layout
  const facilitiesChartData = filteredFacilitiesData.map((facility: any, index: number) => ({
    name: facility.name,
    items: facility.items || facility.totalItems || 0,
    fill: `hsl(${(index * 45) % 360}, 65%, 55%)`
  })).sort((a, b) => b.items - a.items);

  // Calculate total items for percentage calculation
  const totalFacilityItems = facilitiesChartData.reduce((sum, facility) => sum + facility.items, 0);

  // Determine how many facilities to show
  const facilitiesToShow = showAllFacilities ? facilitiesChartData : facilitiesChartData.slice(0, 7);
  const hasMoreFacilities = facilitiesChartData.length > 7;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, suppliersResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getDashboardData(),
          warehouseApi.getTopSuppliers(),
          reportsApi.getFacilities()
        ]);

        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        }

        if (suppliersResponse.success) {
          setTopSuppliers(suppliersResponse.data);
        }

        if (facilitiesResponse.success) {
          setFacilities(facilitiesResponse.data);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "خطأ",
          description: error.message || "فشل في تحميل بيانات لوحة التحكم",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleFilter = async () => {
    // If item search is provided, call the API
    if (selectedItem.trim()) {
      try {
        setLoading(true);
        const response = await warehouseApi.searchItems(selectedItem, selectedFacility);
        
        if (response.success) {
          // Store the single item data
          setSearchedItem(response.data);
          toast({
            title: "نجح",
            description: "تم العثور على الصنف بنجاح",
          });
        }
      } catch (error: any) {
        console.error('Error searching items:', error);
        setSearchedItem(null);
        toast({
          title: "خطأ",
          description: error.message || "لم يتم العثور على الصنف",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const clearFilters = () => {
    setSelectedFacility('');
    setSelectedItem('');
    setSelectedSupplier('');
    setSearchedItem(null);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary data
      const summaryData = [
        ['لوحة تحكم المستودع', ''],
        ['', ''],
        ['المؤشر', 'القيمة'],
        ['إجمالي الأصناف', currentData.totalItems],
        ['المخزون المنخفض', currentData.lowStockItems],
        ['طلبات مصروفة', currentData.orders.completed],
        ['طلبات مفتوحة', currentData.orders.open],
        ['طلبات مرفوضة', currentData.orders.rejected],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'ملخص');

      // Facilities data
      if (facilitiesChartData.length > 0) {
        const facilitiesData = [
          ['المنشأة', 'عدد الأصناف', 'النسبة المئوية'],
          ...facilitiesChartData.map(f => [
            f.name,
            f.items,
            `${totalFacilityItems > 0 ? Math.round((f.items / totalFacilityItems) * 100) : 0}%`
          ])
        ];
        const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData);
        XLSX.utils.book_append_sheet(wb, facilitiesSheet, 'المنشآت');
      }

      // Suppliers data
      if (filteredSuppliers.length > 0) {
        const suppliersData = [
          ['الشركة الموردة', 'عدد الأصناف'],
          ...filteredSuppliers.map(s => [
            s.name,
            s.items_supplied || s.itemsSupplied
          ])
        ];
        const suppliersSheet = XLSX.utils.aoa_to_sheet(suppliersData);
        XLSX.utils.book_append_sheet(wb, suppliersSheet, 'الموردين');
      }

      XLSX.writeFile(wb, `warehouse-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "نجح",
        description: "تم تصدير البيانات إلى Excel بنجاح",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ",
        description: "فشل تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 sm:p-6 text-white no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-right">لوحة تحكم المستودع</h1>
            <p className="text-blue-100 mt-2 text-right text-sm sm:text-base">إدارة شاملة لمخزون المستودع والطلبات</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Printer className="h-4 w-4 ml-2" />
              تصدير PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <FileDown className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-right text-sm sm:text-base">فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="اختر المنشأة" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.name} className="text-sm">
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="رقم أو اسم الصنف"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="text-sm"
            />

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="اختر الشركة الموردة" />
              </SelectTrigger>
              <SelectContent>
                {topSuppliers.map((supplier, index) => (
                  <SelectItem key={index} value={supplier.name} className="text-sm">
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleFilter} className="flex-1 text-sm">
                تطبيق الفلتر
              </Button>
              <Button variant="outline" onClick={clearFilters} className="text-sm">
                مسح
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-blue-600">إجمالي الأصناف</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800">{currentData.totalItems}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-orange-600">المخزون المنخفض</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-800">{currentData.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-green-600">طلبات مصروفة</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800">{currentData.orders.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-blue-600">طلبات مفتوحة</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800">{currentData.orders.open}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Order Status Chart - Modified with hover-only labels and legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm sm:text-base">توزيع حالة الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <ResponsiveContainer width="100%" height={250} key={searchedItem ? 'search-chart' : 'normal-chart'}>
              <PieChart>
                 <Pie
                  data={currentData.orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {currentData.orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, `${name} (${((Number(value) / currentData.orderStatusData.reduce((sum, item) => sum + Number(item.value), 0)) * 100).toFixed(0)}%)`]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
              {currentData.orderStatusData.map((item) => {
                const total = currentData.orderStatusData.reduce((sum, data) => sum + data.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-gray-800 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm font-medium">{item.name} ({item.value}) - {percentage}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Facilities Distribution - Changed to match ReportsDashboard style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm sm:text-base">
              {searchedItem ? 'توزيع الصرف حسب المنشآت' : 'توزيع الأصناف حسب المنشآت'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {facilitiesChartData.length > 0 ? (
              <div className="space-y-3">
                {facilitiesToShow.map((facility, index) => (
                  <div key={facility.name} className="group">
                    {/* Facility Name and Count */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: facility.fill }}
                        ></div>
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {facility.items}
                        </span>
                      </div>
                      <div className="text-right flex-1 min-w-0 mr-2 sm:mr-3">
                        <span className="text-xs sm:text-sm font-medium text-foreground block truncate">
                          {facility.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out group-hover:shadow-lg"
                          style={{ 
                            backgroundColor: facility.fill,
                            width: `${totalFacilityItems > 0 ? (facility.items / Math.max(...facilitiesChartData.map(f => f.items))) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${facility.fill}, ${facility.fill}dd)`
                          }}
                        ></div>
                      </div>
                      
                      {/* Percentage Label */}
                      <div className="absolute left-1 sm:left-2 top-0 h-full flex items-center">
                        <span className="text-xs font-medium text-black dark:text-white drop-shadow-sm">
                          {totalFacilityItems > 0 ? Math.round((facility.items / totalFacilityItems) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show More/Less Button */}
                {hasMoreFacilities && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowAllFacilities(!showAllFacilities)}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200 flex items-center gap-2"
                    >
                      {showAllFacilities ? (
                        <>
                          <span>عرض أقل</span>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>عرض المزيد ({facilitiesChartData.length - 7})</span>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-sm sm:text-base">أكثر الشركات توريداً للأصناف</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <div className="text-center p-4 text-sm">جاري تحميل البيانات...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredSuppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-right">
                    <p className="font-medium text-sm sm:text-base">{supplier.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {supplier.items_supplied || supplier.itemsSupplied} صنف
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="font-bold text-blue-600 text-sm">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
