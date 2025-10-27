import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, Save, Edit, Printer, Settings, Trash2, Upload, Calendar, AlertTriangle, Building, Phone } from 'lucide-react';
import { directPurchaseApi, reportsApi, facilitiesApi, itemsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mockFacilities } from '@/data/mockData';
import { getFileType } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TrackOrders() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFullUpdateDialogOpen, setIsFullUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    newStatus: '',
    statusNote: '',
    statusDate: '' // Added status date field
  });

  // Full update form data
  const [fullUpdateData, setFullUpdateData] = useState<{
    orderNumber: string;
    orderDate: string;
    itemNumber: string;
    itemName: string;
    quantity: string;
    beneficiaryFacility: string;
    financialApprovalNumber: string;
    financialApprovalDate: string;
    totalCost: string;
    supplierCompany: string;
    supplierContact: string;
    supplierPhone: string;
    supplierEmail: string;
    orderStatus: string;
    deliveryDate: string;
    handoverDate: string;
    notes: string;
    authorizationImage: File | string | null;
  }>({
    orderNumber: '',
    orderDate: '',
    itemNumber: '',
    itemName: '',
    quantity: '',
    beneficiaryFacility: '',
    financialApprovalNumber: '',
    financialApprovalDate: '',
    totalCost: '',
    supplierCompany: '',
    supplierContact: '',
    supplierPhone: '',
    supplierEmail: '',
    orderStatus: '',
    deliveryDate: '',
    handoverDate: '',
    notes: '',
    authorizationImage: null
  });

  // New states for Image Dialog
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageToShow, setImageToShow] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Available status options for approved orders
  const statusOptions = [
    { value: 'جديد', label: 'جديد' },
    { value: 'موافق عليه', label: 'موافق عليه' },
    { value: 'تم التعاقد', label: 'تم التعاقد' },
    { value: 'تم التسليم', label: 'تم التسليم' },
    { value: 'مرفوض', label: 'مرفوض' }
  ];

  useEffect(() => {
    loadOrders();
    loadFacilities();
    loadItems();
  }, []);

  // React-based filtering (fast, client-side as requested)
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (facilityFilter) {
      filtered = filtered.filter(order => order.beneficiary_facility === facilityFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, facilityFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await directPurchaseApi.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب طلبات الشراء",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

// Function to download PDF
const downloadPdf = (base64String: string, filename: string = 'authorization.pdf') => {
  const link = document.createElement('a');
  link.href = base64String;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  const loadFacilities = async () => {
    try {
      const response = await facilitiesApi.getFacilities();
      if (response.success) {
        setFacilities(response.data);
      }
    } catch (error) {
      setFacilities(mockFacilities);
    }
  };

  const loadItems = async () => {
    try {
      const response = await itemsApi.getItems();
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      // Fallback to mock data if API fails
      setItems([
        { id: 1, itemNumber: 'ITM-001', itemName: 'قفازات طبية', availableQty: 500 },
        { id: 2, itemNumber: 'ITM-002', itemName: 'كمامات جراحية', availableQty: 1000 },
        { id: 3, itemNumber: 'ITM-003', itemName: 'محاقن طبية', availableQty: 200 },
        { id: 4, itemNumber: 'ITM-004', itemName: 'شاش طبي', availableQty: 300 },
        { id: 5, itemNumber: 'ITM-005', itemName: 'مطهر طبي', availableQty: 150 }
      ]);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setStatusUpdateData({
      newStatus: order.status,
      statusNote: '',
      statusDate: '' // Reset date when opening dialog
    });
    setIsEditDialogOpen(true);
  };

  // New handler for full update
  const handleFullUpdateOrder = (order: any) => {
    setEditingOrder(order);
    setFullUpdateData({
      orderNumber: order.order_number || order.id,
      orderDate: order.order_date || '',
      itemNumber: order.item_number || '',
      itemName: order.item_name || '',
      quantity: order.quantity || '',
      beneficiaryFacility: order.beneficiary_facility || '',
      financialApprovalNumber: order.financialApprovalNumber || '',
      financialApprovalDate: order.financialApprovalDate || '',
      totalCost: order.total_cost || '',
      supplierCompany: order.supplier_name || '',
      supplierContact: order.supplier_contact || '',
      supplierPhone: order.supplier_phone || '',
      supplierEmail: order.supplier_email || '',
      orderStatus: order.status || 'جديد',
      deliveryDate: order.delivery_date || '',
      handoverDate: order.handover_date || '',
      notes: order.notes || '',
      authorizationImage: order.image_url || null
    });
    setImagePreview(order.image_url || null);
    setIsFullUpdateDialogOpen(true);
  };

  // New handler for delete confirmation
  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete function
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      const response = await directPurchaseApi.deleteOrder(orderToDelete.id);
      
      if (response.success) {
        toast({
          title: "تم الحذف",
          description: "تم حذف الطلب بنجاح",
        });
        loadOrders(); // Refresh the list
        setIsDeleteDialogOpen(false);
        setOrderToDelete(null);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف الطلب",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // New handler to show image dialog
  const handleShowImage = (imageBase64: string | undefined) => {
    if (!imageBase64) {
      toast({
        title: "لا توجد صورة",
        description: "لا توجد صورة متاحة لهذا الطلب.",
        variant: "destructive",
      });
      return;
    }
    setImageToShow(imageBase64);
    setIsImageDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار ملف أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    // Check file type - accept both images and PDFs
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يرجى اختيار ملف صورة (JPG, PNG, GIF) أو ملف PDF",
        variant: "destructive",
      });
      return;
    }

    setFullUpdateData(prev => ({ ...prev, authorizationImage: file }));
    
    // Set preview differently for PDF vs images
    if (file.type === 'application/pdf') {
      setImagePreview(file.name); // Store filename for PDF
    } else {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }
};

  const removeImage = () => {
    setFullUpdateData(prev => ({ ...prev, authorizationImage: null }));
    setImagePreview(null);
    // Clear the input
    const fileInput = document.getElementById('authorizationImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const isImageFile = (file: File | string | null): boolean => {
    if (!file) return false;
    if (typeof file === 'string') {
      return getFileType(file) === 'image';
    }
    return file.type.startsWith('image/');
  };

  const isPdfFile = (file: File | string | null): boolean => {
    if (!file) return false;
    if (typeof file === 'string') {
      return getFileType(file) === 'pdf';
    }
    return file.type === 'application/pdf';
  };

  // Handle full update form input changes
  const handleFullUpdateInputChange = (field: string, value: string) => {
    setFullUpdateData(prev => ({ ...prev, [field]: value }));
  };

  // Submit full update
  const handleFullUpdateSubmit = async () => {
    if (!editingOrder) return;

    try {
      setIsUpdatingStatus(true);
      const response = await directPurchaseApi.updateOrderFull(editingOrder.id, fullUpdateData);

      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث الطلب بنجاح",
        });
        loadOrders();
        setIsFullUpdateDialogOpen(false);
        setEditingOrder(null);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث الطلب",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePrintOrder = (order: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب الشراء المباشر - ${order.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            direction: rtl;
            text-align: right;
          }
          
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .header p {
            color: #64748b;
            font-size: 16px;
          }
          
          .section {
            margin-bottom: 25px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .section-header {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #d1d5db;
          }
          
          .section-header h2 {
            color: #374151;
            font-size: 18px;
            font-weight: bold;
            margin: 0;
          }
          
          .section-content {
            padding: 20px;
            background: white;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          
          .info-item {
            background: #f9fafb;
            padding: 12px 15px;
            border-radius: 6px;
            border-right: 4px solid #3b82f6;
          }
          
          .info-item label {
            display: block;
            font-weight: bold;
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .info-item span {
            color: #1f2937;
            font-size: 15px;
            font-weight: 500;
          }
          
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          
          .status-new { background: #dbeafe; color: #1e40af; }
          .status-approved { background: #dcfce7; color: #166534; }
          .status-contracted { background: #fef3c7; color: #92400e; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          
          .notes-section {
            background: #fffbeb;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
          }
          
          .notes-section h3 {
            color: #92400e;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .notes-section p {
            color: #451a03;
            line-height: 1.6;
          }
          
          .timeline-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            border-right: 4px solid #6366f1;
          }
          
          .timeline-item h4 {
            color: #4338ca;
            font-size: 16px;
            margin-bottom: 10px;
          }
          
          .timeline-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .timeline-field {
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          
          .timeline-field label {
            display: block;
            font-weight: bold;
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .timeline-field span {
            color: #111827;
            font-weight: 500;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .print-container { padding: 10mm; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>طلب الشراء المباشر</h1>
            <p>رقم الصنف: ${order.order_number || order.id}</p>
          </div>
          <div class="section">
            <div class="section-header">
              <h2>المعلومات الأساسية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم الصنف</label>
                  <span>${order.order_number || order.id}</span>
                </div>
                ${order.itemNumber ? `
                <div class="info-item">
                  <label>رقم الصنف بالنظام</label>
                  <span>${order.itemNumber}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <label>تاريخ الطلب</label>
                  <span>${order.order_date || '-'}</span>
                </div>
                <div class="info-item">
                  <label>اسم الصنف</label>
                  <span>${order.item_name || '-'}</span>
                </div>
                <div class="info-item">
                  <label>الكمية</label>
                  <span>${order.quantity || '-'}</span>
                </div>
                <div class="info-item">
                  <label>الجهة المستفيدة</label>
                  <span>${order.beneficiary_facility || '-'}</span>
                </div>
                <div class="info-item">
                  <label>التكلفة الإجمالية</label>
                  <span>${order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-header">
              <h2>المعلومات المالية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم التعميد المالي</label>
                  <span>${order.financialApprovalNumber || '-'}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ التعميد</label>
                  <span>${order.financialApprovalDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          ${order.supplier_name ? `
          <div class="section">
            <div class="section-header">
              <h2>معلومات المورد</h2>
            </div>
             <div class="section-content">
               <div class="info-grid">
                 <div class="info-item">
                   <label>اسم المورد</label>
                   <span>${order.supplier_name}</span>
                 </div>
                  ${order.supplier_contact ? `
                  <div class="info-item">
                    <label>اسم المسؤول</label>
                    <span>${order.supplier_contact}</span>
                  </div>
                  ` : ''}
                  ${order.supplier_phone ? `
                  <div class="info-item">
                    <label>رقم التواصل</label>
                    <span>${order.supplier_phone}</span>
                  </div>
                  ` : ''}
                  ${order.supplier_email ? `
                  <div class="info-item">
                    <label>البريد الإلكتروني</label>
                    <span>${order.supplier_email}</span>
                  </div>
                  ` : ''}
               </div>
             </div>
          </div>
          ` : ''}
          <div class="section">
            <div class="section-header">
              <h2>الحالة</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                  <label>حالة الطلب</label>
                  <span class="status-badge ${getStatusClass(order.status)}">${order.status || '-'}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-header">
              <h2>سجل حالات الطلب</h2>
            </div>
            <div class="section-content">
              ${order.creation_date ? `
              <div class="timeline-item">
                <h4>تاريخ الإنشاء</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.creation_date}</span>
                  </div>
                  ${order.creation_date_note ? `
                  <div class="timeline-field">
                    <label>ملاحظة الإنشاء</label>
                    <span>${order.creation_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_approval_date ? `
              <div class="timeline-item">
                <h4>تاريخ الموافقة</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_approval_date}</span>
                  </div>
                  ${order.contract_approval_date_note ? `
                  <div class="timeline-field">
                    <label>ملاحظة الموافقة</label>
                    <span>${order.contract_approval_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_date ? `
              <div class="timeline-item">
                <h4>تاريخ التعاقد</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_date}</span>
                  </div>
                  ${order.contract_date_note ? `
                  <div class="timeline-field">
                    <label>ملاحظة التعاقد</label>
                    <span>${order.contract_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.contract_delivery_date ? `
              <div class="timeline-item">
                <h4>تاريخ التسليم</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.contract_delivery_date}</span>
                  </div>
                  ${order.contract_delivery_date_note ? `
                  <div class="timeline-field">
                    <label>ملاحظة التسليم</label>
                    <span>${order.contract_delivery_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              ${order.rejection_date ? `
              <div class="timeline-item">
                <h4>تاريخ الرفض</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${order.rejection_date}</span>
                  </div>
                  ${order.rejection_date_note ? `
                  <div class="timeline-field">
                    <label>ملاحظة الرفض</label>
                    <span>${order.rejection_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          ${order.notes ? `
          <div class="section">
            <div class="section-header">
              <h2>الملاحظات</h2>
            </div>
            <div class="section-content">
              <div class="notes-section">
                <p>${order.notes}</p>
              </div>
            </div>
          </div>
          ` : ''}
          <div class="footer">
            <p>تم طباعة هذا الطلب في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'جديد':
        return 'status-new';
      case 'موافق عليه':
        return 'status-approved';
      case 'تم التعاقد':
        return 'status-contracted';
      case 'تم التسليم':
        return 'status-delivered';
      case 'مرفوض':
        return 'status-rejected';
      default:
        return 'status-new';
    }
  };

  const handleStatusUpdate = async () => {
    if (!editingOrder || !statusUpdateData.newStatus || !statusUpdateData.statusDate) return;

    try {
      setIsUpdatingStatus(true);

      // Use the existing updateOrder API but with status update data including the date
      const updatedOrderData = {
        ...editingOrder,
        status: statusUpdateData.newStatus,
        statusNote: statusUpdateData.statusNote,
        statusDate: statusUpdateData.statusDate // This will be sent to your Laravel backend
      };

      const response = await directPurchaseApi.updateOrder(editingOrder.id, updatedOrderData);

      if (response.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث حالة الطلب بنجاح",
        });

        // Refresh orders list
        loadOrders();
        setIsEditDialogOpen(false);
        setEditingOrder(null);
        setStatusUpdateData({ newStatus: '', statusNote: '', statusDate: '' });
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const statusFlow = ['جديد', 'موافق عليه', 'تم التعاقد', 'تم التسليم'];
    const currentIndex = statusFlow.indexOf(currentStatus);

    // Can move forward in the flow or go to 'مرفوض' from any status
    const availableOptions = [
      ...statusFlow.slice(currentIndex),
      'مرفوض'
    ];

    return [...new Set(availableOptions)]; // Remove duplicates
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800';
      case 'موافق عليه': return 'bg-green-100 text-green-800';
      case 'تم التعاقد': return 'bg-purple-100 text-purple-800';
      case 'تم التسليم': return 'bg-emerald-100 text-emerald-800';
      case 'مرفوض': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status styling for detailed view
  function getStatusStyle(status: string) {
    switch (status) {
      case 'جديد':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'موافق عليه':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'تم التعاقد':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'تم التسليم':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'مرفوض':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">متابعة طلبات الشراء المباشر</h1>
        <p className="text-muted-foreground mt-2">تتبع ومراقبة حالة جميع طلبات الشراء المباشر</p>
      </div>
      <div className="admin-card">
        <div className="admin-header">
          <h2>متابعة مسار الطلبات</h2>
        </div>
        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-right"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              <option value="جديد">جديد</option>
              <option value="موافق عليه">موافق عليه</option>
              <option value="تم التعاقد">تم التعاقد</option>
              <option value="تم التسليم">تم التسليم</option>
              <option value="مرفوض">مرفوض</option>
            </select>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الجهات</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.name}>{facility.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setFacilityFilter('');
              }}
              className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
            >
              <Filter size={16} />
              مسح الفلاتر
            </button>
          </div>

          {/* Responsive Orders Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد طلبات شراء</p>
            </div>
          ) : (
            <div>
              {/* Desktop / Tablet Table - Improved styling */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">رقم الصنف</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">تاريخ الطلب</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[200px]">اسم الصنف</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[180px]">الجهة المستفيدة</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[80px]">الكمية</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[140px]">رقم التعميد</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">تاريخ التعميد</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">الحالة</th>
                      <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">التكلفة</th>
                      <th className="p-4 text-center font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">صورة التعميد</th>
                      <th className="p-4 text-center font-semibold text-gray-700 dark:text-gray-200 min-w-[280px]">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr key={order.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{order.order_number || order.id}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{order.order_date}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={order.item_name}>{order.item_name}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 max-w-[180px] truncate" title={order.beneficiary_facility}>{order.beneficiary_facility}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{order.quantity}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{order.financialApprovalNumber || '-'}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{order.financialApprovalDate || '-'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                          {order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}
                        </td>
                <td className="p-4 text-center">
  <button
    onClick={() => {
      if (isPdfFile(order.image_url)) {
        downloadPdf(order.image_url, `تعميد-${order.order_number || order.id}.pdf`);
      } else {
        handleShowImage(order.image_url);
      }
    }}
    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors mx-auto"
    title={isPdfFile(order.image_url) ? "تحميل ملف PDF" : "عرض صورة التعميد"}
  >
    <Eye size={14} />
    {isPdfFile(order.image_url) ? 'تحميل PDF' : 'عرض الصورة'}
  </button>
</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye size={14} />
                              عرض
                            </button>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                              title="تعديل الحالة"
                            >
                              <Edit size={14} />
                              تعديل
                            </button>
                            <button
                              onClick={() => handleFullUpdateOrder(order)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                              title="التعديل الكامل"
                            >
                              <Settings size={14} />
                              تعديل كامل
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                              title="حذف الطلب"
                            >
                              <Trash2 size={14} />
                              حذف
                            </button>
                            <button
                              onClick={() => handlePrintOrder(order)}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                              title="طباعة الطلب"
                            >
                              <Printer size={14} />
                              طباعة
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table - Card style */}
              <div className="space-y-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                    dir="rtl"
                  >
                    <div className="flex justify-between mb-2 items-center">
                      <div className="font-semibold text-lg">{order.item_name || '-'}</div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {order.status || '-'}
                      </span>
                    </div>

                    <div className="space-y-2 text-right text-sm">
                      <div>
                        <strong>رقم الصنف: </strong>
                        <span>{order.order_number || order.id}</span>
                      </div>
                      <div>
                        <strong>تاريخ الطلب: </strong>
                        <span>{order.order_date || '-'}</span>
                      </div>
                      <div>
                        <strong>الجهة المستفيدة: </strong>
                        <span>{order.beneficiary_facility || '-'}</span>
                      </div>
                      <div>
                        <strong>الكمية: </strong>
                        <span>{order.quantity || '-'}</span>
                      </div>
                      <div>
                        <strong>رقم التعميد المالي: </strong>
                        <span>{order.financialApprovalNumber || '-'}</span>
                      </div>
                      <div>
                        <strong>تاريخ التعميد: </strong>
                        <span>{order.financialApprovalDate || '-'}</span>
                      </div>
                      <div>
                        <strong>التكلفة: </strong>
                        <span>{order.total_cost ? `${Number(order.total_cost).toLocaleString()} ريال` : '-'}</span>
                      </div>
                      {order.supplier_name && (
                        <div>
                          <strong>اسم المورد: </strong>
                          <span>{order.supplier_name}</span>
                        </div>
                      )}
                      {order.supplier_contact && (
                        <div>
                          <strong>بيانات التواصل: </strong>
                          <span>{order.supplier_contact}</span>
                        </div>
                      )}
                      <div className="flex justify-start gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye size={14} />
                          عرض
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Edit size={14} />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleFullUpdateOrder(order)}
                          className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Settings size={14} />
                          تعديل كامل
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Printer size={14} />
                          طباعة
                        </button>
                      <button
  onClick={() => {
    console.log('Debug - isPdfFile result:', isPdfFile(order.image_url));
  console.log('Debug - image_url start:', order.image_url?.substring(0, 30));
    if (isPdfFile(order.image_url)) {
      downloadPdf(order.image_url, `تعميد-${order.order_number || order.id}.pdf`);
    } else {
      handleShowImage(order.image_url);
    }
  }}
  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
>
  <Eye size={14} />
  {isPdfFile(order.image_url) ? 'تحميل PDF' : 'صورة التعميد'}
</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold">تفاصيل طلب الشراء المباشر</DialogTitle>
            <DialogDescription className="text-right">
              عرض تفاصيل الطلب رقم: {selectedOrder?.order_number || selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 p-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400">
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">رقم الصنف</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                {selectedOrder.itemNumber && (
                  <div className="text-right">
                    <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">رقم الصنف بالنظام</label>
                    <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.itemNumber}</p>
                  </div>
                )}
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">تاريخ الطلب</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.order_date}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">اسم الصنف</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.item_name}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">الكمية</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.quantity}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">الجهة المستفيدة</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.beneficiary_facility}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">الحالة</label>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border-l-4 border-green-400">
                <div className="text-right">
                  <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">رقم التعميد المالي</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.financialApprovalNumber || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">تاريخ التعميد</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.financialApprovalDate || '-'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-2">التكلفة الإجمالية</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">
                    {selectedOrder.total_cost ? `${Number(selectedOrder.total_cost).toLocaleString()} ريال` : '-'}
                  </p>
                </div>
              </div>

              {/* Supplier Information */}
              {(selectedOrder.supplier_name || selectedOrder.supplier_contact || selectedOrder.supplier_phone || selectedOrder.supplier_email) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-400">
                  {selectedOrder.supplier_name && (
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">اسم المورد</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_name}</p>
                    </div>
                  )}
                  {selectedOrder.supplier_contact && (
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">اسم المسؤول</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_contact}</p>
                    </div>
                  )}
                  {selectedOrder.supplier_phone && (
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">رقم التواصل</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_phone}</p>
                    </div>
                  )}
                  {selectedOrder.supplier_email && (
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">البريد الإلكتروني</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.supplier_email}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-l-4 border-yellow-400">
                  <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">الملاحظات</label>
                  <p className="font-medium bg-white dark:bg-gray-800 p-3 rounded leading-relaxed">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Timeline Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-right">سجل حالات الطلب</h3>
                
                {/* Creation Date */}
                {selectedOrder.creation_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400">
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">تاريخ الإنشاء</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.creation_date}</p>
                    </div>
                    {selectedOrder.creation_date_note && (
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">ملاحظة الإنشاء</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.creation_date_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Contract Approval Date */}
                {selectedOrder.contract_approval_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-400">
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">تاريخ الموافقة</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_approval_date}</p>
                    </div>
                    {selectedOrder.contract_approval_date_note && (
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-teal-700 dark:text-teal-300 mb-2">ملاحظة الموافقة</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_approval_date_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Contract Date */}
                {selectedOrder.contract_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-l-4 border-yellow-400">
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">تاريخ التعاقد</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_date}</p>
                    </div>
                    {selectedOrder.contract_date_note && (
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">ملاحظة التعاقد</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_date_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Delivery Date */}
                {selectedOrder.contract_delivery_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border-l-4 border-emerald-400">
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">تاريخ التسليم</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_delivery_date}</p>
                    </div>
                    {selectedOrder.contract_delivery_date_note && (
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">ملاحظة التسليم</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.contract_delivery_date_note}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Rejection Date */}
                {selectedOrder.rejection_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border-l-4 border-red-400">
                    <div className="text-right">
                      <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">تاريخ الرفض</label>
                      <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.rejection_date}</p>
                    </div>
                    {selectedOrder.rejection_date_note && (
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">ملاحظة الرفض</label>
                        <p className="font-medium bg-white dark:bg-gray-800 p-2 rounded">{selectedOrder.rejection_date_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">تعديل حالة الطلب</DialogTitle>
            <DialogDescription className="text-right">
              تعديل حالة الطلب رقم: {editingOrder?.order_number || editingOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-6 p-4">
              <div className="text-right bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <label className="block text-sm font-medium text-muted-foreground mb-2">الحالة الحالية</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(editingOrder.status)}`}>
                  {editingOrder.status}
                </span>
              </div>
              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">الحالة الجديدة *</label>
                <select
                  value={statusUpdateData.newStatus}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                >
                  <option value="">اختر الحالة الجديدة</option>
                  {getStatusOptions(editingOrder.status).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">تاريخ التحديث *</label>
                <input
                  type="date"
                  value={statusUpdateData.statusDate}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusDate: e.target.value }))}
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">ملاحظة التحديث</label>
                <textarea
                  value={statusUpdateData.statusNote}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusNote: e.target.value }))}
                  className="w-full p-3 border-2 border-input rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows={4}
                  placeholder="ملاحظة حول تغيير الحالة..."
                />
              </div>

              <div className="flex justify-start gap-3 pt-4">
                <button 
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || !statusUpdateData.newStatus || !statusUpdateData.statusDate}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {isUpdatingStatus ? 'جاري الحفظ...' : 'حفظ التحديث'}
                </button>
                <button 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Update Dialog */}
      <Dialog open={isFullUpdateDialogOpen} onOpenChange={setIsFullUpdateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold">التعديل الكامل للطلب</DialogTitle>
            <DialogDescription className="text-right">
              تعديل جميع بيانات الطلب رقم: {editingOrder?.order_number || editingOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-6 p-4" dir="rtl">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="orderNumber">رقم الصنف بالنظام</Label>
                    <Input
                      id="orderNumber"
                      value={fullUpdateData.orderNumber}
                      onChange={(e) => handleFullUpdateInputChange('orderNumber', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orderDate">تاريخ الطلب</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={fullUpdateData.orderDate}
                      onChange={(e) => handleFullUpdateInputChange('orderDate', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemNumber">رقم الصنف</Label>
                    <Input
                      id="itemNumber"
                      value={fullUpdateData.itemNumber}
                      onChange={(e) => handleFullUpdateInputChange('itemNumber', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="itemName">اسم الصنف</Label>
                    <Input
                      id="itemName"
                      value={fullUpdateData.itemName}
                      onChange={(e) => handleFullUpdateInputChange('itemName', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={fullUpdateData.quantity}
                      onChange={(e) => handleFullUpdateInputChange('quantity', e.target.value)}
                      className="text-right"
                      placeholder="أدخل الكمية"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Beneficiary and Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات الجهة المستفيدة والتعميد المالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="beneficiaryFacility">الجهة المستفيدة أو المنشأة</Label>
                    <Select value={fullUpdateData.beneficiaryFacility} onValueChange={(value) => handleFullUpdateInputChange('beneficiaryFacility', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجهة المستفيدة" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.name}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="financialApprovalNumber">رقم التعميد المالي</Label>
                    <Input
                      id="financialApprovalNumber"
                      value={fullUpdateData.financialApprovalNumber}
                      onChange={(e) => handleFullUpdateInputChange('financialApprovalNumber', e.target.value)}
                      className="text-right"
                      placeholder="أدخل رقم التعميد المالي"
                    />
                  </div>
                  <div>
                    <Label htmlFor="financialApprovalDate">تاريخ التعميد</Label>
                    <Input
                      id="financialApprovalDate"
                      type="date"
                      value={fullUpdateData.financialApprovalDate}
                      onChange={(e) => handleFullUpdateInputChange('financialApprovalDate', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalCost">التكلفة الإجمالية</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      value={fullUpdateData.totalCost}
                      onChange={(e) => handleFullUpdateInputChange('totalCost', e.target.value)}
                      className="text-right"
                      placeholder="أدخل التكلفة بالريال"
                    />
                  </div>
                  
                  {/* Authorization Image Upload */}
                  <div className="md:col-span-2">
                    <Label htmlFor="authorizationImage">إضافة التعميد</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          id="authorizationImage"
                          type="file"
accept="image/*,.pdf"
                          onChange={handleImageUpload}
                          className="text-right"
                        />
                        <Upload className="h-5 w-5 text-gray-500" />
                      </div>
                      
                      {imagePreview && (
  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">معاينة التعميد المرفوع</span>
      <div className="flex gap-2">
        {fullUpdateData.authorizationImage && isImageFile(fullUpdateData.authorizationImage) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            عرض
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={removeImage}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          حذف
        </Button>
      </div>
    </div>
    {fullUpdateData.authorizationImage && isImageFile(fullUpdateData.authorizationImage) ? (
      <img
        src={fullUpdateData.authorizationImage instanceof File ? URL.createObjectURL(fullUpdateData.authorizationImage) : fullUpdateData.authorizationImage}
        alt="Authorization Preview"
        className="max-w-full h-32 object-contain rounded border"
      />
    ) : (
      <div className="flex items-center gap-2 text-blue-600">
        <span>📄 {typeof imagePreview === 'string' && !imagePreview.startsWith('data:') ? imagePreview : 'ملف PDF'}</span>
      </div>
    )}
  </div>
)}
                      
                      <p className="text-xs text-gray-500 text-right">
                        حجم الملف الأقصى: 5 ميجابايت - الصيغ المدعومة: JPG, PNG, GIF, Pdf
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    معلومات الشركة الموردة
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplierCompany">الشركة الموردة</Label>
                    <Input
                      id="supplierCompany"
                      value={fullUpdateData.supplierCompany}
                      onChange={(e) => handleFullUpdateInputChange('supplierCompany', e.target.value)}
                      className="text-right"
                      placeholder="أدخل اسم الشركة الموردة"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierContact">اسم المسؤول</Label>
                    <Input
                      id="supplierContact"
                      value={fullUpdateData.supplierContact}
                      onChange={(e) => handleFullUpdateInputChange('supplierContact', e.target.value)}
                      className="text-right"
                      placeholder="أدخل اسم المسؤول بالشركة"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierPhone">رقم التواصل</Label>
                    <Input
                      id="supplierPhone"
                      value={fullUpdateData.supplierPhone}
                      onChange={(e) => handleFullUpdateInputChange('supplierPhone', e.target.value)}
                      className="text-right"
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierEmail">البريد الإلكتروني</Label>
                    <Input
                      id="supplierEmail"
                      type="email"
                      value={fullUpdateData.supplierEmail}
                      onChange={(e) => handleFullUpdateInputChange('supplierEmail', e.target.value)}
                      className="text-right"
                      placeholder="supplier@company.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status and Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    الحالة والتواريخ
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="orderStatus">حالة الطلب</Label>
                    <Select value={fullUpdateData.orderStatus} onValueChange={(value) => handleFullUpdateInputChange('orderStatus', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الطلب" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate">تاريخ التسليم المتوقع</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={fullUpdateData.deliveryDate}
                      onChange={(e) => handleFullUpdateInputChange('deliveryDate', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="handoverDate">تاريخ التسليم الفعلي</Label>
                    <Input
                      id="handoverDate"
                      type="date"
                      value={fullUpdateData.handoverDate}
                      onChange={(e) => handleFullUpdateInputChange('handoverDate', e.target.value)}
                      className="text-right"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">الملاحظات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={fullUpdateData.notes}
                    onChange={(e) => handleFullUpdateInputChange('notes', e.target.value)}
                    className="text-right"
                    rows={4}
                    placeholder="أدخل أي ملاحظات إضافية..."
                  />
                </CardContent>
              </Card>

              <div className="flex justify-start gap-3 pt-4">
                <Button 
                  onClick={handleFullUpdateSubmit}
                  disabled={isUpdatingStatus}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center gap-2 px-6 py-3"
                >
                  <Save size={18} />
                  {isUpdatingStatus ? 'جاري الحفظ...' : 'حفظ التحديث الكامل'}
                </Button>
                <Button 
                  onClick={() => setIsFullUpdateDialogOpen(false)}
                  variant="outline"
                  className="px-6 py-3"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold text-red-600">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-right">
              هل أنت متأكد من حذف هذا الطلب؟
            </DialogDescription>
          </DialogHeader>

          {orderToDelete && (
            <div className="space-y-4 p-4">
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-right space-y-2">
                  <p><strong>رقم الطلب:</strong> {orderToDelete.order_number || orderToDelete.id}</p>
                  <p><strong>اسم الصنف:</strong> {orderToDelete.item_name}</p>
                  <p><strong>الجهة المستفيدة:</strong> {orderToDelete.beneficiary_facility}</p>
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-right">
                  تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات المرتبطة بهذا الطلب نهائياً.
                </AlertDescription>
              </Alert>

              <div className="flex justify-start gap-3 pt-4">
                <Button 
                  onClick={confirmDeleteOrder}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Trash2 size={18} />
                  {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </Button>
                <Button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  variant="outline"
                  className="px-6 py-3"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Display Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-4 flex flex-col items-center justify-center">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">صورة التعميد</DialogTitle>
            <DialogDescription className="text-right">عرض صورة التعميد الخاصة بالطلب</DialogDescription>
          </DialogHeader>
          {imageToShow ? (
            <img
              src={imageToShow}
              alt="صورة التعميد"
              className="max-w-full max-h-[70vh] rounded-md shadow-md"
            />
          ) : (
            <p className="text-center text-muted-foreground">لا توجد صورة للعرض.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal for Full Update */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-4 flex flex-col items-center justify-center">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">معاينة صورة التعميد</DialogTitle>
          </DialogHeader>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="معاينة التعميد"
              className="max-w-full max-h-[70vh] rounded-md shadow-md"
            />
          ) : (
            <p className="text-center text-muted-foreground">لا توجد صورة للعرض.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
