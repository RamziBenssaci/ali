import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter, Users, Loader2, Printer, Calendar } from 'lucide-react';
import { dentalContractsApi } from '@/lib/api';
import { exportToExcel } from '@/utils/exportUtils';
import { toast } from 'sonner';

// Mock data updated to match new structure
const mockContracts = [
  {
    id: 'CONT-001',
    orderDate: '2024-01-15',
    itemNumber: 'DENT-001',
    itemName: 'كرسي الأسنان المتطور',
    competitionName: 'منافسة أجهزة الأسنان 2024',
    facilityName: 'عيادة الأسنان - المبنى الرئيسي',
    facilityCode: 'DEN001',
    quantityRequested: 5,
    quantityReceived: 3,
    quantityRemaining: 2,
    financialApprovalNumber: 'FA-2024-001',
    approvalDate: '2024-01-10',
    unitPrice: 17000.00,
    totalValue: 85000.00,
    receivedValue: 51000.00,
    remainingValue: 34000.00,
    supplierCompanyName: 'شركة التجهيزات الطبية المتقدمة',
    contactPerson: 'أحمد سالم',
    contactNumber: '+966501234567',
    companyEmail: 'info@medtech.com',
    extractNumber: 'EXT-001',
    deliveryDate: '2024-02-15',
    actualDeliveryDate: '2024-02-14',
    notes: 'تم التسليم في الموعد المحدد',
    status: 'تم التعاقد'
  },
  {
    id: 'CONT-002',
    orderDate: '2024-01-20',
    itemNumber: 'DENT-002',
    itemName: 'جهاز الأشعة السينية للأسنان',
    competitionName: 'منافسة الأجهزة التشخيصية',
    facilityName: 'مركز طب الأسنان التخصصي',
    facilityCode: 'DEN002',
    quantityRequested: 2,
    quantityReceived: 0,
    quantityRemaining: 2,
    financialApprovalNumber: 'FA-2024-002',
    approvalDate: '2024-01-18',
    unitPrice: 60000.00,
    totalValue: 120000.00,
    receivedValue: 0.00,
    remainingValue: 120000.00,
    supplierCompanyName: 'مؤسسة الأجهزة التشخيصية',
    contactPerson: 'محمد علي',
    contactNumber: '+966505555555',
    companyEmail: 'contact@diagnostic.com',
    extractNumber: 'EXT-002',
    deliveryDate: '2024-02-20',
    actualDeliveryDate: null,
    notes: 'في انتظار التسليم',
    status: 'موافق عليه'
  },
  {
    id: 'CONT-003',
    orderDate: '2024-01-10',
    itemNumber: 'DENT-003',
    itemName: 'أدوات تقويم الأسنان',
    competitionName: 'منافسة أدوات التقويم',
    facilityName: 'قسم تقويم الأسنان',
    facilityCode: 'DEN003',
    quantityRequested: 50,
    quantityReceived: 50,
    quantityRemaining: 0,
    financialApprovalNumber: 'FA-2024-003',
    approvalDate: '2024-01-05',
    unitPrice: 900.00,
    totalValue: 45000.00,
    receivedValue: 45000.00,
    remainingValue: 0.00,
    supplierCompanyName: 'شركة الأدوات الطبية المتخصصة',
    contactPerson: 'سارة أحمد',
    contactNumber: '+966507777777',
    companyEmail: 'orders@specialtools.com',
    extractNumber: 'EXT-003',
    deliveryDate: '2024-01-25',
    actualDeliveryDate: '2024-01-24',
    notes: 'تم التسليم بحالة ممتازة',
    status: 'تم التسليم'
  }
];

const statusConfig = {
  'جديد': 'bg-blue-100 text-blue-800',
  'موافق عليه': 'bg-yellow-100 text-yellow-800',
  'تم التعاقد': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'مرفوض': 'bg-red-100 text-red-800'
};

