import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Filter, Printer, TrendingUp, Package, Users, DollarSign, Download, FileSpreadsheet, ShoppingCart, Warehouse } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function DispensingReports() {
  const [selectedFacility, setSelectedFacility] = useState('جميع المنشآت');
  const [dispensingData, setDispensingData] = useState([]);
  const [dispensingOperations, setDispensingOperations] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sumAll, setSumAll] = useState(0); // اجمالي قيمة الشراء
  const [sumInv, setSumInv] = useState(0); // اجمالي قيمة المخزون المتبقي
  const [itemNameFilter, setItemNameFilter] = useState('');
  const [itemNumberFilter, setItemNumberFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const { toast } = useToast();

  // Get unique item names for the select dropdown
  const uniqueItemNames = [...new Set(dispensingOperations.map(item => item.itemName).filter(Boolean))];

  // Filter data based on all filters
  const filteredData = dispensingOperations.filter(item => {
    const facilityMatch = selectedFacility === 'جميع المنشآت' || item.facility === selectedFacility;
    const itemNameMatch = !itemNameFilter || itemNameFilter === 'all' || item.itemName === itemNameFilter;
    const itemNumberMatch = !itemNumberFilter || (item.itemNumber && item.itemNumber.toString().includes(itemNumberFilter));
    
    let dateMatch = true;
    if (dateFromFilter || dateToFilter) {
      const itemDate = item.date ? new Date(item.date) : new Date(item.created_at);
      if (dateFromFilter) {
        dateMatch = dateMatch && itemDate >= new Date(dateFromFilter);
      }
      if (dateToFilter) {
        dateMatch = dateMatch && itemDate <= new Date(dateToFilter);
      }
    }
    
    return facilityMatch && itemNameMatch && itemNumberMatch && dateMatch;
  });

  // Use original dashboard data for charts, with facility filter applied
  const filteredChartData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.chartData || [] 
    : dashboardData?.chartData?.filter((item) => item.facility === selectedFacility) || [];

  const filteredFacilityData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.facilityData || [] 
    : dashboardData?.facilityData?.filter((item) => item.name === selectedFacility) || [];

  const filteredTrendData = selectedFacility === 'جميع المنشآت' 
    ? dashboardData?.trendData || [] 
    : dashboardData?.trendData?.filter((item) => item.facility === selectedFacility) || [];
  const totalDispensingValue = filteredData.reduce((sum, item) => sum + (item.totalValue || item.total_value || 0), 0);
  const totalItems = filteredData.reduce((sum, item) => sum + (item.items || item.items_count || 0), 0);
  const avgPerDispensing = totalDispensingValue / filteredData.length || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dispensingResponse, operationsResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getDispensingData(),
          warehouseApi.getDispensingOperations(),
          reportsApi.getFacilities()
        ]);

        if (dispensingResponse.success) {
          setDispensingData(dispensingResponse.data);
          setDashboardData(dispensingResponse.data);
          // Set the new values from API response
          setSumAll((dispensingResponse as any).sum_all || 0);
          setSumInv((dispensingResponse as any).sum_inv || 0);
        }

        if (operationsResponse.success) {
          setDispensingOperations(operationsResponse.data);
        }

        if (facilitiesResponse.success) {
          setFacilities([{ id: 'all', name: 'جميع المنشآت' }, ...facilitiesResponse.data]);
        }
      } catch (error) {
        console.error('Error fetching dispensing data:', error);
        toast({
          title: "خطأ",
          description: error.message || "فشل في تحميل بيانات تقارير الصرف",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleExportToPDF = () => {
    const currentDate = new Date().toLocaleDateString('ar-SA');
    const currentTime = new Date().toLocaleTimeString('ar-SA');
    
    const tableRows = filteredData.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.id}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.date || new Date(item.created_at).toLocaleDateString('ar-SA')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.facility}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.itemName || 'غير محدد'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.itemNumber || 'غير محدد'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.withdrawQty || 'غير محدد'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.items || item.items_count}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(item.totalValue || item.total_value || 0).toLocaleString()} ريال</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.requested_by || item.requestedBy || 'غير محدد'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.status}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.category}</td>
      </tr>
    `).join('');

    const pdfContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تفاصيل عمليات الصرف</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
            direction: rtl;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header h2 {
            color: #64748b;
            margin: 10px 0;
            font-size: 16px;
          }
          .stats-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 15px;
            text-align: center;
          }
          .stat-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
          }
          th {
            background-color: #f8fafc;
            font-weight: bold;
            color: #1e293b;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; font-size: 9px; }
            .stats-grid { grid-template-columns: repeat(3, 1fr); }
            table { font-size: 8px; }
            th, td { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير تفاصيل عمليات الصرف</h1>
          <h2>المنشأة المختارة: ${selectedFacility}</h2>
          <h2>تاريخ التقرير: ${currentDate} - ${currentTime}</h2>
        </div>

        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">إجمالي قيمة الصرف</div>
              <div class="stat-value">${totalDispensingValue.toLocaleString()} ريال</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">إجمالي قيمة الشراء</div>
              <div class="stat-value">${sumAll.toLocaleString()} ريال</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">إجمالي قيمة المخزون المتبقي</div>
              <div class="stat-value">${sumInv.toLocaleString()} ريال</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">إجمالي الأصناف المصروفة</div>
              <div class="stat-value">${totalItems}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">عدد عمليات الصرف</div>
              <div class="stat-value">${filteredData.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">متوسط قيمة الصرف</div>
              <div class="stat-value">${avgPerDispensing.toFixed(0)} ريال</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>رقم أمر الصرف</th>
              <th>تاريخ الصرف</th>
              <th>اسم المنشأة</th>
              <th>اسم الصنف</th>
              <th>رقم الصنف</th>
              <th>الكمية</th>
              <th>عدد الأصناف</th>
              <th>القيمة الإجمالية</th>
              <th>اسم المستلم</th>
              <th>حالة الطلب</th>
              <th>فئة الصنف</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>نظام إدارة المستودعات الطبية</p>
          <p>عدد السجلات: ${filteredData.length} سجل</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast({
        title: "تم بنجاح",
        description: "تم فتح تقرير PDF للطباعة",
      });
    }
  };

  const handleExportPageToPDF = () => {
    window.print();
    
    toast({
      title: "تم بنجاح",
      description: "تم فتح نافذة الطباعة للصفحة",
    });
  };

  const handleExportPageToExcel = () => {
    // Prepare summary data for Excel export
    const summaryData = [
      { 'البيان': 'إجمالي قيمة الصرف', 'القيمة': `${totalDispensingValue.toLocaleString()} ريال` },
      { 'البيان': 'إجمالي قيمة الشراء', 'القيمة': `${sumAll.toLocaleString()} ريال` },
      { 'البيان': 'إجمالي قيمة المخزون المتبقي', 'القيمة': `${sumInv.toLocaleString()} ريال` },
      { 'البيان': 'إجمالي الأصناف المصروفة', 'القيمة': totalItems },
      { 'البيان': 'عدد عمليات الصرف', 'القيمة': filteredData.length },
      { 'البيان': 'متوسط قيمة الصرف', 'القيمة': `${avgPerDispensing.toFixed(0)} ريال` }
    ];

    // Convert to CSV format
    const headers = Object.keys(summaryData[0]);
    const csvContent = [
      headers.join(','),
      ...summaryData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ملخص_تقارير_الصرف_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم بنجاح",
      description: "تم تصدير ملخص البيانات إلى ملف Excel",
    });
  };

  const handleExportToExcel = () => {
    // Prepare data for Excel export
    const excelData = filteredData.map(item => ({
      'رقم أمر الصرف': item.id,
      'تاريخ الصرف': item.date || new Date(item.created_at).toLocaleDateString('ar-SA'),
      'اسم المنشأة': item.facility,
      'اسم الصنف': item.itemName || 'غير محدد',
      'رقم الصنف': item.itemNumber || 'غير محدد',
      'الكمية': item.withdrawQty || 'غير محدد',
      'عدد الأصناف': item.items || item.items_count,
      'القيمة الإجمالية': (item.totalValue || item.total_value || 0),
      'اسم المستلم': item.requested_by || item.requestedBy || 'غير محدد',
      'حالة الطلب': item.status,
      'فئة الصنف': item.category
    }));

    // Add summary row
    const summaryData = {
      'رقم أمر الصرف': 'الإجمالي',
      'تاريخ الصرف': '',
      'اسم المنشأة': selectedFacility,
      'اسم الصنف': '',
      'رقم الصنف': '',
      'الكمية': '',
      'عدد الأصناف': totalItems,
      'القيمة الإجمالية': totalDispensingValue,
      'اسم المستلم': '',
      'حالة الطلب': '',
      'فئة الصنف': `${filteredData.length} عملية`
    };

    const finalData = [...excelData, summaryData];

    // Convert to CSV format
    const headers = Object.keys(finalData[0]);
    const csvContent = [
      headers.join(','),
      ...finalData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_عمليات_الصرف_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم بنجاح",
      description: "تم تصدير البيانات إلى ملف Excel",
    });
  };

  const handlePrintDetailed = (item) => {
    const currentDate = new Date().toLocaleDateString('ar-SA');
    const currentTime = new Date().toLocaleTimeString('ar-SA');
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير صرف مفصل - ${item.id}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header h2 {
            color: #64748b;
            margin: 5px 0 0 0;
            font-size: 18px;
            font-weight: normal;
          }
          .info-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .info-title {
            color: #1e293b;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #cbd5e1;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
          }
          .info-value {
            color: #1e293b;
            font-weight: 600;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
          }
          .status-completed {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .signature-section {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
          }
          .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            min-height: 80px;
          }
          .signature-title {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }
          .signature-line {
            border-top: 1px solid #64748b;
            margin-top: 30px;
            padding-top: 5px;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body { margin: 0; }
            .info-grid { grid-template-columns: 1fr; }
            .signature-section { grid-template-columns: 1fr; gap: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير صرف مفصل</h1>
          <h2>أمر الصرف رقم: ${item.id}</h2>
        </div>

        <div class="info-section">
          <div class="info-title">📋 بيانات أمر الصرف</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">رقم أمر الصرف:</span>
              <span class="info-value">${item.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ الصرف:</span>
              <span class="info-value">${item.date || 'غير محدد'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاريخ الإنشاء:</span>
              <span class="info-value">${new Date(item.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">اسم المنشأة:</span>
              <span class="info-value">${item.facility}</span>
            </div>
            <div class="info-item">
              <span class="info-label">حالة الطلب:</span>
              <span class="info-value status-badge ${item.status === 'مكتمل' ? 'status-completed' : 'status-pending'}">${item.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">اسم المستلم:</span>
              <span class="info-value">${item.requested_by || item.requestedBy || 'غير محدد'}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-title">📦 تفاصيل الأصناف المصروفة</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">اسم الصنف:</span>
              <span class="info-value">${item.itemName || 'غير محدد'}</span>
            </div>
             <div class="info-item">
               <span class="info-label">رقم الصنف</span>
               <span class="info-value">${item.itemNumber || 'غير محدد'}</span>
             </div>
             <div class="info-item">
               <span class="info-label">الكمية:</span>
               <span class="info-value">${item.withdrawQty || 'غير محدد'}</span>
             </div>
             <div class="info-item">
               <span class="info-label">فئة الصنف:</span>
               <span class="info-value">${item.category || 'غير محدد'}</span>
             </div>
            <div class="info-item">
              <span class="info-label">عدد الأصناف:</span>
              <span class="info-value">${item.items || item.items_count || 0}</span>
            </div>
            <div class="info-item">
              <span class="info-label">القيمة الإجمالية:</span>
              <span class="info-value">${(item.totalValue || item.total_value || 0).toLocaleString()} ريال سعودي</span>
            </div>
          </div>
        </div>

        ${item.notes ? `
        <div class="info-section">
          <div class="info-title">📝 ملاحظات</div>
          <div class="info-item">
            <span class="info-value">${item.notes}</span>
          </div>
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-title">مسؤول المستودع</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">المستلم</div>
            <div class="signature-line">التوقيع</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">المشرف</div>
            <div class="signature-line">التوقيع</div>
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بتاريخ: ${currentDate} الساعة: ${currentTime}</p>
          <p>نظام إدارة المستودعات الطبية</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 sm:p-6 text-primary-foreground shadow-lg print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">تقارير الصرف</h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">عرض وإدارة تقارير عمليات الصرف للمنشآت</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportPageToPDF}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير الصفحة PDF
            </Button>
            <Button 
              onClick={handleExportPageToExcel}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              تصدير الصفحة Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-right flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            فلترة التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">الجهة المستفيدة/المنشأة</label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id || facility} value={facility.name || facility}>
                      {facility.name || facility}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">اسم الصنف</label>
              <Select value={itemNameFilter} onValueChange={setItemNameFilter}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="جميع الأصناف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأصناف</SelectItem>
                  {uniqueItemNames.map((itemName) => (
                    <SelectItem key={itemName} value={itemName}>
                      {itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">رقم الصنف</label>
              <Input
                type="text"
                placeholder="ابحث برقم الصنف..."
                value={itemNumberFilter}
                onChange={(e) => setItemNumberFilter(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">التاريخ من</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium mb-2 block text-right">التاريخ إلى</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2 flex items-end">
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => {
                  setItemNameFilter('all');
                  setItemNumberFilter('');
                  setDateFromFilter('');
                  setDateToFilter('');
                  setSelectedFacility('جميع المنشآت');
                }}
              >
                <Filter className="w-4 h-4 ml-2" />
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">إجمالي قيمة الصرف</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight break-words overflow-hidden">{totalDispensingValue.toLocaleString()}</p>
                <p className="text-xs text-blue-100 mt-1">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-indigo-100 text-xs sm:text-sm font-medium mb-1">إجمالي قيمة الشراء</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight break-words overflow-hidden">{sumAll.toLocaleString()}</p>
                <p className="text-xs text-indigo-100 mt-1">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-teal-100 text-xs sm:text-sm font-medium mb-1">إجمالي قيمة المخزون المتبقي</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight break-words overflow-hidden">{sumInv.toLocaleString()}</p>
                <p className="text-xs text-teal-100 mt-1">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <Warehouse className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">إجمالي الأصناف المصروفة</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold leading-none break-words">{totalItems}</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">عدد عمليات الصرف</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold leading-none break-words">{filteredData.length}</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">متوسط قيمة الصرف</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight break-words overflow-hidden">{avgPerDispensing.toFixed(0)}</p>
                <p className="text-xs text-orange-100 mt-1">ريال</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">اتجاه الصرف الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(value) => [`${value} ريال`, 'القيمة']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

     <Card>
  <CardHeader>
    <CardTitle className="text-sm sm:text-base">توزيع الصرف حسب المنشأة</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-[200px] sm:h-[250px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredFacilityData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={70}
            dataKey="value"
          >
            {filteredFacilityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, 'النسبة']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    {/* Legend/Labels Section */}
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredFacilityData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div 
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color || '#3b82f6' }}
            ></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {entry.name}
              </div>
              <div className="text-xs font-bold text-primary">
                {entry.value}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
      </div>

      {/* Trend Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">مقارنة الاتجاهات - الصرف مقابل الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="dispensing" stroke="#1d4ed8" strokeWidth={3} name="عمليات الصرف" />
                <Line type="monotone" dataKey="requests" stroke="#dc2626" strokeWidth={3} name="الطلبات" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dispensing Table */}
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-sm sm:text-base">تفاصيل عمليات الصرف</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleExportToPDF}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
              <Button 
                onClick={handleExportToExcel}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تصدير Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">رقم أمر الصرف</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">تاريخ الصرف</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">اسم المنشأة</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">اسم الصنف</th>
                   <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">رقم الصنف</th>
                   <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">الكمية</th>
                   <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">عدد الأصناف</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">القيمة الإجمالية</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">اسم المستلم</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">حالة الطلب</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">فئة الصنف</th>
                  <th className="text-right text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                     <td colSpan={12} className="text-center p-4 border border-gray-200">
                       جاري تحميل البيانات...
                     </td>
                   </tr>
                 ) : filteredData.length === 0 ? (
                   <tr>
                     <td colSpan={12} className="text-center p-4 border border-gray-200">
                       لا توجد بيانات متاحة
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="font-medium text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2">{item.id}</td>
                      <td className="text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2">{item.date || new Date(item.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.facility}</td>
                      <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.itemName || 'غير محدد'}</td>
                       <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.itemNumber || 'غير محدد'}</td>
                       <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.withdrawQty || 'غير محدد'}</td>
                       <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.items || item.items_count}</td>
                      <td className="text-xs sm:text-sm whitespace-nowrap border border-gray-200 p-2">{(item.totalValue || item.total_value || 0).toLocaleString()} ريال</td>
                      <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.requested_by || item.requestedBy || 'غير محدد'}</td>
                      <td className="border border-gray-200 p-2">
                        <Badge variant={item.status === 'مكتمل' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="text-xs sm:text-sm border border-gray-200 p-2">{item.category}</td>
                       <td className="border border-gray-200 p-2">
                        <Button 
                          onClick={() => handlePrintDetailed(item)} 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          <Printer className="w-3 h-3 ml-1" />
                          طباعة
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
