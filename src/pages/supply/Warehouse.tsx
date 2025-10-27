import { useState, useEffect } from 'react';
import { Package, Search, Plus, Eye, Edit, Trash2, X, Save, ShoppingCart, FileText, Download, Loader2, Printer, Image as ImageIcon } from 'lucide-react';
import { warehouseApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/utils/exportUtils';
import { getFileType } from '@/lib/api';

export default function Warehouse() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [showDispenseDetailsModal, setShowDispenseDetailsModal] = useState(false);
  const [selectedDispenseOrder, setSelectedDispenseOrder] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [showEditDispenseModal, setShowEditDispenseModal] = useState(false);
  const [showDeleteDispenseModal, setShowDeleteDispenseModal] = useState(false);
  const [dispenseToDelete, setDispenseToDelete] = useState<any>(null);
  
  // Add Item Form State - Modified with new fields
  const [addFormData, setAddFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: '',
    image: null as string | null,
    pdfbase64: null as string | null, // PDF attachment
    // New fields
    invoiceNumber: '', // رقم فاتورة الشراء
    invoiceDate: '', // تاريخ الفاتورة
    supplierContact: '' // بيانات التواصل للشركة الموردة
  });

  // Edit Item Form State - Modified with new fields
  const [editFormData, setEditFormData] = useState({
    itemNumber: '',
    itemName: '',
    receivedQty: '',
    issuedQty: '',
    availableQty: '',
    minQuantity: '',
    purchaseValue: '',
    deliveryDate: '',
    supplierName: '',
    beneficiaryFacility: '',
    notes: '',
    image: null as string | null,
    pdfbase64: null as string | null, // PDF attachment
    // New fields
    invoiceNumber: '', // رقم فاتورة الشراء
    invoiceDate: '', // تاريخ الفاتورة
    supplierContact: '' // بيانات التواصل للشركة الموردة
  });

  // Image preview states
  const [addImagePreview, setAddImagePreview] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  // Withdraw Order Form State
  const [withdrawFormData, setWithdrawFormData] = useState({
    itemNumber: '',
    itemName: '',
    beneficiaryFacility: '',
    requestStatus: 'مفتوح تحت الاجراء',
    withdrawQty: '',
    withdrawDate: '',
    recipientName: '',
    recipientContact: '',
    notes: '',
    pdfbase64: null as string | null
  });

  // Edit Dispense Order Form State
  const [editDispenseFormData, setEditDispenseFormData] = useState({
    id: '',
    orderNumber: '',
    beneficiaryFacility: '',
    requestStatus: 'مفتوح تحت الاجراء',
    withdrawQty: '',
    withdrawDate: '',
    recipientName: '',
    recipientContact: '',
    notes: '',
    pdfbase64: null as string | null
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [inventoryResponse, facilitiesResponse] = await Promise.all([
          warehouseApi.getInventory(),
          reportsApi.getFacilities()
        ]);

        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }

        if (facilitiesResponse.success) {
          setFacilities(facilitiesResponse.data || []);
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل بيانات المستودع",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredItems = inventoryItems.filter(item =>
    item.itemName?.includes(searchTerm) || item.itemNumber?.includes(searchTerm)
  );

  // Calculate total inventory value using corrected formula
  const calculateTotalInventoryValue = () => {
    return inventoryItems.reduce((sum, item) => {
      const purchaseValue = parseFloat(item.purchaseValue) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 1; // Avoid division by zero
      const availableQty = parseFloat(item.availableQty) || 0;
      
      // Calculate unit price and multiply by available quantity
      const unitPrice = purchaseValue / receivedQty;
      const itemValue = unitPrice * availableQty;
      
      return sum + itemValue;
    }, 0);
  };

  // NEW: Calculate total purchase value (sum of all purchaseValue)
  const calculateTotalPurchaseValue = () => {
    return inventoryItems.reduce((sum, item) => {
      const purchaseValue = parseFloat(item.purchaseValue) || 0;
      return sum + purchaseValue;
    }, 0);
  };

  // Calculate available quantity automatically
  const calculateAvailableQty = (received: string, issued: string) => {
    const receivedNum = parseFloat(received) || 0;
    const issuedNum = parseFloat(issued) || 0;
    return Math.max(0, receivedNum - issuedNum);
  };

  // Handle image file selection and preview (modified for Base64)
  const handleImageChange = (file: File | null, isEdit: boolean = false) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      if (isEdit) {
        setEditImagePreview(preview);
        setEditFormData(prev => ({ ...prev, image: file as any }));
      } else {
        setAddImagePreview(preview);
        setAddFormData(prev => ({ ...prev, image: file as any }));
      }
    } else {
      if (isEdit) {
        setEditImagePreview('');
        setEditFormData(prev => ({ ...prev, image: null }));
      } else {
        setAddImagePreview('');
        setAddFormData(prev => ({ ...prev, image: null }));
      }
    }
  };

  // Handle PDF file selection
  const handlePdfChange = (file: File | null, isEdit: boolean = false) => {
    if (file) {
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, pdfbase64: file as any }));
      } else {
        setAddFormData(prev => ({ ...prev, pdfbase64: file as any }));
      }
    } else {
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, pdfbase64: null }));
      } else {
        setAddFormData(prev => ({ ...prev, pdfbase64: null }));
      }
    }
  };

  // Print withdrawal order function
  const handlePrintWithdrawalOrder = (order: any) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>أمر صرف رقم ${order.orderNumber}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              direction: rtl; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #333; 
              margin-bottom: 10px; 
              font-size: 28px;
              font-weight: bold;
            }
            .header p { 
              color: #666; 
              font-size: 14px;
            }
            .order-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              background: white;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #ddd;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .info-value {
              font-size: 16px;
              color: #333;
            }
            .status {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
            }
            .status-completed {
              background-color: #d4edda;
              color: #155724;
            }
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-rejected {
              background-color: #f8d7da;
              color: #721c24;
            }
            .notes-section {
              margin-top: 30px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>أمر صرف من المستودع</h1>
            <p>رقم الأمر: <strong>${order.orderNumber || 'غير محدد'}</strong></p>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
          
          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">معلومات الصنف</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">رقم الصنف:</div>
                <div class="info-value">${selectedItem?.itemNumber || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">اسم الصنف:</div>
                <div class="info-value">${selectedItem?.itemName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الشركة الموردة:</div>
                <div class="info-value">${selectedItem?.supplierName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الكمية المتاحة قبل الصرف:</div>
                <div class="info-value">${selectedItem?.availableQty || 0}</div>
              </div>
            </div>
          </div>

          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">تفاصيل الصرف</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">الجهة المستفيدة:</div>
                <div class="info-value">${order.beneficiaryFacility || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الكمية المصروفة:</div>
                <div class="info-value">${order.withdrawQty || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاريخ الصرف:</div>
                <div class="info-value">${order.withdrawDate || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">حالة الطلب:</div>
                <div class="info-value">
                  <span class="status ${
                    order.requestStatus === 'تم الصرف' ? 'status-completed' :
                    order.requestStatus === 'مرفوض' ? 'status-rejected' : 'status-pending'
                  }">
                    ${order.requestStatus || 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-info">
            <h2 style="margin-top: 0; color: #333;">معلومات المستلم</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">اسم المستلم:</div>
                <div class="info-value">${order.recipientName || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">رقم التواصل:</div>
                <div class="info-value">${order.recipientContact || 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاريخ الإنشاء:</div>
                <div class="info-value">${order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">آخر تحديث:</div>
                <div class="info-value">${order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
              </div>
            </div>
          </div>

          ${order.notes ? `
            <div class="notes-section">
              <h3 style="margin-top: 0; color: #333;">ملاحظات:</h3>
              <p style="margin: 0; background: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd;">
                ${order.notes}
              </p>
            </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المستودع</p>
            <p>هذا المستند صالح للطباعة والأرشفة</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

      toast({
        title: "تم التحضير للطباعة",
        description: "تم تحضير أمر الصرف للطباعة بنجاح",
      });
    } catch (error) {
      console.error('Print failed:', error);
      toast({
        title: "خطأ في الطباعة",
        description: "فشل في تحضير أمر الصرف للطباعة",
        variant: "destructive",
      });
    }
  };

  // Form validation
  const validateAddForm = () => {
    const errors: any = {};
    
    if (!addFormData.itemNumber.trim()) errors.itemNumber = 'رقم الصنف مطلوب';
    if (!addFormData.itemName.trim()) errors.itemName = 'اسم الصنف مطلوب';
    if (!addFormData.receivedQty || parseFloat(addFormData.receivedQty) < 0) errors.receivedQty = 'الكمية المستلمة مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.minQuantity || parseFloat(addFormData.minQuantity) < 0) errors.minQuantity = 'كمية الحد الأدنى مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.purchaseValue || parseFloat(addFormData.purchaseValue) < 0) errors.purchaseValue = 'قيمة الشراء مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!addFormData.deliveryDate) errors.deliveryDate = 'تاريخ التوريد مطلوب';
    if (!addFormData.supplierName.trim()) errors.supplierName = 'اسم الشركة الموردة مطلوب';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: any = {};
    
    if (!editFormData.itemNumber.trim()) errors.itemNumber = 'رقم الصنف مطلوب';
    if (!editFormData.itemName.trim()) errors.itemName = 'اسم الصنف مطلوب';
    if (!editFormData.receivedQty || parseFloat(editFormData.receivedQty) < 0) errors.receivedQty = 'الكمية المستلمة مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.minQuantity || parseFloat(editFormData.minQuantity) < 0) errors.minQuantity = 'كمية الحد الأدنى مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.purchaseValue || parseFloat(editFormData.purchaseValue) < 0) errors.purchaseValue = 'قيمة الشراء مطلوبة ويجب أن تكون أكبر من أو تساوي صفر';
    if (!editFormData.deliveryDate) errors.deliveryDate = 'تاريخ التوريد مطلوب';
    if (!editFormData.supplierName.trim()) errors.supplierName = 'اسم الشركة الموردة مطلوب';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateWithdrawForm = () => {
    const errors: any = {};
    
    if (!withdrawFormData.beneficiaryFacility) errors.beneficiaryFacility = 'الجهة المستفيدة مطلوبة';
    if (!withdrawFormData.withdrawQty || parseFloat(withdrawFormData.withdrawQty) <= 0) errors.withdrawQty = 'الكمية المصروفة مطلوبة ويجب أن تكون أكبر من صفر';
    if (!withdrawFormData.withdrawDate) errors.withdrawDate = 'تاريخ الصرف مطلوب';
    if (!withdrawFormData.recipientName.trim()) errors.recipientName = 'اسم المستلم مطلوب';
    if (!withdrawFormData.recipientContact.trim()) errors.recipientContact = 'رقم التواصل مطلوب';
    
    // Validate quantity doesn't exceed available
    const maxQty = selectedItem?.availableQty || 0;
    if (parseFloat(withdrawFormData.withdrawQty) > maxQty) {
      errors.withdrawQty = `الكمية المصروفة لا يمكن أن تتجاوز الكمية المتاحة (${maxQty})`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddInputChange = (field: string, value: string) => {
    setAddFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : updated.receivedQty,
          field === 'issuedQty' ? value : updated.issuedQty
        ).toString();
      }
      
      return updated;
    });
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate available quantity
      if (field === 'receivedQty' || field === 'issuedQty') {
        updated.availableQty = calculateAvailableQty(
          field === 'receivedQty' ? value : updated.receivedQty,
          field === 'issuedQty' ? value : updated.issuedQty
        ).toString();
      }
      
      return updated;
    });
  };

  const handleWithdrawInputChange = (field: string, value: string) => {
    setWithdrawFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddForm()) {
      return;
    }

    try {
      setLoadingAction(true);
      
      // Pass File objects directly to API
      const dataToSubmit = {
        ...addFormData,
        image: addFormData.image, // Send File or null
        pdfbase64: addFormData.pdfbase64 // Send File or null
      };
      
      // Send data with files
      const response = await warehouseApi.addInventoryItem(dataToSubmit);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة الصنف بنجاح",
        });
        
        // Reload inventory data
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowAddForm(false);
        setSearchTerm(''); // Clear search after adding new item
        setFormErrors({});
        setAddImagePreview('');
        setAddFormData({
          itemNumber: '',
          itemName: '',
          receivedQty: '',
          issuedQty: '',
          availableQty: '',
          minQuantity: '',
          purchaseValue: '',
          deliveryDate: '',
          supplierName: '',
          beneficiaryFacility: '',
          notes: '',
          image: null,
          pdfbase64: null,
          // Reset new fields
          invoiceNumber: '',
          invoiceDate: '',
          supplierContact: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.id) return;

    if (!validateEditForm()) {
      return;
    }

    try {
      setLoadingAction(true);
      
      // Pass File objects directly to API
      const dataToSubmit = {
        ...editFormData,
        image: editFormData.image, // Send File or existing URL
        pdfbase64: editFormData.pdfbase64 // Send File or existing URL
      };
      
      // Send editFormData with files
      const response = await warehouseApi.updateInventoryItem(selectedItem.id, dataToSubmit);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث الصنف بنجاح",
        });
        
        // Reload inventory data
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowEditModal(false);
        setSelectedItem(null);
        setFormErrors({});
        setEditImagePreview('');
        setEditFormData({
          itemNumber: '',
          itemName: '',
          receivedQty: '',
          issuedQty: '',
          availableQty: '',
          minQuantity: '',
          purchaseValue: '',
          deliveryDate: '',
          supplierName: '',
          beneficiaryFacility: '',
          notes: '',
          image: null,
          pdfbase64: null,
          // Reset new fields
          invoiceNumber: '',
          invoiceDate: '',
          supplierContact: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateWithdrawForm()) {
      return;
    }
    
    try {
      setLoadingAction(true);
      
      // Pass File object directly to API
      const dataToSubmit = {
        ...withdrawFormData,
        pdfbase64: withdrawFormData.pdfbase64 // Send File or null
      };
      
      const response = await warehouseApi.createWithdrawalOrder(dataToSubmit);
      
      if (response.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء أمر الصرف بنجاح",
        });
        
        // Reload inventory data after successful withdrawal
        const inventoryResponse = await warehouseApi.getInventory();
        if (inventoryResponse.success) {
          setInventoryItems(inventoryResponse.data || []);
        }
        
        setShowWithdrawForm(false);
        setSelectedItem(null);
        setFormErrors({});
        setWithdrawFormData({
          itemNumber: '',
          itemName: '',
          beneficiaryFacility: '',
          requestStatus: 'مفتوح تحت الاجراء',
          withdrawQty: '',
          withdrawDate: '',
          recipientName: '',
          recipientContact: '',
          notes: '',
          pdfbase64: null
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في إنشاء أمر الصرف",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWithdrawClick = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setWithdrawFormData(prev => ({
        ...prev,
        itemNumber: item.itemNumber,
        itemName: item.itemName
      }));
    }
    setFormErrors({});
    setShowWithdrawForm(true);
  };

  const handleViewClick = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setEditFormData({
      itemNumber: item.itemNumber || '',
      itemName: item.itemName || '',
      receivedQty: item.receivedQty?.toString() || '0',
      issuedQty: item.issuedQty?.toString() || '0',
      availableQty: item.availableQty?.toString() || '0',
      minQuantity: item.minQuantity?.toString() || '0',
      purchaseValue: item.purchaseValue?.toString() || '0',
      deliveryDate: item.deliveryDate || '',
      supplierName: item.supplierName || '',
      beneficiaryFacility: item.beneficiaryFacility || '',
      notes: item.notes || '',
      image: null, // Reset image when opening edit form
      pdfbase64: null, // Reset PDF when opening edit form
      // Set new fields with null handling
      invoiceNumber: item.invoiceNumber || '',
      invoiceDate: item.invoiceDate || '',
      supplierContact: item.supplierContact || ''
    });
    
    // Set existing image preview if available
    if (item.imageUrl || item.image) {
      setEditImagePreview(item.imageUrl || item.image);
    } else {
      setEditImagePreview('');
    }
    
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredItems, 'قائمة_المستودع');
    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات إلى ملف Excel بنجاح",
    });
  };

  const handleExportToPDF = () => {
    try {
      // Create a new window with printable content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>قائمة المستودع</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .header p { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-available { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
            .status-low { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>قائمة المستودع</h1>
            <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>رقم الصنف</th>
                <th>اسم الصنف</th>
                <th>الكمية المستلمة</th>
                <th>الكمية المصروفة</th>
                <th>الكمية المتاحة</th>
                <th>الحد الأدنى</th>
                <th>قيمة الشراء</th>
                <th>الشركة الموردة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td>${item.itemNumber || ''}</td>
                  <td>${item.itemName || ''}</td>
                  <td>${item.receivedQty || 0}</td>
                  <td>${item.issuedQty || 0}</td>
                  <td>${item.availableQty || 0}</td>
                  <td>${item.minQuantity || 0}</td>
                  <td>${item.purchaseValue || 0} ريال</td>
                  <td>${item.supplierName || ''}</td>
                  <td>
                   <span class="${item.availableQty <= item.minQuantity ? 'status-low' : 'status-available'}">
                      ${item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>إجمالي الأصناف: ${filteredItems.length}</p>
            <p>إجمالي قيمة المخزون: ${calculateTotalInventoryValue().toFixed(2)} ريال</p>
            <p>إجمالي قيمة الشراء: ${calculateTotalPurchaseValue().toFixed(2)} ريال</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

      toast({
        title: "تم التصدير",
        description: "تم تصدير البيانات إلى ملف PDF بنجاح",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات إلى PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
  if (!itemToDelete) return;
  
  try {
    setLoadingAction(true);
    const response = await warehouseApi.deleteInventoryItem(itemToDelete.id);
    
    if (response.success) {
      toast({
        title: "تم الحذف",
        description: "تم حذف الصنف بنجاح",
      });
      
      // Reload inventory data
      const inventoryResponse = await warehouseApi.getInventory();
      if (inventoryResponse.success) {
        setInventoryItems(inventoryResponse.data || []);
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  } catch (error: any) {
    toast({
      title: "خطأ في الحذف",
      description: error.message || "فشل في حذف الصنف",
      variant: "destructive",
    });
  } finally {
    setLoadingAction(false);
  }
};

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageModal(true);
  };

  // Download file function - for Supabase URLs
  const downloadFile = (fileUrl: string, filename: string) => {
    try {
      // Open the Supabase storage URL in a new tab to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل الملف",
        variant: "destructive",
      });
    }
  };

  // Handle PDF upload for withdraw form
  const handleWithdrawPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setWithdrawFormData(prev => ({ ...prev, pdfbase64: file as any }));
    }
  };

  // Handle PDF upload for edit dispense form
  const handleEditDispensePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setEditDispenseFormData(prev => ({ ...prev, pdfbase64: file as any }));
    }
  };

  // Handle edit dispense order
  const handleEditDispenseOrder = (dispenseOrder: any) => {
    setEditDispenseFormData({
      id: dispenseOrder.id || '',
      orderNumber: dispenseOrder.orderNumber || '',
      beneficiaryFacility: dispenseOrder.beneficiaryFacility || '',
      requestStatus: dispenseOrder.requestStatus || 'مفتوح تحت الاجراء',
      withdrawQty: dispenseOrder.withdrawQty?.toString() || '',
      withdrawDate: dispenseOrder.withdrawDate || '',
      recipientName: dispenseOrder.recipientName || '',
      recipientContact: dispenseOrder.recipientContact || '',
      notes: dispenseOrder.notes || '',
      pdfbase64: dispenseOrder.pdfbase64 || null
    });
    setShowEditDispenseModal(true);
  };

  // Handle delete dispense order
  const handleDeleteDispenseClick = (dispenseOrder: any) => {
    setDispenseToDelete(dispenseOrder);
    setShowDeleteDispenseModal(true);
  };

  // Handle edit dispense form input change
  const handleEditDispenseInputChange = (field: string, value: string) => {
    setEditDispenseFormData(prev => ({ ...prev, [field]: value }));
  };

  // Submit edit dispense order
  const handleEditDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    
    try {
      const response = await warehouseApi.updateWithdrawalOrder(editDispenseFormData.id, {
        beneficiaryFacility: editDispenseFormData.beneficiaryFacility,
        requestStatus: editDispenseFormData.requestStatus,
        withdrawQty: parseFloat(editDispenseFormData.withdrawQty),
        withdrawDate: editDispenseFormData.withdrawDate,
        recipientName: editDispenseFormData.recipientName,
        recipientContact: editDispenseFormData.recipientContact,
        notes: editDispenseFormData.notes,
        pdfbase64: editDispenseFormData.pdfbase64 // Send File or existing URL
      });

      if (response.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث أمر الصرف بنجاح",
        });
        
        // أغلق النوافذ ثم أعد تحميل الصفحة لضمان تحديث كل البيانات
        setShowEditDispenseModal(false);
        setShowDispenseDetailsModal(false);
        window.location.reload();
      } else {
        throw new Error(response.message || 'فشل في تحديث أمر الصرف');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث أمر الصرف",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle delete dispense order
  const handleDeleteDispenseOrder = async () => {
    if (!dispenseToDelete) return;
    
    setLoadingAction(true);
    
    try {
      const response = await warehouseApi.deleteWithdrawalOrder(dispenseToDelete.id);

      if (response.success) {
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف أمر الصرف بنجاح",
        });
        
        // أغلق النوافذ ثم أعد تحميل الصفحة لضمان تحديث كل البيانات
        setShowDeleteDispenseModal(false);
        setShowDispenseDetailsModal(false);
        setDispenseToDelete(null);
        window.location.reload();
      } else {
        throw new Error(response.message || 'فشل في حذف أمر الصرف');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف أمر الصرف",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة المستودع</h1>
        <p className="text-muted-foreground mt-2">إدارة المخزون والأصناف</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث في الأصناف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-input rounded-md text-right"
          />
        </div>
        <button 
          onClick={() => {
            setFormErrors({});
            setAddImagePreview('');
            setShowAddForm(true);
          }}
          className="admin-btn-success flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} />
          إضافة صنف جديد
        </button>
      </div>

      {/* Inventory Stats - MODIFIED: Added new stat card for total purchase value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="stat-number">{inventoryItems.length}</div>
          <div className="stat-label">إجمالي الأصناف</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-info text-sm">
            {calculateTotalPurchaseValue().toFixed(2)} ريال
          </div>
          <div className="stat-label">إجمالي قيمة الشراء</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-danger">
            {inventoryItems.filter(item => item.availableQty <= item.minQuantity).length}
          </div>
          <div className="stat-label">مخزون منخفض</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-success">
          {inventoryItems.reduce((sum, item) => sum + (parseFloat(item.availableQty) || 0), 0)}
          </div>
          <div className="stat-label">إجمالي الكمية المتاحة</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-info text-sm">
            {calculateTotalInventoryValue().toFixed(2)} ريال
          </div>
          <div className="stat-label">إجمالي قيمة المخزون</div>
        </div>
      </div>

      {/* Inventory Items - Enhanced Mobile View */}
      <div className="admin-card">
        <div className="admin-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg">الأصناف المتوفرة ({filteredItems.length})</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportToExcel}
              className="admin-btn-success text-xs flex items-center gap-1"
            >
              <FileText size={14} />
              Excel
            </button>
            <button 
              onClick={handleExportToPDF}
              className="admin-btn-danger text-xs flex items-center gap-1"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block p-4 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right">
                  <th className="p-3 whitespace-nowrap">رقم الصنف</th>
                  <th className="p-3 whitespace-nowrap">اسم الصنف</th>
                  <th className="p-3 whitespace-nowrap">الكمية المستلمة</th>
                  <th className="p-3 whitespace-nowrap">الكمية المصروفة</th>
                  <th className="p-3 whitespace-nowrap">الكمية المتاحة</th>
                  <th className="p-3 whitespace-nowrap">الحد الأدنى</th>
                  <th className="p-3 whitespace-nowrap">الشركة الموردة</th>
                  <th className="p-3 whitespace-nowrap">فاتورة الشراء</th>
                  <th className="p-3 whitespace-nowrap">مرفق PDF</th>
                  <th className="p-3 whitespace-nowrap">الحالة</th>
                  <th className="p-3 whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border text-right hover:bg-accent">
                    <td className="p-3 font-medium">{item.itemNumber}</td>
                    <td className="p-3">{item.itemName}</td>
                    <td className="p-3">{item.receivedQty}</td>
                    <td className="p-3">{item.issuedQty}</td>
                    <td className="p-3 font-medium">{item.availableQty}</td>
                    <td className="p-3">{item.minQuantity}</td>
                    <td className="p-3">{item.supplierName}</td>
                    <td className="p-3">
                      {(item.imageUrl || item.image) ? (
                        <button
                          onClick={() => handleImageClick(item.imageUrl || item.image)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded"
                          title="عرض فاتورة الشراء"
                        >
                          <ImageIcon size={16} />
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">لا توجد</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.pdfbase64 ? (
                        <button
                          onClick={() => downloadFile(item.pdfbase64, `item_${item.itemNumber}_attachment.pdf`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center gap-1"
                          title="انقر لتحميل PDF"
                        >
                          <Download size={14} />
                          <span className="text-xs">تحميل</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">لا يوجد مرفق</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        Number(item.availableQty) <= Number(item.minQuantity)
                          ? 'bg-danger text-danger-foreground' 
                          : 'bg-success text-success-foreground'
                      }`}>
                        {Number(item.availableQty) <= Number(item.minQuantity) ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button 
                          onClick={() => handleViewClick(item)}
                          className="p-1.5 text-info hover:bg-info/10 rounded" 
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded" 
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleWithdrawClick(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                          title="صرف"
                        >
                          <ShoppingCart size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded" 
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-start mb-3">
                <div className="text-right flex-1">
                  <h3 className="font-medium text-base">{item.itemName}</h3>
                  <p className="text-sm text-muted-foreground">رقم الصنف: {item.itemNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                  item.availableQty <= item.minQuantity 
                    ? 'bg-danger text-danger-foreground' 
                    : 'bg-success text-success-foreground'
                }`}>
                  {item.availableQty <= item.minQuantity ? 'مخزون منخفض' : 'متوفر'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="text-right">
                  <span className="text-muted-foreground">متاح:</span>
                  <span className="font-medium mr-2">{item.availableQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مستلم:</span>
                  <span className="font-medium mr-2">{item.receivedQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">مصروف:</span>
                  <span className="font-medium mr-2">{item.issuedQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">الحد الأدنى:</span>
                  <span className="font-medium mr-2">{item.minQuantity}</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3 text-right">
                الشركة الموردة: {item.supplierName}
              </div>

              {/* Image section for mobile */}
              {(item.imageUrl || item.image) && (
                <div className="mb-3 text-right">
                  <button
                    onClick={() => handleImageClick(item.imageUrl || item.image)}
                    className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                  >
                    <ImageIcon size={14} />
                    عرض فاتورة الشراء
                  </button>
                </div>
              )}

              {/* PDF section for mobile */}
              {item.pdfbase64 && (
                <div className="mb-3 text-right">
                  <button
                    onClick={() => downloadFile(item.pdfbase64, `item_${item.itemNumber}_attachment.pdf`)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Download size={14} />
                    تحميل المرفق PDF
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 justify-end flex-wrap">
                <button 
                  onClick={() => handleViewClick(item)}
                  className="admin-btn-info text-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  عرض
                </button>
                <button 
                  onClick={() => handleEditClick(item)}
                  className="admin-btn-warning text-xs flex items-center gap-1"
                >
                  <Edit size={12} />
                  تعديل
                </button>
                <button 
                  onClick={() => handleWithdrawClick(item)}
                  className="admin-btn-primary text-xs flex items-center gap-1"
                >
                  <ShoppingCart size={12} />
                  صرف
                </button>
                <button 
                  onClick={() => {
  setItemToDelete(item);
  setShowDeleteModal(true);
}}
                  className="admin-btn-danger text-xs flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal - MODIFIED: Added new fields */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>إضافة صنف جديد</h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemNumber}
                        onChange={(e) => handleAddInputChange('itemNumber', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemNumber ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الصنف"
                        required
                      />
                      {formErrors.itemNumber && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={addFormData.itemName}
                        onChange={(e) => handleAddInputChange('itemName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الصنف"
                        required
                      />
                      {formErrors.itemName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={addFormData.receivedQty}
                        onChange={(e) => handleAddInputChange('receivedQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.receivedQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0"
                        required
                      />
                      {formErrors.receivedQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.receivedQty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={addFormData.issuedQty}
                        onChange={(e) => handleAddInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={addFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={addFormData.minQuantity}
                        onChange={(e) => handleAddInputChange('minQuantity', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.minQuantity ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الحد الأدنى"
                        required
                      />
                      {formErrors.minQuantity && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.minQuantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>

              {/* Financial and Supplier Information - MODIFIED: Added new fields */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={addFormData.purchaseValue}
                        onChange={(e) => handleAddInputChange('purchaseValue', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.purchaseValue ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-red-500 text-xs mt-1 text-right">هذا هو المبلغ الإجمالي سيتم تقسيمه على الكمية المستلمة</p>
                      {formErrors.purchaseValue && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.purchaseValue}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={addFormData.deliveryDate}
                        onChange={(e) => handleAddInputChange('deliveryDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.deliveryDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.deliveryDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.deliveryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={addFormData.supplierName}
                        onChange={(e) => handleAddInputChange('supplierName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.supplierName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الشركة"
                        required
                      />
                      {formErrors.supplierName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.supplierName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={addFormData.beneficiaryFacility}
                        onChange={(e) => handleAddInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* NEW FIELDS */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم فاتورة الشراء (اختياري)</label>
                      <input
                        type="text"
                        value={addFormData.invoiceNumber}
                        onChange={(e) => handleAddInputChange('invoiceNumber', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الفاتورة أو التعميد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ الفاتورة (اختياري)</label>
                      <input
                        type="date"
                        value={addFormData.invoiceDate}
                        onChange={(e) => handleAddInputChange('invoiceDate', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة الموردة (اختياري)</label>
                      <input
                        type="text"
                        value={addFormData.supplierContact}
                        onChange={(e) => handleAddInputChange('supplierContact', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الهاتف، البريد الإلكتروني، العنوان..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>فاتورة الشراء</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رفع صورة فاتورة الشراء</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e.target.files?.[0] || null, false)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        يمكنك رفع صورة لفاتورة الشراء (اختياري)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رفع مرفق PDF</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handlePdfChange(e.target.files?.[0] || null, false)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        يمكنك رفع ملف PDF للفاتورة أو أي مستند ذات صلة (اختياري)
                      </p>
                    </div>
                    
                    {/* Image Preview */}
                    {addImagePreview && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 text-right">معاينة الصورة:</label>
                        <div className="relative inline-block">
                          <img
                            src={addImagePreview}
                            alt="معاينة فاتورة الشراء"
                            className="max-w-full max-h-48 object-contain border border-border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageChange(null, false)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={addFormData.notes}
                    onChange={(e) => handleAddInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start flex-wrap">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Form Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>إنشاء أمر صرف</h2>
              <button 
                onClick={() => setShowWithdrawForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemNumber}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف</label>
                      <input
                        type="text"
                        value={withdrawFormData.itemName}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصرف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة *</label>
                      <select
                        value={withdrawFormData.beneficiaryFacility}
                        onChange={(e) => handleWithdrawInputChange('beneficiaryFacility', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.beneficiaryFacility ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      >
                        <option value="">اختر الجهة المستفيدة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                      {formErrors.beneficiaryFacility && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.beneficiaryFacility}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة *</label>
                      <input
                        type="number"
                        value={withdrawFormData.withdrawQty}
                        onChange={(e) => handleWithdrawInputChange('withdrawQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.withdrawQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الكمية"
                        max={selectedItem?.availableQty || 0}
                        required
                      />
                      {formErrors.withdrawQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.withdrawQty}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        الكمية المتاحة: {selectedItem?.availableQty || 0}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ الصرف *</label>
                      <input
                        type="date"
                        value={withdrawFormData.withdrawDate}
                        onChange={(e) => handleWithdrawInputChange('withdrawDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.withdrawDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.withdrawDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.withdrawDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">حالة الطلب</label>
                      <select
                        value={withdrawFormData.requestStatus}
                        onChange={(e) => handleWithdrawInputChange('requestStatus', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="مفتوح تحت الاجراء">مفتوح تحت الاجراء</option>
                        <option value="تم الصرف">تم الصرف</option>
                        <option value="مرفوض">مرفوض</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات المستلم</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم المستلم *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientName}
                        onChange={(e) => handleWithdrawInputChange('recipientName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.recipientName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم المستلم"
                        required
                      />
                      {formErrors.recipientName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.recipientName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم التواصل *</label>
                      <input
                        type="text"
                        value={withdrawFormData.recipientContact}
                        onChange={(e) => handleWithdrawInputChange('recipientContact', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.recipientContact ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الهاتف أو البريد الإلكتروني"
                        required
                      />
                      {formErrors.recipientContact && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.recipientContact}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={withdrawFormData.notes}
                    onChange={(e) => handleWithdrawInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* PDF Upload */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>مرفق PDF (اختياري)</h3>
                </div>
                <div className="p-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleWithdrawPdfUpload}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                  />
                  {withdrawFormData.pdfbase64 && (
                    <div className="mt-2 text-right">
                      <div className="flex items-center gap-2 text-blue-600">
                        <FileText size={16} />
                        <span className="text-sm">تم رفع ملف PDF</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start flex-wrap">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  إنشاء أمر الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Modal - MODIFIED: Added new fields display */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>عرض تفاصيل الصنف</h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات أساسية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">رقم الصنف:</span> {selectedItem.itemNumber}</div>
                    <div><span className="font-medium">اسم الصنف:</span> {selectedItem.itemName}</div>
                    <div><span className="font-medium">الشركة الموردة:</span> {selectedItem.supplierName}</div>
                    {/* NEW FIELDS DISPLAY */}
                    {selectedItem.supplierContact && (
                      <div><span className="font-medium">بيانات التواصل:</span> {selectedItem.supplierContact}</div>
                    )}
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>الكميات</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">الكمية المستلمة:</span> {selectedItem.receivedQty}</div>
                    <div><span className="font-medium">الكمية المصروفة:</span> {selectedItem.issuedQty}</div>
                    <div><span className="font-medium">الكمية المتاحة:</span> {selectedItem.availableQty}</div>
                    <div><span className="font-medium">الحد الأدنى:</span> {selectedItem.minQuantity}</div>
                  </div>
                </div>
                
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>معلومات مالية</h3>
                  </div>
                  <div className="p-4 space-y-3 text-right">
                    <div><span className="font-medium">قيمة الشراء:</span> {selectedItem.purchaseValue} ريال</div>
                    <div><span className="font-medium">الجهة المستفيدة:</span> {selectedItem.beneficiaryFacility}</div>
                    <div><span className="font-medium">تاريخ التوريد:</span> {selectedItem.deliveryDate || 'غير محدد'}</div>
                    {/* NEW FIELDS DISPLAY */}
                    {selectedItem.invoiceNumber && (
                      <div><span className="font-medium">رقم الفاتورة:</span> {selectedItem.invoiceNumber}</div>
                    )}
                    {selectedItem.invoiceDate && (
                      <div><span className="font-medium">تاريخ الفاتورة:</span> {selectedItem.invoiceDate}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Section */}
              {(selectedItem.imageUrl || selectedItem.image) && (
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>فاتورة الشراء</h3>
                  </div>
                  <div className="p-4">
                    <div className="text-center">
                      <img
                        src={selectedItem.imageUrl || selectedItem.image}
                        alt="فاتورة الشراء"
                        className="max-w-full max-h-64 object-contain border border-border rounded-md cursor-pointer"
                        onClick={() => handleImageClick(selectedItem.imageUrl || selectedItem.image)}
                      />
                      <p className="text-sm text-muted-foreground mt-2">انقر على الصورة لعرضها بحجم أكبر</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Withdrawal Orders Section */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصرف</h3>
                </div>
                <div className="p-4">
                  {selectedItem.withdrawalOrders && selectedItem.withdrawalOrders.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground text-right mb-4">
                        إجمالي عدد أوامر الصرف: {selectedItem.withdrawalOrders.length}
                      </div>
                      
                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <div className="min-w-full">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-right">
                                <th className="p-3 whitespace-nowrap">رقم الأمر</th>
                                <th className="p-3 whitespace-nowrap">الجهة المستلمة</th>
                                <th className="p-3 whitespace-nowrap">الكمية</th>
                                <th className="p-3 whitespace-nowrap">تاريخ الصرف</th>
                                <th className="p-3 whitespace-nowrap">اسم المستلم</th>
                                <th className="p-3 whitespace-nowrap">رقم التواصل</th>
                                <th className="p-3 whitespace-nowrap">الحالة</th>
                                <th className="p-3 whitespace-nowrap">المرفق</th>
                                 <th className="p-3 whitespace-nowrap">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedItem.withdrawalOrders.map((order: any) => (
                                <tr key={order.id} className="border-b border-border text-right hover:bg-accent">
                                  <td className="p-3 font-medium">{order.orderNumber}</td>
                                  <td className="p-3">{order.beneficiaryFacility || 'غير محدد'}</td>
                                  <td className="p-3">{order.withdrawQty}</td>
                                  <td className="p-3">{order.withdrawDate}</td>
                                  <td className="p-3">{order.recipientName}</td>
                                  <td className="p-3">{order.recipientContact}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                      order.requestStatus === 'تم الصرف' 
                                        ? 'bg-success text-success-foreground' 
                                        : order.requestStatus === 'مرفوض'
                                        ? 'bg-danger text-danger-foreground'
                                        : 'bg-warning text-warning-foreground'
                                    }`}>
                                      {order.requestStatus}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    {order.pdfbase64 ? (
                                      <button
                                        onClick={() => downloadFile(order.pdfbase64, `dispense_order_${order.orderNumber}_document.pdf`)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center gap-1"
                                        title="انقر لتحميل PDF"
                                      >
                                        <Download size={14} />
                                        <span className="text-xs">تحميل</span>
                                      </button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">لا يوجد مرفق</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1 flex-wrap">
                                      <button 
                                        onClick={() => {
                                          setSelectedDispenseOrder(order);
                                          setShowDispenseDetailsModal(true);
                                        }}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                                        title="عرض التفاصيل"
                                      >
                                        <Eye size={14} />
                                      </button>
                                       <button 
                                         onClick={() => handlePrintWithdrawalOrder(order)}
                                         className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                                         title="طباعة أمر الصرف"
                                       >
                                         <Printer size={14} />
                                       </button>
                                       {order.pdfbase64 && (
                                         <button
                                           onClick={() => downloadFile(order.pdfbase64, `dispense_order_${order.orderNumber}_document.pdf`)}
                                           className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                           title="تحميل PDF"
                                         >
                                           <Download size={14} />
                                         </button>
                                       )}
                                       <button
                                         onClick={() => handleEditDispenseOrder(order)}
                                         className="p-1.5 text-warning hover:bg-warning/10 rounded"
                                         title="تعديل"
                                       >
                                         <Edit size={14} />
                                       </button>
                                      <button
                                        onClick={() => handleDeleteDispenseClick(order)}
                                        className="p-1.5 text-danger hover:bg-danger/10 rounded"
                                        title="حذف"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3">
                        {selectedItem.withdrawalOrders.map((order: any) => (
                          <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-right flex-1">
                                <h4 className="font-medium text-sm">{order.orderNumber}</h4>
                                <p className="text-xs text-muted-foreground">الجهة: {order.beneficiaryFacility || 'غير محدد'}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                  order.requestStatus === 'تم الصرف' 
                                    ? 'bg-success text-success-foreground' 
                                    : order.requestStatus === 'مرفوض'
                                    ? 'bg-danger text-danger-foreground'
                                    : 'bg-warning text-warning-foreground'
                                }`}>
                                  {order.requestStatus}
                                </span>
                                <button 
                                  onClick={() => {
                                    setSelectedDispenseOrder(order);
                                    setShowDispenseDetailsModal(true);
                                  }}
                                  className="p-1 text-primary hover:bg-primary/10 rounded" 
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={12} />
                                </button>
                                 <button 
                                   onClick={() => handlePrintWithdrawalOrder(order)}
                                   className="p-1 text-primary hover:bg-primary/10 rounded" 
                                   title="طباعة أمر الصرف"
                                 >
                                   <Printer size={12} />
                                 </button>
                                 {order.pdfbase64 && (
                                   <button
                                     onClick={() => downloadFile(order.pdfbase64, `dispense_order_${order.orderNumber}_document.pdf`)}
                                     className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                     title="تحميل PDF"
                                   >
                                     <Download size={12} />
                                   </button>
                                 )}
                                 <button
                                   onClick={() => handleEditDispenseOrder(order)}
                                   className="p-1 text-warning hover:bg-warning/10 rounded"
                                   title="تعديل"
                                 >
                                   <Edit size={12} />
                                 </button>
                                <button
                                  onClick={() => handleDeleteDispenseClick(order)}
                                  className="p-1 text-danger hover:bg-danger/10 rounded"
                                  title="حذف"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-right">
                                <span className="text-muted-foreground">الكمية:</span>
                                <span className="font-medium mr-1">{order.withdrawQty}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">التاريخ:</span>
                                <span className="font-medium mr-1">{order.withdrawDate}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">المستلم:</span>
                                <span className="font-medium mr-1">{order.recipientName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">التواصل:</span>
                                <span className="font-medium mr-1">{order.recipientContact}</span>
                              </div>
                            </div>
                            
                            {/* PDF Download Section for Mobile */}
                            {order.pdfbase64 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <button
                                  onClick={() => downloadFile(order.pdfbase64, `dispense_order_${order.orderNumber}_document.pdf`)}
                                  className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded-md py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-blue-100"
                                >
                                  <Download size={14} />
                                  انقر لتحميل المرفق PDF
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                      <p>لا توجد أوامر صرف لهذا الصنف</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {selectedItem.notes && (
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>ملاحظات</h3>
                  </div>
                  <div className="p-4">
                    <div className="bg-accent/50 p-3 rounded-md text-right">
                      <p className="leading-relaxed">{selectedItem.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal - MODIFIED: Added new fields */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تعديل الصنف</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemNumber}
                        onChange={(e) => handleEditInputChange('itemNumber', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemNumber ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="رقم الصنف"
                        required
                      />
                      {formErrors.itemNumber && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الصنف *</label>
                      <input
                        type="text"
                        value={editFormData.itemName}
                        onChange={(e) => handleEditInputChange('itemName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.itemName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الصنف"
                        required
                      />
                      {formErrors.itemName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.itemName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الكمية</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المستلمة *</label>
                      <input
                        type="number"
                        value={editFormData.receivedQty}
                        onChange={(e) => handleEditInputChange('receivedQty', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.receivedQty ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0"
                        required
                      />
                      {formErrors.receivedQty && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.receivedQty}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة</label>
                      <input
                        type="number"
                        value={editFormData.issuedQty}
                        onChange={(e) => handleEditInputChange('issuedQty', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الكمية المتاحة (تلقائي)</label>
                      <input
                        type="number"
                        value={editFormData.availableQty}
                        className="w-full p-2 border border-input rounded-md text-right text-sm bg-gray-100"
                        placeholder="يحسب تلقائياً"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">كمية الحد الأدنى *</label>
                      <input
                        type="number"
                        value={editFormData.minQuantity}
                        onChange={(e) => handleEditInputChange('minQuantity', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.minQuantity ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="الحد الأدنى"
                        required
                      />
                      {formErrors.minQuantity && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.minQuantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    * سيتم تنبيهك عند وصول المخزون إلى الحد الأدنى
                  </div>
                </div>
              </div>

              {/* Financial and Supplier Information - MODIFIED: Added new fields */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>المعلومات المالية والموردين</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">قيمة الشراء (ريال) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.purchaseValue}
                        onChange={(e) => handleEditInputChange('purchaseValue', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.purchaseValue ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-red-500 text-xs mt-1 text-right">هذا هو المبلغ الإجمالي سيتم تقسيمه على الكمية المستلمة</p>
                      {formErrors.purchaseValue && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.purchaseValue}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد/التسليم *</label>
                      <input
                        type="date"
                        value={editFormData.deliveryDate}
                        onChange={(e) => handleEditInputChange('deliveryDate', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.deliveryDate ? 'border-red-500' : 'border-input'
                        }`}
                        required
                      />
                      {formErrors.deliveryDate && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.deliveryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة *</label>
                      <input
                        type="text"
                        value={editFormData.supplierName}
                        onChange={(e) => handleEditInputChange('supplierName', e.target.value)}
                        className={`w-full p-2 border rounded-md text-right text-sm ${
                          formErrors.supplierName ? 'border-red-500' : 'border-input'
                        }`}
                        placeholder="اسم الشركة"
                        required
                      />
                      {formErrors.supplierName && (
                        <p className="text-red-500 text-xs mt-1 text-right">{formErrors.supplierName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة/المنشأة الطالبة</label>
                      <select
                        value={editFormData.beneficiaryFacility}
                        onChange={(e) => handleEditInputChange('beneficiaryFacility', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      >
                        <option value="">اختر المنشأة</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.name}>{facility.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* NEW FIELDS */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">رقم فاتورة الشراء (اختياري)</label>
                      <input
                        type="text"
                        value={editFormData.invoiceNumber}
                        onChange={(e) => handleEditInputChange('invoiceNumber', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الفاتورة أو التعميد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تاريخ الفاتورة (اختياري)</label>
                      <input
                        type="date"
                        value={editFormData.invoiceDate}
                        onChange={(e) => handleEditInputChange('invoiceDate', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-right">بيانات التواصل للشركة الموردة (اختياري)</label>
                      <input
                        type="text"
                        value={editFormData.supplierContact}
                        onChange={(e) => handleEditInputChange('supplierContact', e.target.value)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                        placeholder="رقم الهاتف، البريد الإلكتروني، العنوان..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>فاتورة الشراء</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تحديث صورة فاتورة الشراء</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e.target.files?.[0] || null, true)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        يمكنك رفع صورة جديدة لفاتورة الشراء (اختياري)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-right">تحديث مرفق PDF</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handlePdfChange(e.target.files?.[0] || null, true)}
                        className="w-full p-2 border border-input rounded-md text-right text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        يمكنك رفع ملف PDF جديد للفاتورة أو أي مستند ذات صلة (اختياري)
                      </p>
                    </div>
                    
                    {/* Image Preview */}
                    {editImagePreview && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 text-right">
                          {editFormData.image ? 'معاينة الصورة الجديدة:' : 'الصورة الحالية:'}
                        </label>
                        <div className="relative inline-block">
                          <img
                            src={editImagePreview}
                            alt="معاينة فاتورة الشراء"
                            className="max-w-full max-h-48 object-contain border border-border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageChange(null, true)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>ملاحظات</h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => handleEditInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    rows={3}
                    placeholder="ملاحظات إضافية (اختياري)..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-start flex-wrap">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Details Modal */}
      {showDispenseDetailsModal && selectedDispenseOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تفاصيل أمر الصرف - {selectedDispenseOrder.orderNumber}</h2>
              <button 
                onClick={() => {
                  setShowDispenseDetailsModal(false);
                  setSelectedDispenseOrder(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الأمر</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم الأمر:</span>
                      <p className="font-semibold">{selectedDispenseOrder.orderNumber}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الجهة المستفيدة:</span>
                      <p className="font-semibold">{selectedDispenseOrder.beneficiaryFacility || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الكمية المصروفة:</span>
                      <p className="font-semibold">{selectedDispenseOrder.withdrawQty}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">تاريخ الصرف:</span>
                      <p className="font-semibold">{selectedDispenseOrder.withdrawDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات المستلم</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">اسم المستلم:</span>
                      <p className="font-semibold">{selectedDispenseOrder.recipientName}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم التواصل:</span>
                      <p className="font-semibold">{selectedDispenseOrder.recipientContact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>حالة الأمر والتواريخ</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedDispenseOrder.requestStatus === 'تم الصرف' 
                            ? 'bg-success text-success-foreground' 
                            : selectedDispenseOrder.requestStatus === 'مرفوض'
                            ? 'bg-danger text-danger-foreground'
                            : 'bg-warning text-warning-foreground'
                        }`}>
                          {selectedDispenseOrder.requestStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Information */}
              <div className="admin-card">
                <div className="admin-header">
                  <h3>معلومات الصنف</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">رقم الصنف:</span>
                      <p className="font-semibold">{selectedItem?.itemNumber || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">اسم الصنف:</span>
                      <p className="font-semibold">{selectedItem?.itemName || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الشركة الموردة:</span>
                      <p className="font-semibold">{selectedItem?.supplierName || 'غير محدد'}</p>
                    </div>
                    <div className="bg-accent/50 p-3 rounded-md">
                      <span className="text-sm font-medium text-muted-foreground">الكمية المتاحة قبل الصرف:</span>
                      <p className="font-semibold">{selectedItem?.availableQty || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedDispenseOrder.notes && (
                <div className="admin-card">
                  <div className="admin-header">
                    <h3>ملاحظات</h3>
                  </div>
                  <div className="p-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <p className="leading-relaxed">{selectedDispenseOrder.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4 flex-wrap">
                <button
                  onClick={() => handlePrintWithdrawalOrder(selectedDispenseOrder)}
                  className="admin-btn-primary flex items-center gap-2 px-4 py-2"
                >
                  <Printer size={16} />
                  طباعة أمر الصرف
                </button>
                <button
                  onClick={() => handleEditDispenseOrder(selectedDispenseOrder)}
                  className="admin-btn-warning flex items-center gap-2 px-4 py-2"
                >
                  <Edit size={16} />
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteDispenseClick(selectedDispenseOrder)}
                  className="admin-btn-danger flex items-center gap-2 px-4 py-2"
                >
                  <Trash2 size={16} />
                  حذف
                </button>
                <button
                  onClick={() => {
                    setShowDispenseDetailsModal(false);
                    setSelectedDispenseOrder(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

         {/* Delete Confirmation Modal */}
{showDeleteModal && itemToDelete && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-background rounded-lg w-full max-w-md">
      <div className="admin-header flex justify-between items-center">
        <h2>تأكيد الحذف</h2>
        <button 
          onClick={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <h3 className="text-lg font-medium mb-2">هل أنت متأكد من الحذف؟</h3>
          <p className="text-muted-foreground text-sm">
            سيتم حذف الصنف "{itemToDelete.itemName}" نهائياً ولن يمكن استرجاعه.
          </p>
        </div>
        
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={handleDeleteItem}
            disabled={loadingAction}
            className="admin-btn-danger flex items-center gap-2 px-4 py-2"
          >
            {loadingAction ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            تأكيد الحذف
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
          >
            <X size={16} />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Edit Dispense Order Modal */}
      {showEditDispenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="admin-header flex justify-between items-center">
              <h2>تعديل أمر الصرف - {editDispenseFormData.orderNumber}</h2>
              <button 
                onClick={() => setShowEditDispenseModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditDispenseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">الجهة المستفيدة *</label>
                  <select
                    value={editDispenseFormData.beneficiaryFacility}
                    onChange={(e) => handleEditDispenseInputChange('beneficiaryFacility', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    required
                  >
                    <option value="">اختر المنشأة</option>
                    {facilities.map(facility => (
                      <option key={facility.id} value={facility.name}>{facility.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">حالة الطلب *</label>
                  <select
                    value={editDispenseFormData.requestStatus}
                    onChange={(e) => handleEditDispenseInputChange('requestStatus', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    required
                  >
                    <option value="مفتوح تحت الاجراء">مفتوح تحت الإجراء</option>
                    <option value="تم الصرف">تم الصرف</option>
                    <option value="مرفوض">مرفوض</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-right">الكمية المصروفة *</label>
                  <input
                    type="number"
                    value={editDispenseFormData.withdrawQty}
                    onChange={(e) => handleEditDispenseInputChange('withdrawQty', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    placeholder="الكمية"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-right">تاريخ الصرف *</label>
                  <input
                    type="date"
                    value={editDispenseFormData.withdrawDate}
                    onChange={(e) => handleEditDispenseInputChange('withdrawDate', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-right">اسم المستلم *</label>
                  <input
                    type="text"
                    value={editDispenseFormData.recipientName}
                    onChange={(e) => handleEditDispenseInputChange('recipientName', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    placeholder="اسم المستلم"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-right">رقم التواصل *</label>
                  <input
                    type="text"
                    value={editDispenseFormData.recipientContact}
                    onChange={(e) => handleEditDispenseInputChange('recipientContact', e.target.value)}
                    className="w-full p-2 border border-input rounded-md text-right text-sm"
                    placeholder="رقم الجوال أو الهاتف"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right">ملاحظات</label>
                <textarea
                  value={editDispenseFormData.notes}
                  onChange={(e) => handleEditDispenseInputChange('notes', e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                  rows={3}
                  placeholder="ملاحظات إضافية (اختياري)..."
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-right">مرفق PDF (اختياري)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleEditDispensePdfUpload}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                />
                {editDispenseFormData.pdfbase64 && (
                  <div className="mt-2 text-right">
                    <div className="flex items-center gap-2 text-blue-600">
                      <FileText size={16} />
                      <span className="text-sm">تم رفع ملف PDF</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-start flex-wrap">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="admin-btn-success flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditDispenseModal(false)}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dispense Order Confirmation Modal */}
      {showDeleteDispenseModal && dispenseToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg w-full max-w-md">
            <div className="admin-header flex justify-between items-center">
              <h2>تأكيد حذف أمر الصرف</h2>
              <button 
                onClick={() => {
                  setShowDeleteDispenseModal(false);
                  setDispenseToDelete(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-danger" />
                </div>
                <h3 className="text-lg font-medium mb-2">هل أنت متأكد من الحذف؟</h3>
                <div className="text-muted-foreground text-sm space-y-2">
                  <p>سيتم حذف أمر الصرف رقم "{dispenseToDelete.orderNumber}" نهائياً</p>
                  <div className="bg-accent/50 p-3 rounded-md text-right">
                    <p><strong>الجهة المستفيدة:</strong> {dispenseToDelete.beneficiaryFacility}</p>
                    <p><strong>الكمية:</strong> {dispenseToDelete.withdrawQty}</p>
                    <p><strong>المستلم:</strong> {dispenseToDelete.recipientName}</p>
                  </div>
                  <p className="text-red-600">هذا الإجراء لا يمكن التراجع عنه!</p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleDeleteDispenseOrder}
                  disabled={loadingAction}
                  className="admin-btn-danger flex items-center gap-2 px-4 py-2"
                >
                  {loadingAction ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDispenseModal(false);
                    setDispenseToDelete(null);
                  }}
                  className="admin-btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Image Modal */}
      {showImageModal && selectedImageUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2 hover:bg-white/30 z-10"
            >
              <X size={20} />
            </button>
            <img
              src={selectedImageUrl}
              alt="فاتورة الشراء"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