export default function DentalReports() {
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [extractNumberFilter, setExtractNumberFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamic filter options
  const [facilities, setFacilities] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Print individual contract function - updated for new fields
  const printContract = (contract: any) => {
    const formattedTotalValue = parseFloat(contract.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedReceivedValue = parseFloat(contract.receivedValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedRemainingValue = parseFloat(contract.remainingValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const statusClass = {
      'موافق عليه': 'background-color: #fef3c7; color: #92400e;',
      'تم التعاقد': 'background-color: #e9d5ff; color: #6b21a8;',
      'تم التسليم': 'background-color: #d1fae5; color: #065f46;',
      'مرفوض': 'background-color: #fee2e2; color: #991b1b;',
      'جديد': 'background-color: #dbeafe; color: #1e40af;'
    }[contract.status] || 'background-color: #f3f4f6; color: #374151;';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تفاصيل العقد - ${contract.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            direction: rtl; 
            margin: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            color: #6B46C1; 
            margin-bottom: 30px;
            border-bottom: 2px solid #6B46C1;
            padding-bottom: 20px;
          }
          .contract-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
            border-right: 4px solid #6B46C1;
          }
          .detail-label {
            font-weight: bold;
            color: #374151;
            min-width: 150px;
          }
          .detail-value {
            color: #1f2937;
            flex: 1;
            text-align: right;
          }
          .status-badge {
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            ${statusClass}
          }
          .cost-highlight {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
          }
          .print-date {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تفاصيل عقد الأسنان</h1>
          <h2>${contract.id}</h2>
        </div>
        
        <div class="contract-details">
          <div class="detail-row">
            <span class="detail-label">رقم العقد:</span>
            <span class="detail-value">${contract.id}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">رمز المنشأة:</span>
            <span class="detail-value">${contract.facilityCode || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">اسم المنشأة:</span>
            <span class="detail-value">${contract.facilityName || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">اسم المنافسة:</span>
            <span class="detail-value">${contract.competitionName || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">تاريخ الطلب:</span>
            <span class="detail-value">${contract.orderDate || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">رقم الصنف:</span>
            <span class="detail-value">${contract.itemNumber || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">اسم الصنف:</span>
            <span class="detail-value">${contract.itemName || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">رقم المستخلص:</span>
            <span class="detail-value">${contract.extractNumber || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">رقم التعميد المالي:</span>
            <span class="detail-value">${contract.financialApprovalNumber || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">تاريخ التعميد:</span>
            <span class="detail-value">${contract.approvalDate || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">حالة الطلب:</span>
            <span class="detail-value">
              <span class="status-badge">${contract.status || 'غير محدد'}</span>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الكمية المطلوبة:</span>
            <span class="detail-value">${contract.quantityRequested || 0}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الكمية المستلمة:</span>
            <span class="detail-value">${contract.quantityReceived || 0}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الكمية المتبقية:</span>
            <span class="detail-value">${contract.quantityRemaining || 0}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">القيمة الإجمالية:</span>
            <span class="detail-value cost-highlight">${formattedTotalValue} ريال سعودي</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">القيمة المستلمة:</span>
            <span class="detail-value">${formattedReceivedValue} ريال سعودي</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">القيمة المتبقية:</span>
            <span class="detail-value">${formattedRemainingValue} ريال سعودي</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">تاريخ التسليم المتوقع:</span>
            <span class="detail-value">${contract.deliveryDate || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">تاريخ التسليم الفعلي:</span>
            <span class="detail-value">${contract.actualDeliveryDate || 'لم يتم التسليم بعد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الشركة الموردة:</span>
            <span class="detail-value">${contract.supplierCompanyName || 'غير محدد'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">الملاحظات:</span>
            <span class="detail-value">${contract.notes || 'لا توجد ملاحظات'}</span>
          </div>
        </div>
        
        <div class="print-date">
          تم طباعة هذا التقرير في: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}
        </div>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
        
        toast.success(`تم فتح نافذة طباعة العقد ${contract.id}`);
      } else {
        toast.error('فشل في فتح نافذة الطباعة - تأكد من السماح للنوافذ المنبثقة');
      }
    } catch (error) {
      console.error('Error printing contract:', error);
      toast.error('فشل في طباعة العقد');
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dentalContractsApi.getContracts();
        if (response.success && response.data) {
          setAllContracts(response.data);
          setFilteredContracts(response.data);
          
          // Extract unique values for filters
          const uniqueFacilities = [...new Set(response.data.map((contract: any) => contract.facilityName).filter(Boolean))];
          const uniqueSuppliers = [...new Set(response.data.map((contract: any) => contract.supplierCompanyName).filter(Boolean))];
          const uniqueStatuses = [...new Set(response.data.map((contract: any) => contract.status).filter(Boolean))];
          
          setFacilities(uniqueFacilities);
          setSuppliers(uniqueSuppliers);
          setStatuses(uniqueStatuses);
          
          toast.success('تم تحميل البيانات بنجاح');
        } else {
          // Fallback to mock data if API fails
          setAllContracts(mockContracts);
          setFilteredContracts(mockContracts);
          
          const uniqueFacilities = [...new Set(mockContracts.map(contract => contract.facilityName).filter(Boolean))];
          const uniqueSuppliers = [...new Set(mockContracts.map(contract => contract.supplierCompanyName).filter(Boolean))];
          const uniqueStatuses = [...new Set(mockContracts.map(contract => contract.status).filter(Boolean))];
          
          setFacilities(uniqueFacilities);
          setSuppliers(uniqueSuppliers);
          setStatuses(uniqueStatuses);
          
          toast.error('فشل في جلب البيانات من الخادم، سيتم عرض البيانات التجريبية');
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
        // Fallback to mock data
        setAllContracts(mockContracts);
        setFilteredContracts(mockContracts);
        
        const uniqueFacilities = [...new Set(mockContracts.map(contract => contract.facilityName).filter(Boolean))];
        const uniqueSuppliers = [...new Set(mockContracts.map(contract => contract.supplierCompanyName).filter(Boolean))];
        const uniqueStatuses = [...new Set(mockContracts.map(contract => contract.status).filter(Boolean))];
        
        setFacilities(uniqueFacilities);
        setSuppliers(uniqueSuppliers);
        setStatuses(uniqueStatuses);
        
        toast.error('فشل في جلب البيانات من الخادم، سيتم عرض البيانات التجريبية');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter values or data changes
  useEffect(() => {
    let filtered = [...allContracts];

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Item filter (number or name)
    if (itemFilter) {
      filtered = filtered.filter(contract => 
        contract.itemNumber?.toLowerCase().includes(itemFilter.toLowerCase()) || 
        contract.itemName?.toLowerCase().includes(itemFilter.toLowerCase())
      );
    }

    // Facility filter
    if (facilityFilter && facilityFilter !== 'all') {
      filtered = filtered.filter(contract => contract.facilityName === facilityFilter);
    }

    // Supplier filter
    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter(contract => contract.supplierCompanyName === supplierFilter);
    }

    // Extract number filter
    if (extractNumberFilter) {
      filtered = filtered.filter(contract => 
        contract.extractNumber?.toLowerCase().includes(extractNumberFilter.toLowerCase())
      );
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(contract => 
        contract.orderDate && contract.orderDate >= dateFromFilter
      );
    }

    if (dateToFilter) {
      filtered = filtered.filter(contract => 
        contract.orderDate && contract.orderDate <= dateToFilter
      );
    }

    setFilteredContracts(filtered);
  }, [statusFilter, itemFilter, facilityFilter, supplierFilter, extractNumberFilter, dateFromFilter, dateToFilter, allContracts]);

  // Calculate totals with proper formatting - EXCLUDE rejected contracts
// Calculate totals with proper formatting - EXCLUDE rejected contracts
  const calculateTotalValue = () => {
    const total = filteredContracts
      .filter(contract => contract.status !== 'مرفوض') // Add this filter
      .reduce((sum, contract) => {
        const value = parseFloat(contract.totalValue) || 0;
        return sum + value;
      }, 0);
    
    return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateReceivedValue = () => {
    const total = filteredContracts
      .filter(contract => contract.status !== 'مرفوض') // Add this filter
      .reduce((sum, contract) => {
        const value = parseFloat(contract.receivedValue) || 0;
        return sum + value;
      }, 0);
    
    return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateRemainingValue = () => {
    const total = filteredContracts
      .filter(contract => contract.status !== 'مرفوض') // Add this filter
      .reduce((sum, contract) => {
        const totalValue = parseFloat(contract.totalValue) || 0;
        const receivedValue = parseFloat(contract.receivedValue) || 0;
        const remaining = totalValue - receivedValue;
        return sum + remaining;
      }, 0);
    
    return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to calculate remaining value for a single contract
  const getRemainingValue = (contract: any) => {
    const totalValue = parseFloat(contract.totalValue) || 0;
    const receivedValue = parseFloat(contract.receivedValue) || 0;
    return totalValue - receivedValue;
  };
  const clearFilters = () => {
    setStatusFilter('all');
    setItemFilter('');
    setFacilityFilter('all');
    setSupplierFilter('all');
    setExtractNumberFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const handleExportToExcel = async () => {
    if (filteredContracts.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      const exportData = filteredContracts.map(contract => ({
        'رمز المنشأة': contract.facilityCode || '',
        'اسم المنشأة': contract.facilityName || '',
        'اسم المنافسة': contract.competitionName || '',
        'تاريخ الطلب': contract.orderDate || '',
        'رقم الصنف': contract.itemNumber || '',
        'اسم الصنف': contract.itemName || '',
        'رقم المستخلص': contract.extractNumber || '',
        'رقم التعميد': contract.financialApprovalNumber || '',
        'تاريخ التعميد': contract.approvalDate || '',
        'حالة الطلب': contract.status || '',
        'الكمية المطلوبة': contract.quantityRequested || 0,
        'الكمية المستلمة': contract.quantityReceived || 0,
        'الكمية المتبقية': contract.quantityRemaining || 0,
        'القيمة الإجمالية': contract.totalValue || 0,
        'القيمة المستلمة': contract.receivedValue || 0,
        'القيمة المتبقية': contract.remainingValue || 0,
        'تاريخ التسليم': contract.actualDeliveryDate || contract.deliveryDate || '',
        'الملاحظات': contract.notes || ''
      }));

      await exportToExcel(exportData, 'تقرير_عقود_الأسنان');
      toast.success('تم تصدير التقرير إلى Excel بنجاح');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('فشل في تصدير التقرير إلى Excel');
    }
  };

  const handleExportToPDF = () => {
    if (filteredContracts.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير عقود الأسنان</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              direction: rtl; 
              margin: 10px;
              font-size: 9px;
            }
            h1 { 
              text-align: center; 
              color: #6B46C1; 
              margin-bottom: 20px;
              font-size: 16px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 4px; 
              text-align: right;
              font-size: 8px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
              font-size: 9px;
            }
            .summary {
              margin-bottom: 15px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
              font-size: 10px;
            }
            .status-badge {
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 7px;
              font-weight: bold;
            }
            .status-approved { background-color: #fef3c7; color: #92400e; }
            .status-contracted { background-color: #e9d5ff; color: #6b21a8; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-rejected { background-color: #fee2e2; color: #991b1b; }
            .status-new { background-color: #dbeafe; color: #1e40af; }
            .item-name { max-width: 200px; word-wrap: break-word; }
            .notes-column { max-width: 150px; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <h1>تقرير عقود الأسنان</h1>
          <div class="summary">
            <p><strong>عدد العقود:</strong> ${filteredContracts.length}</p>
            <p><strong>إجمالي القيمة:</strong> ${calculateTotalValue()} ريال</p>
            <p><strong>القيمة المستلمة:</strong> ${calculateReceivedValue()} ريال</p>
            <p><strong>القيمة المتبقية:</strong> ${calculateRemainingValue()} ريال</p>
            <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>رمز المنشأة</th>
                <th>اسم المنشأة</th>
                <th>اسم المنافسة</th>
                <th>تاريخ الطلب</th>
                <th>رقم الصنف</th>
                <th class="item-name">اسم الصنف</th>
                <th>رقم المستخلص</th>
                <th>رقم التعميد</th>
                <th>تاريخ التعميد</th>
                <th>حالة الطلب</th>
                <th>الكمية المطلوبة</th>
                <th>الكمية المستلمة</th>
                <th>الكمية المتبقية</th>
                <th>القيمة الإجمالية</th>
                <th>القيمة المستلمة</th>
                <th>القيمة المتبقية</th>
                <th>تاريخ التسليم</th>
                <th class="notes-column">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredContracts.map(contract => {
                const statusClass = {
                  'موافق عليه': 'status-approved',
                  'تم التعاقد': 'status-contracted',
                  'تم التسليم': 'status-delivered',
                  'مرفوض': 'status-rejected',
                  'جديد': 'status-new'
                }[contract.status] || '';
                
                return `
                  <tr>
                    <td>${contract.facilityCode || ''}</td>
                    <td>${contract.facilityName || ''}</td>
                    <td>${contract.competitionName || ''}</td>
                    <td>${contract.orderDate || ''}</td>
                    <td>${contract.itemNumber || ''}</td>
                    <td class="item-name">${contract.itemName || ''}</td>
                    <td>${contract.extractNumber || ''}</td>
                    <td>${contract.financialApprovalNumber || ''}</td>
                    <td>${contract.approvalDate || ''}</td>
                    <td><span class="status-badge ${statusClass}">${contract.status || ''}</span></td>
                    <td>${contract.quantityRequested || 0}</td>
                    <td>${contract.quantityReceived || 0}</td>
                    <td>${contract.quantityRemaining || 0}</td>
                    <td>${parseFloat(contract.totalValue || 0).toLocaleString()} ريال</td>
                    <td>${parseFloat(contract.receivedValue || 0).toLocaleString()} ريال</td>
                    <td>${parseFloat(contract.remainingValue || 0).toLocaleString()} ريال</td>
                    <td>${contract.actualDeliveryDate || contract.deliveryDate || ''}</td>
                    <td class="notes-column">${contract.notes || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and trigger print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
        
        toast.success('تم فتح نافذة الطباعة - اختر "حفظ كـ PDF" من خيارات الطباعة');
      } else {
        toast.error('فشل في فتح نافذة الطباعة - تأكد من السماح للنوافذ المنبثقة');
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('فشل في تصدير التقرير إلى PDF');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await dentalContractsApi.getContracts();
      if (response.success && response.data) {
        setAllContracts(response.data);
        
        // Update filter options
        const uniqueFacilities = [...new Set(response.data.map((contract: any) => contract.facilityName).filter(Boolean))];
        const uniqueSuppliers = [...new Set(response.data.map((contract: any) => contract.supplierCompanyName).filter(Boolean))];
        const uniqueStatuses = [...new Set(response.data.map((contract: any) => contract.status).filter(Boolean))];
        
        setFacilities(uniqueFacilities);
        setSuppliers(uniqueSuppliers);
        setStatuses(uniqueStatuses);
        
        toast.success('تم تحديث البيانات بنجاح');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('فشل في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-right">تقارير عقود الأسنان</h1>
              <p className="text-purple-100 mt-1 text-right">جاري تحميل البيانات...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-right">تقارير عقود الأسنان</h1>
              <p className="text-purple-100 mt-1 text-right">عرض وإدارة عقود معدات طب الأسنان</p>
            </div>
          </div>
          <Button 
            onClick={refreshData} 
            variant="secondary" 
            size="sm"
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              'تحديث البيانات'
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  من تاريخ
                </label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  إلى تاريخ
                </label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            {/* Extract Number Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-right">رقم المستخلص</label>
              <Input
                placeholder="البحث برقم المستخلص"
                value={extractNumberFilter}
                onChange={(e) => setExtractNumberFilter(e.target.value)}
                className="text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-right">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-right">البحث في الأصناف</label>
              <Input
                placeholder="رقم أو اسم الصنف"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="text-right"
              />
            </div>

         <div>
  <label className="block text-sm font-medium mb-2 text-right">المنشأة</label>
  <Select value={facilityFilter} onValueChange={setFacilityFilter}>
    <SelectTrigger>
      <SelectValue placeholder="اختر المنشأة" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">جميع المنشآت</SelectItem>
      {[...new Set(allContracts.map(c => c.facilityName).filter(Boolean))].sort().map(facility => (
        <SelectItem key={facility} value={facility}>{facility}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">الشركة الموردة</label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">لا توجد بيانات للتصدير</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                onClick={handleExportToExcel} 
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير إلى Excel
              </Button>
              <Button 
                onClick={handleExportToPDF} 
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير إلى PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">ملخص النتائج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 text-right">عدد العقود</h3>
              <p className="text-2xl font-bold text-blue-600 text-right">{filteredContracts.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 text-right">إجمالي القيمة</h3>
              <p className="text-lg font-bold text-green-600 text-right">{calculateTotalValue()} ريال</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 text-right">القيمة المستلمة</h3>
              <p className="text-lg font-bold text-yellow-600 text-right">{calculateReceivedValue()} ريال</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 text-right">القيمة المتبقية</h3>
              <p className="text-lg font-bold text-red-600 text-right">{calculateRemainingValue()} ريال</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">عقود الأسنان</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد عقود تطابق المعايير المحددة</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden xl:block overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-2 text-right font-medium">طباعة</th>
                      <th className="p-2 text-right font-medium">رمز المنشأة</th>
                      <th className="p-2 text-right font-medium">اسم المنشأة</th>
                      <th className="p-2 text-right font-medium">اسم المنافسة</th>
                      <th className="p-2 text-right font-medium">تاريخ الطلب</th>
                      <th className="p-2 text-right font-medium">رقم الصنف</th>
                      <th className="p-2 text-right font-medium min-w-[200px]">اسم الصنف</th>
                      <th className="p-2 text-right font-medium">رقم المستخلص</th>
                      <th className="p-2 text-right font-medium">الحالة</th>
                      <th className="p-2 text-right font-medium">الكمية المطلوبة</th>
                      <th className="p-2 text-right font-medium">القيمة الإجمالية</th>
                      <th className="p-2 text-right font-medium">القيمة المستلمة</th>
                      <th className="p-2 text-right font-medium">القيمة المتبقية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => printContract(contract)}
                            className="h-8 w-8 p-0 hover:bg-purple-100"
                            title={`طباعة العقد ${contract.id}`}
                          >
                            <Printer className="h-4 w-4 text-purple-600" />
                          </Button>
                        </td>
                        <td className="p-2 font-medium">{contract.facilityCode || '-'}</td>
                        <td className="p-2">{contract.facilityName || '-'}</td>
                        <td className="p-2">{contract.competitionName || '-'}</td>
                        <td className="p-2">{contract.orderDate || '-'}</td>
                        <td className="p-2">{contract.itemNumber || '-'}</td>
                        <td className="p-2 min-w-[200px]">{contract.itemName || '-'}</td>
                        <td className="p-2">{contract.extractNumber || '-'}</td>
                        <td className="p-2">
                          <Badge className={statusConfig[contract.status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}>
                            {contract.status || '-'}
                          </Badge>
                        </td>
                        <td className="p-2">{contract.quantityRequested || 0}</td>
                        <td className="p-2">{parseFloat(contract.totalValue || 0).toLocaleString()} ريال</td>
                        <td className="p-2">{parseFloat(contract.receivedValue || 0).toLocaleString()} ريال</td>
                        <td className="p-2">{parseFloat(contract.remainingValue || 0).toLocaleString()} ريال</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet View */}
              <div className="xl:hidden space-y-4">
                {filteredContracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className={statusConfig[contract.status as keyof typeof statusConfig]}>
                              {contract.status || '-'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printContract(contract)}
                              className="h-8 w-8 p-0 hover:bg-purple-100"
                              title={`طباعة العقد ${contract.id}`}
                            >
                              <Printer className="h-4 w-4 text-purple-600" />
                            </Button>
                          </div>
                          <span className="font-bold">{contract.id}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>رمز المنشأة:</strong> {contract.facilityCode || '-'}
                          </div>
                          <div>
                            <strong>اسم المنشأة:</strong> {contract.facilityName || '-'}
                          </div>
                          <div className="col-span-2">
                            <strong>اسم المنافسة:</strong> {contract.competitionName || '-'}
                          </div>
                          <div>
                            <strong>تاريخ الطلب:</strong> {contract.orderDate || '-'}
                          </div>
                          <div>
                            <strong>رقم الصنف:</strong> {contract.itemNumber || '-'}
                          </div>
                          <div className="col-span-2">
                            <strong>اسم الصنف:</strong> {contract.itemName || '-'}
                          </div>
                          <div>
                            <strong>رقم المستخلص:</strong> {contract.extractNumber || '-'}
                          </div>
                          <div>
                            <strong>الكمية المطلوبة:</strong> {contract.quantityRequested || 0}
                          </div>
                          <div>
                            <strong>الكمية المستلمة:</strong> {contract.quantityReceived || 0}
                          </div>
                          <div>
                            <strong>الكمية المتبقية:</strong> {contract.quantityRemaining || 0}
                          </div>
                          <div>
                            <strong>القيمة الإجمالية:</strong> {parseFloat(contract.totalValue || 0).toLocaleString()} ريال
                          </div>
                          <div>
                            <strong>القيمة المستلمة:</strong> {parseFloat(contract.receivedValue || 0).toLocaleString()} ريال
                          </div>
                          <div className="col-span-2">
                            <strong>القيمة المتبقية:</strong> {parseFloat(contract.remainingValue || 0).toLocaleString()} ريال
                          </div>
                          {contract.notes && (
                            <div className="col-span-2">
                              <strong>الملاحظات:</strong> {contract.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
