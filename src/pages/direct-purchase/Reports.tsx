import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter, Loader2 } from 'lucide-react';
import { directPurchaseApi, facilitiesApi, suppliersApi } from '@/lib/api';
import { exportToExcel } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  'جديد': 'bg-blue-100 text-blue-800',
  'موافق عليه': 'bg-yellow-100 text-yellow-800',
  'تم التعاقد': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرفوض': 'bg-red-100 text-red-800'
};

export default function DirectPurchaseReports() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [statusFilter, itemFilter, facilityFilter, supplierFilter, allOrders]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and search
  const applyFilters = () => {
    let filtered = allOrders;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (itemFilter) {
      filtered = filtered.filter(order => 
        order.itemNumber?.includes(itemFilter) || order.itemName?.includes(itemFilter)
      );
    }

    if (facilityFilter && facilityFilter !== 'all') {
      filtered = filtered.filter(order => order.beneficiary === facilityFilter);
    }

    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(order => order.supplier === supplierFilter);
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setItemFilter('');
    setFacilityFilter('all');
    setSupplierFilter('all');
  };

  // Calculate total cost properly
  const calculateTotalCost = () => {
    const total = filteredOrders.reduce((sum, order) => {
      const cost = parseFloat(order.totalCost) || 0;
      return sum + cost;
    }, 0);
    
    // Format number to remove unnecessary decimals
    return total % 1 === 0 ? total.toString() : total.toFixed(2).replace(/\.?0+$/, '');
  };

  // Export functions using real data
  const handleExportToExcel = () => {
    try {
      const exportData = filteredOrders.map(order => {
        const data: any = {
          'رقم الطلب': order.id,
          'رقم الصنف': order.itemNumber,
          'اسم الصنف': order.itemName,
          'الجهة المستفيدة': order.beneficiary,
          'الشركة الموردة': order.supplier,
          'الحالة': order.status,
          'التكلفة': order.totalCost,
          'تاريخ الطلب': order.orderDate
        };

        // Add optional fields only if they have values
        if (order.quantity) data['الكمية'] = order.quantity;
        if (order.supplier_contact) data['اسم المسؤول'] = order.supplier_contact;
        if (order.supplier_phone) data['رقم التواصل'] = order.supplier_phone;
        if (order.supplier_email) data['البريد الإلكتروني'] = order.supplier_email;
        if (order.financialApprovalNumber) data['رقم التعميد'] = order.financialApprovalNumber;
        if (order.financialApprovalDate) data['تاريخ التعميد'] = order.financialApprovalDate;
        if (order.deliveryDate) data['تاريخ التسليم'] = order.deliveryDate;
        if (order.creation_date) data['تاريخ الإنشاء'] = order.creation_date;
        if (order.creation_date_note) data['ملاحظة الإنشاء'] = order.creation_date_note;
        if (order.contract_approval_date) data['تاريخ الموافقة'] = order.contract_approval_date;
        if (order.contract_approval_date_note) data['ملاحظة الموافقة'] = order.contract_approval_date_note;
        if (order.contract_date) data['تاريخ التعاقد'] = order.contract_date;
        if (order.contract_date_note) data['ملاحظة التعاقد'] = order.contract_date_note;
        if (order.contract_delivery_date) data['تاريخ التسليم الفعلي'] = order.contract_delivery_date;
        if (order.contract_delivery_date_note) data['ملاحظة التسليم'] = order.contract_delivery_date_note;
        if (order.rejection_date) data['تاريخ الرفض'] = order.rejection_date;
        if (order.rejection_date_note) data['ملاحظة الرفض'] = order.rejection_date_note;

        return data;
      });
      
      exportToExcel(exportData, 'تقرير_الشراء_المباشر');
      toast({
        title: "نجح التصدير",
        description: "تم تصدير التقرير إلى Excel بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير التقرير إلى Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportToPDF = () => {
    try {
      // Check which optional fields have values across all orders
      const hasOptionalFields = {
        quantity: filteredOrders.some(order => order.quantity),
        supplier_contact: filteredOrders.some(order => order.supplier_contact),
        supplier_phone: filteredOrders.some(order => order.supplier_phone),
        supplier_email: filteredOrders.some(order => order.supplier_email),
        financialApprovalNumber: filteredOrders.some(order => order.financialApprovalNumber),
        financialApprovalDate: filteredOrders.some(order => order.financialApprovalDate),
        deliveryDate: filteredOrders.some(order => order.deliveryDate),
        creation_date: filteredOrders.some(order => order.creation_date),
        creation_date_note: filteredOrders.some(order => order.creation_date_note),
        contract_approval_date: filteredOrders.some(order => order.contract_approval_date),
        contract_approval_date_note: filteredOrders.some(order => order.contract_approval_date_note),
        contract_date: filteredOrders.some(order => order.contract_date),
        contract_date_note: filteredOrders.some(order => order.contract_date_note),
        contract_delivery_date: filteredOrders.some(order => order.contract_delivery_date),
        contract_delivery_date_note: filteredOrders.some(order => order.contract_delivery_date_note),
        rejection_date: filteredOrders.some(order => order.rejection_date),
        rejection_date_note: filteredOrders.some(order => order.rejection_date_note)
      };

      // Create PDF content
      const reportData = filteredOrders.map(order => ({
        id: order.id || '',
        itemNumber: order.itemNumber || '',
        itemName: order.itemName || '',
        quantity: order.quantity || '',
        beneficiary: order.beneficiary || '',
        supplier: order.supplier || '',
        supplier_contact: order.supplier_contact || '',
        supplier_phone: order.supplier_phone || '',
        supplier_email: order.supplier_email || '',
        financialApprovalNumber: order.financialApprovalNumber || '',
        financialApprovalDate: order.financialApprovalDate || '',
        status: order.status || '',
        totalCost: order.totalCost || 0,
        orderDate: order.orderDate || '',
        deliveryDate: order.deliveryDate || '',
        creation_date: order.creation_date || '',
        creation_date_note: order.creation_date_note || '',
        contract_approval_date: order.contract_approval_date || '',
        contract_approval_date_note: order.contract_approval_date_note || '',
        contract_date: order.contract_date || '',
        contract_date_note: order.contract_date_note || '',
        contract_delivery_date: order.contract_delivery_date || '',
        contract_delivery_date_note: order.contract_delivery_date_note || '',
        rejection_date: order.rejection_date || '',
        rejection_date_note: order.rejection_date_note || ''
      }));

      // Generate dynamic headers based on available data
      const headers = [
        '<th>رقم الطلب</th>',
        '<th>رقم الصنف</th>',
        '<th>اسم الصنف</th>',
        ...(hasOptionalFields.quantity ? ['<th>الكمية</th>'] : []),
        '<th>الجهة المستفيدة</th>',
        '<th>الشركة الموردة</th>',
        ...(hasOptionalFields.supplier_contact ? ['<th>اسم المسؤول</th>'] : []),
        ...(hasOptionalFields.supplier_phone ? ['<th>رقم التواصل</th>'] : []),
        ...(hasOptionalFields.supplier_email ? ['<th>البريد الإلكتروني</th>'] : []),
        ...(hasOptionalFields.financialApprovalNumber ? ['<th>رقم التعميد</th>'] : []),
        ...(hasOptionalFields.financialApprovalDate ? ['<th>تاريخ التعميد</th>'] : []),
        '<th>الحالة</th>',
        '<th>التكلفة</th>',
        '<th>تاريخ الطلب</th>',
        ...(hasOptionalFields.deliveryDate ? ['<th>تاريخ التسليم</th>'] : []),
        ...(hasOptionalFields.creation_date ? ['<th>تاريخ الإنشاء</th>'] : []),
        ...(hasOptionalFields.creation_date_note ? ['<th>ملاحظة الإنشاء</th>'] : []),
        ...(hasOptionalFields.contract_approval_date ? ['<th>تاريخ الموافقة</th>'] : []),
        ...(hasOptionalFields.contract_approval_date_note ? ['<th>ملاحظة الموافقة</th>'] : []),
        ...(hasOptionalFields.contract_date ? ['<th>تاريخ التعاقد</th>'] : []),
        ...(hasOptionalFields.contract_date_note ? ['<th>ملاحظة التعاقد</th>'] : []),
        ...(hasOptionalFields.contract_delivery_date ? ['<th>تاريخ التسليم الفعلي</th>'] : []),
        ...(hasOptionalFields.contract_delivery_date_note ? ['<th>ملاحظة التسليم</th>'] : []),
        ...(hasOptionalFields.rejection_date ? ['<th>تاريخ الرفض</th>'] : []),
        ...(hasOptionalFields.rejection_date_note ? ['<th>ملاحظة الرفض</th>'] : [])
      ];

      // Generate dynamic rows based on available data
      const rows = reportData.map(order => {
        const cells = [
          `<td>${order.id}</td>`,
          `<td>${order.itemNumber}</td>`,
          `<td>${order.itemName}</td>`,
          ...(hasOptionalFields.quantity ? [`<td>${order.quantity}</td>`] : []),
          `<td>${order.beneficiary}</td>`,
          `<td>${order.supplier}</td>`,
          ...(hasOptionalFields.supplier_contact ? [`<td>${order.supplier_contact}</td>`] : []),
          ...(hasOptionalFields.supplier_phone ? [`<td>${order.supplier_phone}</td>`] : []),
          ...(hasOptionalFields.supplier_email ? [`<td>${order.supplier_email}</td>`] : []),
          ...(hasOptionalFields.financialApprovalNumber ? [`<td>${order.financialApprovalNumber}</td>`] : []),
          ...(hasOptionalFields.financialApprovalDate ? [`<td>${order.financialApprovalDate}</td>`] : []),
          `<td><span class="status-${order.status === 'جديد' ? 'new' : order.status === 'موافق عليه' ? 'approved' : order.status === 'تم التعاقد' ? 'contracted' : order.status === 'تم التسليم' ? 'delivered' : 'rejected'}">${order.status}</span></td>`,
          `<td>${parseFloat(order.totalCost || 0).toLocaleString()} ريال</td>`,
          `<td>${order.orderDate}</td>`,
          ...(hasOptionalFields.deliveryDate ? [`<td>${order.deliveryDate}</td>`] : []),
          ...(hasOptionalFields.creation_date ? [`<td>${order.creation_date}</td>`] : []),
          ...(hasOptionalFields.creation_date_note ? [`<td>${order.creation_date_note}</td>`] : []),
          ...(hasOptionalFields.contract_approval_date ? [`<td>${order.contract_approval_date}</td>`] : []),
          ...(hasOptionalFields.contract_approval_date_note ? [`<td>${order.contract_approval_date_note}</td>`] : []),
          ...(hasOptionalFields.contract_date ? [`<td>${order.contract_date}</td>`] : []),
          ...(hasOptionalFields.contract_date_note ? [`<td>${order.contract_date_note}</td>`] : []),
          ...(hasOptionalFields.contract_delivery_date ? [`<td>${order.contract_delivery_date}</td>`] : []),
          ...(hasOptionalFields.contract_delivery_date_note ? [`<td>${order.contract_delivery_date_note}</td>`] : []),
          ...(hasOptionalFields.rejection_date ? [`<td>${order.rejection_date}</td>`] : []),
          ...(hasOptionalFields.rejection_date_note ? [`<td>${order.rejection_date_note}</td>`] : [])
        ];
        return `<tr>${cells.join('')}</tr>`;
      });

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>تقرير الشراء المباشر</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
            th { background-color: #4f46e5; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-new { background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; }
            .status-approved { background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; }
            .status-contracted { background-color: #e9d5ff; color: #7c3aed; padding: 4px 8px; border-radius: 4px; }
            .status-delivered { background-color: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 4px; }
            .status-rejected { background-color: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">تقرير الشراء المباشر</div>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          <div class="summary">
            <p><strong>إجمالي الطلبات:</strong> ${filteredOrders.length}</p>
            <p><strong>إجمالي التكلفة:</strong> ${calculateTotalCost()} ريال</p>
          </div>

          <table>
            <thead>
              <tr>
                ${headers.join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_الشراء_المباشر_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      // Use browser's print to PDF functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      }

      toast({
        title: "نجح التصدير",
        description: "تم تصدير التقرير إلى PDF بنجاح",
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير التقرير إلى PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-right">تقارير الشراء المباشر</h1>
            <p className="text-indigo-100 mt-1 text-right">إنشاء وعرض تقارير مفصلة لطلبات الشراء</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">حالة الطلب</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="جديد">جديد</SelectItem>
                  <SelectItem value="موافق عليه">موافق عليه</SelectItem>
                  <SelectItem value="تم التعاقد">تم التعاقد</SelectItem>
                  <SelectItem value="تم التسليم">تم التسليم</SelectItem>
                  <SelectItem value="مرفوض">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم أو اسم الصنف</label>
              <Input
                placeholder="أدخل رقم أو اسم الصنف"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المنشأة</label>
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنشأة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنشآت</SelectItem>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.name}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الشركة الموردة</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشركة الموردة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Export Buttons - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تصدير التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              onClick={handleExportToExcel} 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto flex items-center justify-center"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير إلى Excel
            </Button>
            <Button 
              onClick={handleExportToPDF} 
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto flex items-center justify-center"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير إلى PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">نتائج التقرير</CardTitle>
            <p className="text-muted-foreground text-right">
              إجمالي الطلبات: {filteredOrders.length} | 
              إجمالي التكلفة: {calculateTotalCost()} ريال
            </p>
          </CardHeader>
          <CardContent>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-right">رقم الطلب</th>
                    <th className="p-2 text-right">رقم الصنف</th>
                    <th className="p-2 text-right">اسم الصنف</th>
                    <th className="p-2 text-right">الكمية</th>
                    <th className="p-2 text-right">الجهة المستفيدة</th>
                    <th className="p-2 text-right">الشركة الموردة</th>
                    <th className="p-2 text-right">رقم التعميد</th>
                    <th className="p-2 text-right">تاريخ التعميد</th>
                    <th className="p-2 text-right">الحالة</th>
                    <th className="p-2 text-right">التكلفة</th>
                    <th className="p-2 text-right">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{order.id}</td>
                      <td className="p-2">{order.itemNumber}</td>
                      <td className="p-2">{order.itemName}</td>
                      <td className="p-2">{order.quantity || 'غير محدد'}</td>
                      <td className="p-2">{order.beneficiary}</td>
                      <td className="p-2">{order.supplier}</td>
                      <td className="p-2">{order.financialApprovalNumber || 'غير محدد'}</td>
                      <td className="p-2">{order.financialApprovalDate || 'غير محدد'}</td>
                      <td className="p-2">
                        <Badge className={statusConfig[order.status as keyof typeof statusConfig]}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-2">{order.totalCost.toLocaleString()} ريال</td>
                      <td className="p-2">{order.orderDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge className={statusConfig[order.status as keyof typeof statusConfig]}>
                          {order.status}
                        </Badge>
                        <span className="font-bold">{order.id}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>الصنف:</strong> {order.itemName}</p>
                        <p><strong>الكمية:</strong> {order.quantity || 'غير محدد'}</p>
                        <p><strong>الجهة المستفيدة:</strong> {order.beneficiary}</p>
                        <p><strong>الشركة الموردة:</strong> {order.supplier}</p>
                        <p><strong>رقم التعميد:</strong> {order.financialApprovalNumber || 'غير محدد'}</p>
                        <p><strong>تاريخ التعميد:</strong> {order.financialApprovalDate || 'غير محدد'}</p>
                        <p><strong>التكلفة:</strong> {order.totalCost.toLocaleString()} ريال</p>
                        <p><strong>تاريخ الطلب:</strong> {order.orderDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
