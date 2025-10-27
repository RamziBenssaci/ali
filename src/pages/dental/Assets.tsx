
import { useState, useEffect } from 'react';
import { Save, Eye, Edit, Trash2, Download, Printer, AlertCircle, Image as ImageIcon, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { dentalAssetsApi, reportsApi } from '@/lib/api';
import EditAssetDialog from '@/components/EditAssetDialog';

// Custom Delete Confirmation Dialog Component
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deviceName: string;
}

function DeleteConfirmDialog({ isOpen, onClose, onConfirm, deviceName }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4 text-right" dir="rtl">
        <h3 className="text-lg font-semibold mb-4 text-danger">تأكيد الحذف</h3>
        <p className="text-muted-foreground mb-6">
          هل أنت متأكد من حذف الجهاز "{deviceName}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3 justify-start">
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="px-6"
          >
            حذف
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-6"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

// Image Preview Modal
interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

function ImagePreviewModal({ isOpen, onClose, imageUrl, title }: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-right">{title}</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <img 
            src={imageUrl} 
            alt={title}
            className="max-w-full max-h-[70vh] object-contain mx-auto"
          />
        </div>
      </div>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
        السابق
      </button>

      <div className="flex gap-1">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              page === currentPage
                ? 'bg-primary text-primary-foreground'
                : page === '...'
                ? 'cursor-default text-muted-foreground'
                : 'bg-background border border-input hover:bg-accent'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        التالي
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    facility: '',
    status: '',
    warranty: '',
    supplier: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deviceNameSearch, setDeviceNameSearch] = useState('');
  
  // Modal states
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; asset: any | null }>({
    isOpen: false,
    asset: null
  });
  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; asset: any | null }>({
    isOpen: false,
    asset: null
  });
  const [imagePreview, setImagePreview] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });
  
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    deviceName: '',
    serialNumber: '',
    facilityName: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    deviceModel: '',
    manufacturer: '',
    deliveryDate: '',
    installationDate: '',
    warrantyPeriod: 1,
    deviceStatus: 'يعمل',
    notes: '',
    image: ''
  });

  // Image handling
  const [previewImage, setPreviewImage] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter assets when assets or filters change
  useEffect(() => {
    applyFilters();
  }, [assets, filters, deviceNameSearch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAssets]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load assets and facilities in parallel
      const [assetsResponse, facilitiesResponse] = await Promise.all([
        dentalAssetsApi.getAssets(),
        reportsApi.getFacilities()
      ]);

      if (assetsResponse.success) {
        setAssets(assetsResponse.data || []);
      }
      
      if (facilitiesResponse.success) {
        setFacilities(facilitiesResponse.data || []);
        console.log("Facilities loaded:", facilitiesResponse.data || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('فشل في تحميل البيانات. تحقق من الاتصال.');
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الأصول",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    // Filter by device name search
    if (deviceNameSearch.trim()) {
      filtered = filtered.filter(asset => 
        asset.deviceName?.toLowerCase().includes(deviceNameSearch.toLowerCase())
      );
    }

    // Filter by facility
    if (filters.facility) {
      filtered = filtered.filter(asset => asset.facilityName === filters.facility);
    }

    // Filter by device status
    if (filters.status) {
      if (filters.status === 'working') {
        filtered = filtered.filter(asset => asset.deviceStatus === 'يعمل');
      } else if (filters.status === 'broken') {
        filtered = filtered.filter(asset => asset.deviceStatus === 'مكهن');
      }
    }

    // Filter by warranty status
    if (filters.warranty) {
      if (filters.warranty === 'under_warranty') {
        filtered = filtered.filter(asset => 
          asset.warrantyStatus === 'تحت الضمان' && asset.warrantyActive !== 'no'
        );
      } else if (filters.warranty === 'out_of_warranty') {
        filtered = filtered.filter(asset => 
          asset.warrantyActive === 'no' || asset.warrantyStatus !== 'تحت الضمان'
        );
      }
    }

    // Filter by supplier
    if (filters.supplier) {
      filtered = filtered.filter(asset => asset.supplierName === filters.supplier);
    }

    setFilteredAssets(filtered);
  };

  const clearFilters = () => {
    setFilters({
      facility: '',
      status: '',
      warranty: '',
      supplier: ''
    });
  };

  // Get unique suppliers from assets
  const getUniqueSuppliers = () => {
    const suppliers = assets.map(asset => asset.supplierName).filter(Boolean);
    return [...new Set(suppliers)];
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, endIndex);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewImage(preview);
      setFormData(prev => ({ ...prev, image: file as any }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deviceName || !formData.serialNumber ) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Pass the File object directly to API
      const dataToSubmit = {
        ...formData,
        image: formData.image // Send File object or empty string
      };
      
      const response = await dentalAssetsApi.createAsset(dataToSubmit);
      
      if (response.success) {
        toast({
          title: "نجح",
          description: "تم إضافة الجهاز بنجاح",
        });
        
        // Reset form and reload data
        setFormData({
          deviceName: '',
          serialNumber: '',
          facilityName: '',
          supplierName: '',
          supplierContact: '',
          supplierEmail: '',
          deviceModel: '',
          manufacturer: '',
          deliveryDate: '',
          installationDate: '',
          warrantyPeriod: 1,
          deviceStatus: 'يعمل',
          notes: '',
          image: ''
        });
        setPreviewImage('');
        
        // Reload assets list
        loadData();
      }
    } catch (error: any) {
      console.error('Error creating asset:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الجهاز",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssetUpdate = async (updatedAsset: any) => {
    try {
      const response = await dentalAssetsApi.updateAsset(updatedAsset.id, updatedAsset);
      
      if (response.success) {
        toast({
          title: "نجح",
          description: "تم تحديث الجهاز بنجاح",
        });
        
        // Update local state
        setAssets(prev => prev.map(asset => 
          asset.id === updatedAsset.id ? updatedAsset : asset
        ));
      }
    } catch (error: any) {
      console.error('Error updating asset:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الجهاز",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (asset: any) => {
    setDeleteDialog({ isOpen: true, asset });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, asset: null });
  };

  const handleAssetDelete = async () => {
    if (!deleteDialog.asset) return;

    try {
      const response = await dentalAssetsApi.deleteAsset(deleteDialog.asset.id);
      
      if (response.success) {
        toast({
          title: "نجح",
          description: "تم حذف الجهاز بنجاح",
        });
        
        // Remove from local state
        setAssets(prev => prev.filter(asset => asset.id !== deleteDialog.asset.id));
        closeDeleteDialog();
      }
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الجهاز",
        variant: "destructive",
      });
    }
  };

  const handlePrintAsset = (asset: any) => {
    const printContent = `
      <div style="text-align: right; direction: rtl; padding: 20px; font-family: Arial, sans-serif;">
        <h2>بيانات الأصل</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">اسم الجهاز:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.deviceName}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">الرقم التسلسلي:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.serialNumber}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">المنشأة:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.facilityName}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">الشركة الصانعة:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.manufacturer || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">موديل الجهاز:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.deviceModel || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">الشركة الموردة:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.supplierName || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">رقم المسؤول:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.supplierContact || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">إيميل المسؤول:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.supplierEmail || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">تاريخ التوريد:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.deliveryDate || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">تاريخ التركيب:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.installationDate || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">مدة الضمان:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.warrantyPeriod || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">الحالة:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.deviceStatus}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">حالة الضمان:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.warrantyActive === 'no' ? '⚠️ غير مشمول بالضمان' : asset.warrantyStatus}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">عداد عمر الجهاز:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.deviceAge || '-'}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">عدد الأعطال:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.malfunctionCount}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">الملاحظات:</td><td style="border: 1px solid #ddd; padding: 8px;">${asset.notes || '-'}</td></tr>
        </table>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  // Export to Excel function - improved formatting
  const exportToExcel = () => {
    const headers = [
      'اسم الجهاز',
      'الرقم التسلسلي',
      'المنشأة',
      'الشركة الصانعة',
      'موديل الجهاز',
      'الشركة الموردة',
      'رقم المسؤول',
      'إيميل المسؤول',
      'تاريخ التوريد',
      'تاريخ التركيب',
      'مدة الضمان (سنوات)',
      'حالة الجهاز',
      'حالة الضمان',
      'عداد عمر الجهاز',
      'عدد الأعطال',
      'الملاحظات'
    ];

    // Create organized CSV data row by row like PDF export
    const csvRows = [
      headers.join(',')
    ];

    filteredAssets.forEach(asset => {
      const row = [
        asset.deviceName || '',
        asset.serialNumber || '',
        asset.facilityName || '',
        asset.manufacturer || '',
        asset.deviceModel || '',
        asset.supplierName || '',
        asset.supplierContact || '',
        asset.supplierEmail || '',
        asset.deliveryDate || '',
        asset.installationDate || '',
        asset.warrantyPeriod || '',
        asset.deviceStatus || '',
        asset.warrantyActive === 'no' ? 'غير مشمول بالضمان' : (asset.warrantyStatus || ''),
        asset.deviceAge || '',
        asset.malfunctionCount || 0,
        asset.notes || ''
      ].map(field => `"${field}"`); // Wrap each field in quotes

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    
    // Add BOM for UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "نجح",
      description: "تم تصدير البيانات إلى Excel بنجاح",
    });
  };

  // Export to PDF function
  const exportToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>تقرير الأصول</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; }
          .status-active { background-color: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; }
          .status-inactive { background-color: #f8d7da; color: #721c24; padding: 2px 8px; border-radius: 4px; }
          .warranty-active { background-color: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; }
          .warranty-inactive { background-color: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الأصول</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          <p>إجمالي الأجهزة: ${filteredAssets.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>اسم الجهاز</th>
              <th>الرقم التسلسلي</th>
              <th>المنشأة</th>
              <th>الشركة الصانعة</th>
              <th>موديل الجهاز</th>
              <th>الشركة الموردة</th>
              <th>رقم المسؤول</th>
              <th>إيميل المسؤول</th>
              <th>تاريخ التوريد</th>
              <th>تاريخ التركيب</th>
              <th>مدة الضمان</th>
              <th>الحالة</th>
              <th>حالة الضمان</th>
              <th>عداد عمر الجهاز</th>
              <th>عدد الأعطال</th>
              <th>الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAssets.map(asset => `
              <tr>
                <td>${asset.deviceName || '-'}</td>
                <td>${asset.serialNumber || '-'}</td>
                <td>${asset.facilityName || '-'}</td>
                <td>${asset.manufacturer || '-'}</td>
                <td>${asset.deviceModel || '-'}</td>
                <td>${asset.supplierName || '-'}</td>
                <td>${asset.supplierContact || '-'}</td>
                <td>${asset.supplierEmail || '-'}</td>
                <td>${asset.deliveryDate || '-'}</td>
                <td>${asset.installationDate || '-'}</td>
                <td>${asset.warrantyPeriod || '-'}</td>
                <td>
                  <span class="${asset.deviceStatus === 'يعمل' ? 'status-active' : 'status-inactive'}">
                    ${asset.deviceStatus}
                  </span>
                </td>
                <td>
                  <span class="${asset.warrantyActive === 'no' ? 'warranty-inactive' : 'warranty-active'}">
                    ${asset.warrantyActive === 'no' ? 'غير مشمول بالضمان' : asset.warrantyStatus}
                  </span>
                </td>
                <td>${asset.deviceAge || '-'}</td>
                <td>${asset.malfunctionCount || 0}</td>
                <td>${asset.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">جميع الأصول - الجرد</h1>
        <p className="text-muted-foreground mt-2">إدارة وتتبع جميع الأجهزة والأصول</p>
      </div>

      {/* Add New Asset Form */}
      <div className="admin-card print:hidden">
        <div className="admin-header">
          <h2>إضافة جهاز جديد</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
           {/* Device Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اسم الجهاز *</label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="اسم الجهاز"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الرقم التسلسلي *</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="الرقم التسلسلي"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اسم المنشأة *</label>
                <select
                  value={formData.facilityName}
                  onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  required
                >
                  <option value="">اختر المنشأة</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.name}>{facility.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اسم الشركة الموردة</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="اسم الشركة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">رقم المسؤول بالشركة</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="رقم الهاتف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">إيميل المسؤول</label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierEmail: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="البريد الإلكتروني"
                />
              </div>
            </div>

            {/* Device Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">موديل الجهاز</label>
                <input
                  type="text"
                  value={formData.deviceModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceModel: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="الموديل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الشركة الصانعة</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  placeholder="الشركة الصانعة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التوريد</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">تاريخ التركيب</label>
                <input
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, installationDate: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">مدة الضمان (سنوات)</label>
                <select
                  value={formData.warrantyPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyPeriod: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                >
                  <option value="">اختر المدة</option>
                  <option value="1">سنة واحدة</option>
                  <option value="2">سنتان</option>
                  <option value="3">3 سنوات</option>
                  <option value="4">4 سنوات</option>
                  <option value="5">5 سنوات</option>
                  <option value="6">6 سنوات</option>
                  <option value="7">7 سنوات</option>
                  <option value="8">8 سنوات</option>
                  <option value="9">9 سنوات</option>
                  <option value="10">10 سنوات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة الجهاز</label>
                <select
                  value={formData.deviceStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceStatus: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                >
                  <option value="يعمل">يعمل</option>
                  <option value="مكهن">مكهن (خارج الخدمة)</option>
                </select>
              </div>
            </div>

            {/* Image Upload and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">شهادة التكهين (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-3 border border-input rounded-md text-right"
                />
                {previewImage && (
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="معاينة الشهادة" 
                      className="w-32 h-32 object-cover rounded-md border border-input cursor-pointer"
                      onClick={() => setImagePreview({ isOpen: true, url: previewImage, title: 'معاينة شهادة التكهين' })}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-right">ملاحظات الجهاز</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-input rounded-md text-right"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit" 
                disabled={submitting}
                className="admin-btn-success flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {submitting ? 'جاري الحفظ...' : 'حفظ الجهاز'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Assets Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="admin-card">
          <div className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary">{filteredAssets.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي الأجهزة</div>
          </div>
        </div>
        <div className="admin-card">
          <div className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-success">
              {filteredAssets.filter(asset => asset.deviceStatus === 'يعمل').length}
            </div>
            <div className="text-sm text-muted-foreground">أجهزة تعمل</div>
          </div>
        </div>
        <div className="admin-card">
          <div className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-danger">
              {filteredAssets.filter(asset => asset.deviceStatus === 'مكهن').length}
            </div>
            <div className="text-sm text-muted-foreground">أجهزة مكهنة</div>
          </div>
        </div>
        <div className="admin-card">
          <div className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-warning">
              {filteredAssets.filter(asset => asset.warrantyStatus === 'تحت الضمان' && asset.warrantyActive !== 'no').length}
            </div>
            <div className="text-sm text-muted-foreground">تحت الضمان</div>
          </div>
        </div>
        <div className="admin-card">
          <div className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-500">
              {filteredAssets.length - filteredAssets.filter(asset => asset.warrantyStatus === 'تحت الضمان' && asset.warrantyActive !== 'no').length}
            </div>
            <div className="text-sm text-muted-foreground">خارج الضمان</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="admin-card">
        <div className="admin-header">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h2>قائمة الأصول</h2>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="admin-btn-info text-xs md:text-sm px-3 py-2 flex items-center gap-1"
              >
                <Filter size={14} />
                فلترة البيانات
              </button>
              <button 
                onClick={exportToExcel}
                className="admin-btn-success text-xs md:text-sm px-3 py-2"
              >
                <Download size={14} className="ml-1" />
                تصدير Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="admin-btn-primary text-xs md:text-sm px-3 py-2"
              >
                <Download size={14} className="ml-1" />
                تصدير PDF
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-accent/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">اختيار المنشأة</label>
                <select
                  value={filters.facility}
                  onChange={(e) => setFilters(prev => ({ ...prev, facility: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                >
                  <option value="">جميع المنشآت</option>
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.name}>{facility.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة الجهاز</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                >
                  <option value="">جميع الأجهزة</option>
                  <option value="working">الأجهزة التي تعمل</option>
                  <option value="broken">الأجهزة المكهنة</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-right">حالة الضمان</label>
                <select
                  value={filters.warranty}
                  onChange={(e) => setFilters(prev => ({ ...prev, warranty: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                >
                  <option value="">جميع الأجهزة</option>
                  <option value="under_warranty">الأجهزة تحت الضمان</option>
                  <option value="out_of_warranty">الأجهزة خارج الضمان</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-right">الشركات الموردة</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full p-2 border border-input rounded-md text-right text-sm"
                >
                  <option value="">جميع الشركات</option>
                  {getUniqueSuppliers().map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 justify-start">
              <button 
                onClick={clearFilters}
                className="admin-btn-secondary text-sm px-4 py-2"
              >
                إزالة جميع الفلاتر
              </button>
            </div>
          </div>
        )}

        {/* Device Name Search - Above Table */}
        <div className="p-4 border-b border-border">
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2 text-right">بحث بإسم الجهاز</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={deviceNameSearch}
                onChange={(e) => setDeviceNameSearch(e.target.value)}
                placeholder="ابحث عن الجهاز..."
                className="w-full pr-10 pl-3 py-2 border border-input rounded-md text-right"
              />
            </div>
          </div>
        </div>

        <div className="p-2 md:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="mr-3">جاري التحميل...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-danger mb-3" />
              <h3 className="text-lg font-medium mb-2">خطأ في تحميل البيانات</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadData} variant="outline">
                إعادة المحاولة
              </Button>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-muted rounded-full p-3 mb-4">
                <Save className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {assets.length === 0 ? 'لا توجد أصول' : 'لا توجد نتائج'}
              </h3>
              <p className="text-muted-foreground">
                {assets.length === 0 
                  ? 'لم يتم العثور على أي أجهزة في النظام. ابدأ بإضافة جهاز جديد.'
                  : 'لم يتم العثور على أجهزة تطابق معايير البحث المحددة.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-4 text-right">
                <p className="text-sm text-muted-foreground">
                  عرض {startIndex + 1} - {Math.min(endIndex, filteredAssets.length)} من أصل {filteredAssets.length} جهاز
                  {assets.length !== filteredAssets.length && ` (مفلتر من ${assets.length})`}
                </p>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {currentAssets.map((asset) => (
                  <div key={asset.id} className="bg-accent rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-right">{asset.deviceName}</h3>
                        <p className="text-sm text-muted-foreground text-right">{asset.facilityName}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <button 
                          onClick={() => setViewDialog({ isOpen: true, asset })}
                          className="p-2 text-info hover:bg-info/10 rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                        <EditAssetDialog 
                          asset={asset} 
                          onSave={handleAssetUpdate}
                          facilities={facilities}
                        />
                        {asset.image && (
                          <button 
                            onClick={() => setImagePreview({ 
                              isOpen: true, 
                              url: asset.image, 
                              title: `شهادة التكهين - ${asset.deviceName}` 
                            })}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors flex items-center gap-1"
                            title="عرض شهادة التكهين"
                          >
                            <ImageIcon size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintAsset(asset)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="طباعة"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(asset)}
                          className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          asset.deviceStatus === 'يعمل' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-danger text-danger-foreground'
                        }`}>
                          {asset.deviceStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                          asset.warrantyActive === 'no' 
                            ? 'bg-warning text-warning-foreground' 
                            : 'bg-success text-success-foreground'
                        }`}>
                          {asset.warrantyActive === 'no' && <span>⚠️</span>}
                          {asset.warrantyActive === 'no' ? 'غير مشمول بالضمان' : asset.warrantyStatus}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right space-y-1">
                        <div>الشركة: {asset.manufacturer || '-'}</div>
                        <div>الموديل: {asset.deviceModel || '-'}</div>
                        <div>الشركة الموردة: {asset.supplierName || '-'}</div>
                        <div>التوريد: {asset.deliveryDate || '-'}</div>
                        <div>التركيب: {asset.installationDate || '-'}</div>
                        <div>عمر الجهاز: {asset.deviceAge || '-'}</div>
                        <div>عدد الأعطال: {asset.malfunctionCount || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right">
                      <th className="p-3 text-right">اسم الجهاز</th>
                      <th className="p-3 text-right">الرقم التسلسلي</th>
                      <th className="p-3 text-right">المنشأة</th>
                      <th className="p-3 text-right">الشركة الصانعة</th>
                      <th className="p-3 text-right">موديل الجهاز</th>
                      <th className="p-3 text-right">الشركة الموردة</th>
                      <th className="p-3 text-right">تاريخ التوريد</th>
                      <th className="p-3 text-right">تاريخ التركيب</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-right">حالة الضمان</th>
                      <th className="p-3 text-right">عداد عمر الجهاز</th>
                      <th className="p-3 text-right">عدد الأعطال</th>
                      <th className="p-3 text-right">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssets.map((asset) => (
                      <tr key={asset.id} className="border-b border-border text-right hover:bg-accent/50 transition-colors">
                        <td className="p-3 font-medium">{asset.deviceName}</td>
                        <td className="p-3">{asset.serialNumber}</td>
                        <td className="p-3">{asset.facilityName}</td>
                        <td className="p-3">{asset.manufacturer || '-'}</td>
                        <td className="p-3">{asset.deviceModel || '-'}</td>
                        <td className="p-3">{asset.supplierName || '-'}</td>
                        <td className="p-3">{asset.deliveryDate || '-'}</td>
                        <td className="p-3">{asset.installationDate || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            asset.deviceStatus === 'يعمل' 
                              ? 'bg-success text-success-foreground' 
                              : 'bg-danger text-danger-foreground'
                          }`}>
                            {asset.deviceStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                            asset.warrantyActive === 'no' 
                              ? 'bg-warning text-warning-foreground' 
                              : 'bg-success text-success-foreground'
                          }`}>
                            {asset.warrantyActive === 'no' && <span>⚠️</span>}
                            {asset.warrantyActive === 'no' ? 'غير مشمول بالضمان' : asset.warrantyStatus}
                          </span>
                        </td>
                        <td className="p-3">{asset.deviceAge || '-'}</td>
                        <td className="p-3">{asset.malfunctionCount || 0}</td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            <button 
                              onClick={() => setViewDialog({ isOpen: true, asset })}
                              className="p-2 text-info hover:bg-info/10 rounded transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
                            </button>
                            <EditAssetDialog 
                              asset={asset} 
                              onSave={handleAssetUpdate}
                              facilities={facilities}
                            />
                            {asset.image && (
                              <button 
                                onClick={() => setImagePreview({ 
                                  isOpen: true, 
                                  url: asset.image, 
                                  title: `شهادة التكهين - ${asset.deviceName}` 
                                })}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors flex items-center gap-1 text-xs"
                                title="عرض شهادة التكهين"
                              >
                                <ImageIcon size={16} />
                                <span className="hidden lg:inline">عرض الشهادة</span>
                              </button>
                            )}
                            <button 
                              onClick={() => handlePrintAsset(asset)}
                              className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="طباعة"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              onClick={() => openDeleteDialog(asset)}
                              className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleAssetDelete}
        deviceName={deleteDialog.asset?.deviceName || ''}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={() => setImagePreview({ isOpen: false, url: '', title: '' })}
        imageUrl={imagePreview.url}
        title={imagePreview.title}
      />

      {/* View Asset Dialog */}
      {viewDialog.isOpen && viewDialog.asset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto text-right" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">تفاصيل الجهاز</h3>
              <button 
                onClick={() => setViewDialog({ isOpen: false, asset: null })}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-muted-foreground">اسم الجهاز:</label>
                  <p className="mt-1">{viewDialog.asset.deviceName}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">الرقم التسلسلي:</label>
                  <p className="mt-1">{viewDialog.asset.serialNumber}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">المنشأة:</label>
                  <p className="mt-1">{viewDialog.asset.facilityName}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">الشركة الصانعة:</label>
                  <p className="mt-1">{viewDialog.asset.manufacturer || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">موديل الجهاز:</label>
                  <p className="mt-1">{viewDialog.asset.deviceModel || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">اسم الشركة الموردة:</label>
                  <p className="mt-1">{viewDialog.asset.supplierName || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">رقم المسؤول:</label>
                  <p className="mt-1">{viewDialog.asset.supplierContact || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">إيميل المسؤول:</label>
                  <p className="mt-1">{viewDialog.asset.supplierEmail || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">تاريخ التوريد:</label>
                  <p className="mt-1">{viewDialog.asset.deliveryDate || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">تاريخ التركيب:</label>
                  <p className="mt-1">{viewDialog.asset.installationDate || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">مدة الضمان:</label>
                  <p className="mt-1">{viewDialog.asset.warrantyPeriod ? `${viewDialog.asset.warrantyPeriod} سنة` : '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">حالة الجهاز:</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                    viewDialog.asset.deviceStatus === 'يعمل' 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-danger text-danger-foreground'
                  }`}>
                    {viewDialog.asset.deviceStatus}
                  </span>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">حالة الضمان:</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                    viewDialog.asset.warrantyActive === 'no' 
                      ? 'bg-warning text-warning-foreground' 
                      : 'bg-success text-success-foreground'
                  }`}>
                    {viewDialog.asset.warrantyActive === 'no' && <span>⚠️</span>}
                    {viewDialog.asset.warrantyActive === 'no' ? 'غير مشمول بالضمان' : viewDialog.asset.warrantyStatus}
                  </span>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">عداد عمر الجهاز:</label>
                  <p className="mt-1">{viewDialog.asset.deviceAge || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground">عدد الأعطال:</label>
                  <p className="mt-1">{viewDialog.asset.malfunctionCount || 0}</p>
                </div>
              </div>

              {/* Image Section */}
              {viewDialog.asset.image && (
                <div>
                  <label className="font-medium text-muted-foreground">شهادة التكهين:</label>
                  <div className="mt-2">
                    <img 
                      src={viewDialog.asset.image} 
                      alt="شهادة التكهين"
                      className="w-32 h-32 object-cover rounded-md border border-input cursor-pointer"
                      onClick={() => setImagePreview({ 
                        isOpen: true, 
                        url: viewDialog.asset.image, 
                        title: `شهادة التكهين - ${viewDialog.asset.deviceName}` 
                      })}
                    />
                  </div>
                </div>
              )}
              
              {viewDialog.asset.notes && (
                <div>
                  <label className="font-medium text-muted-foreground">الملاحظات:</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{viewDialog.asset.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-start gap-3 mt-6">
              {viewDialog.asset.image && (
                <button 
                  onClick={() => setImagePreview({ 
                    isOpen: true, 
                    url: viewDialog.asset.image, 
                    title: `شهادة التكهين - ${viewDialog.asset.deviceName}` 
                  })}
                  className="admin-btn-info flex items-center gap-2 px-4 py-2"
                >
                  <ImageIcon size={16} />
                  عرض الشهادة
                </button>
              )}
              <button 
                onClick={() => handlePrintAsset(viewDialog.asset)}
                className="admin-btn-primary flex items-center gap-2 px-4 py-2"
              >
                <Printer size={16} />
                طباعة
              </button>
              <button 
                onClick={() => setViewDialog({ isOpen: false, asset: null })}
                className="admin-btn-secondary px-4 py-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
