import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, Printer, Loader2, X, AlertTriangle, Settings, ArrowRightLeft, Save, Clock, Calendar } from 'lucide-react';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getFileType } from '@/lib/api';
import * as XLSX from 'xlsx';

interface Transaction {
  id: string;
  transactionNumber: string;
  receiveDate: string;
  subject: string;
  type: string;
  senderEntity: string;
  transferredTo: string;
  status: string;
  notes?: string;
  imagebase64?: string | null;
  pdfbase64?: string | null;
  creation_date?: string;
  creation_date_note?: string;
  contract_approval_date?: string;
  contract_approval_date_note?: string;
  contract_date?: string;
  contract_date_note?: string;
  contract_delivery_date?: string;
  contract_delivery_date_note?: string;
  rejection_date?: string;
  rejection_date_note?: string;
  histories?: TransactionHistory[];
}

interface TransactionHistory {
  id: string;
  transaction_id: string;
  date: string;
  from: string;
  to: string;
  notes: string;
  transferredBy: string;
}

interface Facility {
  id: number;
  name: string;
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
  const [statusFormData, setStatusFormData] = useState({
    newStatus: '',
    statusNote: '',
    statusDate: ''

  });
  const [transferFormData, setTransferFormData] = useState({
    transaction_id: '',
    date: '',
    from: '',
    to: '',
    notes: '',
    transferredBy: '',
    imagebase64: null as File | null,
    pdfbase64: null as File | null
  });
  const [transferImagePreview, setTransferImagePreview] = useState<string>('');
  const [transferPdfPreview, setTransferPdfPreview] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();

  // Updated transaction types
  const transactionTypes = [
    'خطاب',
    'ايميل',
    'معاملة الكترونية',
    'استفسار',
    'شكوى',
    'طلب',
    'اخرى'
  ];

  // Updated transaction statuses
  const transactionStatuses = [
    'مفتوح تحت الاجراء',
    'منجز',
    'مرفوض'
  ];

  // Fixed transfer destinations (removed API dependency)
  const transferDestinations = [
    'ادارة تشغيل خدمات الاسنان',
    'ادارة خدمات الاسنان',
    'إدارة صحة المجتمع',
    'إدارة مراكز الرعاية الأولية',
    'إدارة الرعاية الاكلينيكية',
    'إدارة التموين وسلاسل الامداد',
    'إدارة الشئون الهندسية',
    'إدارة الممتلكات',
    'إدارة تكنولوجيا الرعاية الصحية',
    'إدارة تقنية المعلومات',
    'إدارة الامن والسلامة',
    'إدارة التواصل المؤسسي',
    'إدارة المالية',
    'إدارة الموارد البشرية',
    'إدارة الشئون القانونية',
    'الصيانة العامة بالتجمع',
    'الصيانة الطبية بالتجمع',
    'إدارة المسح الاشعاعي',
    'إدارة مكافحة العدوى',
    'إدارة خدمات الاسنان',
    'إدارة الجودة بالتجمع',
    'الاسنان - اشراف المراكز الصحية',
    'الاسنان - اشراف خارج الرياض',
    'الاسنان - اشراف مراكز الشرق',
    'الاسنان - اشراف مراكز الشمال',
    'الاسنان - مكافحة العدوى',
    'الاسنان - الاشعة',
    'الاسنان - التثقيف الصحي',
    'الاسنان - التواصل المؤسسي',
    'الاسنان - الجودة',
    'الاسنان - مجمع شرق',
    'الاسنان - مجمع شمال',
    'الاسنان - المركز التخصصي',
    'الاسنان - مستشفى اليمامة',
    'الاسنان - مستشفى الأمير محمد',
    'الاسنان - مدينة الملك فهد',
    'قطاع رماح',
    'قطاع حوطة سدير',
    'قطاع الارطاوية',
    'قطاع تمير',
    'قطاع الغاط',
    'قطاع المجمعة',
    'قطاع الزلفي',
    'مراسلة خارج التجمع',
    'أخرى'
  ];

  // Status options for status update
  const statusOptions = [
    { value: 'مفتوح تحت الاجراء', label: 'مفتوح تحت الاجراء' },
    { value: 'منجز', label: 'منجز' },
    { value: 'مرفوض', label: 'مرفوض' }
  ];

  // Function to calculate delay days
  const calculateDelayDays = (creationDate: string, status: string) => {
    if (!creationDate || status === 'منجز' || status === 'مرفوض') {
      return null;
    }
    
    const created = new Date(creationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return delay days only if more than 21 days (3 weeks)
    return diffDays > 21 ? diffDays - 21 : 0;
  };

  // Delay Counter Component
  const DelayCounter = ({ transaction }: { transaction: Transaction }) => {
    const delayDays = calculateDelayDays(transaction.creation_date || transaction.receiveDate, transaction.status);
    
    if (delayDays === null || delayDays <= 0) {
      return null;
    }

    return (
      <div className="flex items-center justify-center">
        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-lg">
          <Clock size={12} />
          <span>{delayDays} يوم متأخر</span>
        </div>
      </div>
    );
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [transactionsResponse, facilitiesResponse] = await Promise.all([
        transactionsApi.getTransactions().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        reportsApi.getFacilities().catch(error => ({
          success: false,
          data: [],
          message: error.message
        }))
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      } else {
        setTransactions([]);
        toast({
          title: "تعذر تحميل المعاملات",
          description: transactionsResponse.message || "فشل في تحميل بيانات المعاملات",
          variant: "destructive"
        });
      }

      if (facilitiesResponse.success && facilitiesResponse.data) {
        setFacilities(facilitiesResponse.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setTransactions([]);
      setFacilities([]);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredTransactions = transactions.filter(transaction => {
    return (
      (searchTerm === '' || 
       transaction.subject.includes(searchTerm) || 
       transaction.transactionNumber.includes(searchTerm) ||
       transaction.senderEntity.includes(searchTerm)) &&
      (selectedFacility === '' || transaction.transferredTo === selectedFacility) &&
      (selectedType === '' || transaction.type === selectedType) &&
      (selectedStatus === '' || transaction.status === selectedStatus)
    );
  });

  // Modal handlers
  const openDeleteModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const openViewModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      transactionNumber: transaction.transactionNumber,
      receiveDate: transaction.receiveDate,
      subject: transaction.subject,
      type: transaction.type,
      senderEntity: transaction.senderEntity,
      transferredTo: transaction.transferredTo,
      status: transaction.status,
      notes: transaction.notes || '',
      imagebase64: transaction.imagebase64 || null,
      pdfbase64: transaction.pdfbase64 || null
    });
    setShowEditModal(true);
  };

  const openStatusModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setStatusFormData({
      newStatus: transaction.status,
      statusNote: '',
      statusDate: '' // Add this line
    });
    setShowStatusModal(true);
  };

  const openTransferModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransferFormData({
      transaction_id: transaction.id,
      date: new Date().toISOString().split('T')[0],
      from: transaction.transferredTo,
      to: '',
      notes: '',
      transferredBy: '',
      imagebase64: null,
      pdfbase64: null
    });
    setShowTransferModal(true);
  };

  const closeAllModals = () => {
    setShowDeleteModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowStatusModal(false);
    setShowTransferModal(false);
    setSelectedTransaction(null);
    setEditFormData({});
    setStatusFormData({ newStatus: '', statusNote: '' , statusDate: ''});
    setTransferFormData({
      transaction_id: '',
      date: '',
      from: '',
      to: '',
      notes: '',
      transferredBy: '',
      imagebase64: null,
      pdfbase64: null
    });
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const response = await transactionsApi.deleteTransaction(selectedTransaction.id);
      if (response.success) {
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
        toast({
          title: "تم حذف المعاملة",
          description: "تم حذف المعاملة بنجاح",
        });
        closeAllModals();
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.message || "فشل في حذف المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setIsUpdating(true);
      const response = await transactionsApi.updateTransaction(selectedTransaction.id, editFormData);
      
      if (response.success) {
        setTransactions(prev => prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, ...editFormData } as Transaction
            : t
        ));
        
        toast({
          title: "تم تحديث المعاملة",
          description: "تم تحديث المعاملة بنجاح",
        });
        closeAllModals();
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "فشل في تحديث المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction || !statusFormData.newStatus) return;

    try {
      setIsUpdating(true);
      
      // Make the actual API call to update transaction status
      const response = await transactionsApi.updateTransactionStatus(selectedTransaction.id, statusFormData);
      
      if (response.success) {
        // Update local state with the new status
        setTransactions(prev => prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, status: statusFormData.newStatus } as Transaction
            : t
        ));
        
        toast({
          title: "تم تحديث حالة المعاملة",
          description: "تم تحديث حالة المعاملة بنجاح",
        });
        closeAllModals();
        
        // Refresh data to get any additional updates from server
        fetchAllData();
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "فشل في تحديث حالة المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث حالة المعاملة",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setIsUpdating(true);
      
      // Pass File objects directly to API
      const dataToSubmit = {
        transaction_id: transferFormData.transaction_id,
        date: transferFormData.date,
        from: transferFormData.from,
        to: transferFormData.to,
        notes: transferFormData.notes,
        transferredBy: transferFormData.transferredBy,
        imagebase64: transferFormData.imagebase64 || undefined,
        pdfbase64: transferFormData.pdfbase64 || undefined
      };
      
      // Make the actual API call to create transfer history
      const response = await transactionsApi.createTransferHistory(dataToSubmit);
      
      if (response.success) {
        // Update the transaction's "transferredTo" field
        setTransactions(prev => prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, transferredTo: transferFormData.to } as Transaction
            : t
        ));
        
        toast({
          title: "تم تحويل المعاملة",
          description: "تم تحويل المعاملة بنجاح",
        });
        closeAllModals();
        
        // Refresh data to get updated histories
        fetchAllData();
      } else {
        toast({
          title: "خطأ في التحويل",
          description: response.message || "فشل في تحويل المعاملة",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "خطأ في التحويل",
        description: error.message || "فشل في تحويل المعاملة",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, imagebase64: file as any }));
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, pdfbase64: file as any }));
    }
  };

  const handleTransferImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTransferFormData(prev => ({ ...prev, imagebase64: file }));
      setTransferImagePreview(URL.createObjectURL(file));
    }
  };

  const handleTransferPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTransferFormData(prev => ({ ...prev, pdfbase64: file }));
      setTransferPdfPreview(file.name);
    }
  };

  const isImageFile = (base64Data: string): boolean => {
    return base64Data.startsWith('data:image/');
  };

  const isPdfUrl = (url: string): boolean => {
    // Treat any http(s) or blob URL as a non-base64 resource we can open directly
    return /^https?:\/\//.test(url) || url.startsWith('blob:');
  };

  const downloadFile = (base64Data: string, filename: string) => {
    try {
      const base64Content = base64Data.split(',')[1];
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      let mimeType = 'application/octet-stream';
      if (base64Data.startsWith('data:application/pdf')) {
        mimeType = 'application/pdf';
      } else if (base64Data.startsWith('data:image/')) {
        mimeType = base64Data.substring(5, base64Data.indexOf(';'));
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const openPdfFile = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions.map(transaction => ({
      'رقم المعاملة': transaction.transactionNumber,
      'تاريخ الاستلام': transaction.receiveDate,
      'موضوع المعاملة': transaction.subject,
      'النوع': transaction.type,
      'الجهة المرسلة': transaction.senderEntity,
      'المحولة إلى': transaction.transferredTo,
      'الحالة': transaction.status,
      'الملاحظات': transaction.notes || ''
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعاملات');
    XLSX.writeFile(wb, 'المعاملات_الإدارية.xlsx');
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "لا توجد معاملات لتصديرها",
        variant: "destructive"
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير المعاملات الإدارية</title>
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
          
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          .transactions-table th,
          .transactions-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          
          .transactions-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #495057;
          }
          
          .transactions-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          
          .status-open {
            background-color: #fff3cd;
            color: #856404;
          }
          
          .status-completed {
            background-color: #d1edff;
            color: #0c5460;
          }
          
          .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
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
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>تقرير المعاملات الإدارية</h1>
            <p>عدد المعاملات: ${filteredTransactions.length}</p>
          </div>

          <table class="transactions-table">
            <thead>
              <tr>
                <th>رقم المعاملة</th>
                <th>تاريخ الاستلام</th>
                <th>موضوع المعاملة</th>
                <th>النوع</th>
                <th>الجهة المرسلة</th>
                <th>المحولة إلى</th>
                <th>الحالة</th>
                <th>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(transaction => `
                <tr>
                  <td>${transaction.transactionNumber}</td>
                  <td>${transaction.receiveDate}</td>
                  <td>${transaction.subject}</td>
                  <td>${transaction.type}</td>
                  <td>${transaction.senderEntity}</td>
                  <td>${transaction.transferredTo}</td>
                  <td>
                    <span class="status-badge ${
                      transaction.status === 'مفتوح تحت الاجراء' ? 'status-open' :
                      transaction.status === 'منجز' ? 'status-completed' :
                      'status-rejected'
                    }">
                      ${transaction.status}
                    </span>
                  </td>
                  <td>${transaction.notes || 'لا توجد ملاحظات'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>تم طباعة هذا التقرير في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  };

  const handlePrintTransaction = (transaction: Transaction) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير معاملة إدارية - ${transaction.transactionNumber}</title>
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
          
          .status-open { background: #fff3cd; color: #856404; }
          .status-completed { background: #d1edff; color: #0c5460; }
          .status-rejected { background: #f8d7da; color: #721c24; }
          
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
            <h1>تقرير معاملة إدارية</h1>
            <p>رقم المعاملة: ${transaction.transactionNumber}</p>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>المعلومات الأساسية</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <label>رقم المعاملة</label>
                  <span>${transaction.transactionNumber}</span>
                </div>
                <div class="info-item">
                  <label>تاريخ الاستلام</label>
                  <span>${transaction.receiveDate}</span>
                </div>
                <div class="info-item">
                  <label>موضوع المعاملة</label>
                  <span>${transaction.subject}</span>
                </div>
                <div class="info-item">
                  <label>النوع</label>
                  <span>${transaction.type}</span>
                </div>
                <div class="info-item">
                  <label>الجهة المرسلة</label>
                  <span>${transaction.senderEntity}</span>
                </div>
                <div class="info-item">
                  <label>المحولة إلى</label>
                  <span>${transaction.transferredTo}</span>
                </div>
                <div class="info-item">
                  <label>الحالة</label>
                  <span class="status-badge ${
                    transaction.status === 'مفتوح تحت الاجراء' ? 'status-open' :
                    transaction.status === 'منجز' ? 'status-completed' :
                    'status-rejected'
                  }">${transaction.status}</span>
                </div>
                <div class="info-item">
                  <label>الملاحظات</label>
                  <span>${transaction.notes || 'لا توجد ملاحظات'}</span>
                </div>
              </div>
            </div>
          </div>

          ${transaction.histories && transaction.histories.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <h2>سجل التحويلات</h2>
            </div>
            <div class="section-content">
              ${transaction.histories.map(history => `
              <div class="timeline-item">
                <h4>تحويل بتاريخ ${history.date}</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>من</label>
                    <span>${history.from}</span>
                  </div>
                  <div class="timeline-field">
                    <label>إلى</label>
                    <span>${history.to}</span>
                  </div>
                  <div class="timeline-field">
                    <label>الملاحظات</label>
                    <span>${history.notes || 'لا توجد ملاحظات'}</span>
                  </div>
                  <div class="timeline-field">
                    <label>محول بواسطة</label>
                    <span>${history.transferredBy}</span>
                  </div>
                </div>
              </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-header">
              <h2>سجل حالات المعاملة</h2>
            </div>
            <div class="section-content">
              ${transaction.creation_date ? `
              <div class="timeline-item">
                <h4>تاريخ الإنشاء</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${transaction.creation_date}</span>
                  </div>
                  ${transaction.creation_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${transaction.creation_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${transaction.contract_approval_date ? `
              <div class="timeline-item">
                <h4>تاريخ الموافقة</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${transaction.contract_approval_date}</span>
                  </div>
                  ${transaction.contract_approval_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${transaction.contract_approval_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${transaction.contract_date ? `
              <div class="timeline-item">
                <h4>تاريخ التعاقد</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${transaction.contract_date}</span>
                  </div>
                  ${transaction.contract_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${transaction.contract_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${transaction.contract_delivery_date ? `
              <div class="timeline-item">
                <h4>تاريخ التسليم</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${transaction.contract_delivery_date}</span>
                  </div>
                  ${transaction.contract_delivery_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${transaction.contract_delivery_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              ${transaction.rejection_date ? `
              <div class="timeline-item">
                <h4>تاريخ الرفض</h4>
                <div class="timeline-content">
                  <div class="timeline-field">
                    <label>التاريخ</label>
                    <span>${transaction.rejection_date}</span>
                  </div>
                  ${transaction.rejection_date_note ? `
                  <div class="timeline-field">
                    <label>الملاحظة</label>
                    <span>${transaction.rejection_date_note}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="footer">
            <p>تم طباعة هذا التقرير في: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل المعاملات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <div className="text-right">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">قائمة المعاملات الإدارية</h1>
        <p className="text-muted-foreground mt-2">عرض وإدارة جميع المعاملات الإدارية</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b">
          <h2 className="font-semibold text-blue-900">البحث والتصفية</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-input rounded-md text-right"
              />
            </div>

            {/* Facility Filter */}
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الجهات</option>
              {transferDestinations.map((destination, index) => (
                <option key={index} value={destination}>{destination}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الأنواع</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
            >
              <option value="">جميع الحالات</option>
              {transactionStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>تصدير Excel</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-md transition-colors"
            >
              <Download size={14} />
              <span>تصدير PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border">
          <h2 className="font-semibold text-blue-900">المعاملات ({filteredTransactions.length})</h2>
        </div>
        
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
            {/* Transaction Header */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-blue-900">رقم المعاملة: {transaction.transactionNumber}</h3>
                <p className="text-sm text-gray-600 mt-1">{transaction.subject}</p>
              </div>
              <DelayCounter transaction={transaction} />
            </div>

            {/* Status Badge */}
            <div className="flex justify-start">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                transaction.status === 'مفتوح تحت الاجراء' ? 'bg-yellow-100 text-yellow-800' :
                transaction.status === 'منجز' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {transaction.status}
              </span>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-500 block">تاريخ الاستلام</span>
                  <span className="font-medium text-sm">{transaction.receiveDate}</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-gray-500 block mb-1">النوع</span>
                <span className="font-medium text-sm">{transaction.type}</span>
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-gray-500 block mb-1">الجهة المرسلة</span>
                <span className="font-medium text-sm">{transaction.senderEntity}</span>
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-gray-500 block mb-1">المحولة إلى</span>
                <span className="font-medium text-sm">{transaction.transferredTo}</span>
              </div>

              {transaction.notes && (
                <div className="border-t pt-2">
                  <span className="text-xs text-gray-500 block mb-1">الملاحظات</span>
                  <span className="font-medium text-sm">{transaction.notes}</span>
                </div>
              )}

              {/* File Attachments */}
              {(transaction.imagebase64 || transaction.pdfbase64) && (
                <div className="border-t pt-2">
                  <span className="text-xs text-gray-500 block mb-2">المرفقات</span>
                  <div className="flex gap-2">
                    {transaction.imagebase64 && (
                      <button
                        onClick={() => {
                          const imgWindow = window.open('');
                          if (imgWindow) {
                            imgWindow.document.write(`<html><head><title>صورة مرفقة</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${transaction.imagebase64}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></body></html>`);
                            imgWindow.document.close();
                          }
                        }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs"
                      >
                        <Eye size={14} />
                        <span>عرض الصورة</span>
                      </button>
                    )}
                    {transaction.pdfbase64 && (
                      <button
                        onClick={() => {
                          if (isPdfUrl(transaction.pdfbase64!)) {
                            openPdfFile(transaction.pdfbase64!);
                          } else {
                            downloadFile(transaction.pdfbase64!, `transaction_${transaction.id}_document.pdf`);
                          }
                        }}
                        className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-xs"
                      >
                        <Eye size={14} />
                        <span>عرض PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              <button 
                onClick={() => openViewModal(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors flex-1" 
              >
                <Eye size={12} />
                <span>عرض</span>
              </button>
              <button 
                onClick={() => openEditModal(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex-1" 
              >
                <Edit size={12} />
                <span>تعديل</span>
              </button>
              <button 
                onClick={() => openStatusModal(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md transition-colors flex-1" 
              >
                <Settings size={12} />
                <span>حالة</span>
              </button>
              <button 
                onClick={() => openTransferModal(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md transition-colors flex-1" 
              >
                <ArrowRightLeft size={12} />
                <span>تحويل</span>
              </button>
              <button 
                onClick={() => handlePrintTransaction(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors flex-1" 
              >
                <Printer size={12} />
                <span>طباعة</span>
              </button>
              <button 
                onClick={() => openDeleteModal(transaction)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors flex-1" 
              >
                <Trash2 size={12} />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
        
        {filteredTransactions.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
            {transactions.length === 0 ? 
              "لا توجد معاملات في النظام" : 
              "لا توجد معاملات تطابق معايير البحث"
            }
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">تأكيد الحذف</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                هل أنت متأكد من حذف المعاملة رقم <strong>{selectedTransaction.transactionNumber}</strong>؟
              </p>
              <p className="text-gray-600 text-sm mt-2">
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">تفاصيل المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-lg border">
                <h4 className="text-lg font-bold mb-4 text-right text-blue-800">المعلومات الأساسية</h4>
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">رقم المعاملة</label>
                    <p className="font-semibold text-lg bg-white p-2 rounded">{selectedTransaction.transactionNumber}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">تاريخ الاستلام</label>
                    <p className="font-medium bg-white p-2 rounded">{selectedTransaction.receiveDate}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">موضوع المعاملة</label>
                    <p className="font-medium bg-white p-2 rounded">{selectedTransaction.subject}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">النوع</label>
                    <p className="font-medium bg-white p-2 rounded">{selectedTransaction.type}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">الجهة المرسلة</label>
                    <p className="font-medium bg-white p-2 rounded">{selectedTransaction.senderEntity}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">المحولة إلى</label>
                    <p className="font-medium bg-white p-2 rounded">{selectedTransaction.transferredTo}</p>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-medium text-blue-600 mb-2">الحالة</label>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedTransaction.status === 'مفتوح تحت الاجراء' ? 'bg-yellow-100 text-yellow-800' :
                      selectedTransaction.status === 'منجز' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  {selectedTransaction.notes && (
                    <div className="text-right">
                      <label className="block text-sm font-medium text-blue-600 mb-2">الملاحظات</label>
                      <p className="font-medium bg-white p-2 rounded">{selectedTransaction.notes}</p>
                    </div>
                  )}

                  {/* File Attachments */}
                  {(selectedTransaction.imagebase64 || selectedTransaction.pdfbase64) && (
                    <div className="text-right">
                      <label className="block text-sm font-medium text-blue-600 mb-2">المرفقات</label>
                      <div className="bg-white p-2 rounded flex gap-2">
                        {selectedTransaction.imagebase64 && (
                          <button
                            onClick={() => {
                              const imgWindow = window.open('');
                              if (imgWindow) {
                                imgWindow.document.write(`<html><head><title>صورة مرفقة</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${selectedTransaction.imagebase64}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></body></html>`);
                                imgWindow.document.close();
                              }
                            }}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
                          >
                            <Eye size={16} />
                            <span>عرض الصورة</span>
                          </button>
                        )}
                        {selectedTransaction.pdfbase64 && (
                          <button
                            onClick={() => {
                              if (isPdfUrl(selectedTransaction.pdfbase64!)) {
                                openPdfFile(selectedTransaction.pdfbase64!);
                              } else {
                                downloadFile(selectedTransaction.pdfbase64!, `transaction_${selectedTransaction.id}_document.pdf`);
                              }
                            }}
                            className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg"
                          >
                            <Eye size={16} />
                            <span>عرض PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction History Section */}
              {selectedTransaction.histories && selectedTransaction.histories.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 sm:p-6 rounded-lg border">
                  <h4 className="text-lg font-bold mb-4 text-right text-purple-800">سجل التحويلات</h4>
                  <div className="space-y-4">
                    {selectedTransaction.histories.map((history, index) => (
                      <div key={index} className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-white rounded-lg border-r-4 border-purple-400">
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-purple-700 mb-2">تاريخ التحويل</label>
                          <p className="font-medium bg-gray-50 p-2 rounded">{history.date}</p>
                        </div>
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-purple-700 mb-2">من</label>
                          <p className="font-medium bg-gray-50 p-2 rounded">{history.from}</p>
                        </div>
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-purple-700 mb-2">إلى</label>
                          <p className="font-medium bg-gray-50 p-2 rounded">{history.to}</p>
                        </div>
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-purple-700 mb-2">محول بواسطة</label>
                          <p className="font-medium bg-gray-50 p-2 rounded">{history.transferredBy}</p>
                        </div>
                        {history.notes && (
                          <div className="text-right">
                            <label className="block text-sm font-semibold text-purple-700 mb-2">الملاحظات</label>
                            <p className="font-medium bg-gray-50 p-2 rounded">{history.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-lg border">
                <h4 className="text-xl font-bold mb-6 text-right text-indigo-800">سجل حالات المعاملة</h4>
                <div className="space-y-4">
                  
                  {/* Creation Date */}
                  {selectedTransaction.creation_date && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-blue-700 mb-2">تاريخ الإنشاء</label>
                        <p className="font-medium bg-white p-2 rounded">{selectedTransaction.creation_date}</p>
                      </div>
                      {selectedTransaction.creation_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-blue-700 mb-2">ملاحظة الإنشاء</label>
                          <p className="font-medium bg-white p-2 rounded">{selectedTransaction.creation_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Approval Date */}
                  {selectedTransaction.contract_approval_date && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-teal-50 rounded-lg border-r-4 border-teal-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-teal-700 mb-2">تاريخ الموافقة</label>
                        <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_approval_date}</p>
                      </div>
                      {selectedTransaction.contract_approval_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-teal-700 mb-2">ملاحظة الموافقة</label>
                          <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_approval_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Date */}
                  {selectedTransaction.contract_date && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-yellow-50 rounded-lg border-r-4 border-yellow-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-yellow-700 mb-2">تاريخ التعاقد</label>
                        <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_date}</p>
                      </div>
                      {selectedTransaction.contract_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-yellow-700 mb-2">ملاحظة التعاقد</label>
                          <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Date */}
                  {selectedTransaction.contract_delivery_date && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-emerald-50 rounded-lg border-r-4 border-emerald-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-emerald-700 mb-2">تاريخ اللإنجاز</label>
                        <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_delivery_date}</p>
                      </div>
                      {selectedTransaction.contract_delivery_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-emerald-700 mb-2">ملاحظة اللإنجاز</label>
                          <p className="font-medium bg-white p-2 rounded">{selectedTransaction.contract_delivery_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Date */}
                  {selectedTransaction.rejection_date && (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 bg-red-50 rounded-lg border-r-4 border-red-400">
                      <div className="text-right">
                        <label className="block text-sm font-semibold text-red-700 mb-2">تاريخ الرفض</label>
                        <p className="font-medium bg-white p-2 rounded">{selectedTransaction.rejection_date}</p>
                      </div>
                      {selectedTransaction.rejection_date_note && (
                        <div className="text-right">
                          <label className="block text-sm font-semibold text-red-700 mb-2">ملاحظة الرفض</label>
                          <p className="font-medium bg-white p-2 rounded">{selectedTransaction.rejection_date_note}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">تعديل المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم المعاملة
                  </label>
                  <input
                    type="text"
                    value={editFormData.transactionNumber || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      transactionNumber: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الاستلام
                  </label>
                  <input
                    type="date"
                    value={editFormData.receiveDate || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      receiveDate: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  موضوع المعاملة
                </label>
                <input
                  type="text"
                  value={editFormData.subject || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    النوع
                  </label>
                  <select
                    value={editFormData.type || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      type: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  >
                    <option value="">اختر النوع</option>
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    required
                  >
                    <option value="">اختر الحالة</option>
                    {transactionStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الجهة المرسلة
                  </label>
                  <input
                    type="text"
                    value={editFormData.senderEntity || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      senderEntity: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    placeholder="أدخل الجهة المرسلة"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المحولة إلى
                  </label>
                  <input
                    type="text"
                    value={editFormData.transferredTo || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      transferredTo: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                    placeholder="أدخل الجهة المحول لها"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الملاحظات
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                  rows={4}
                  placeholder="أدخل الملاحظات (اختياري)"
                />
              </div>
              
              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    صورة مرفقة
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  />
                  {editFormData.imagebase64 && (
                    <div className="mt-2 text-right">
                      <img src={editFormData.imagebase64} alt="Image Preview" className="max-w-[150px] max-h-[150px] object-contain border rounded-md" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملف PDF مرفق
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  />
                  {editFormData.pdfbase64 && (
                    <div className="mt-2 text-right">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Download size={16} />
                        <span className="text-sm">ملف PDF جاهز للإرفاق</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors order-2 sm:order-1"
                  disabled={isUpdating}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUpdating ? 'جاري التحديث...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">تعديل حالة المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleStatusUpdate} className="space-y-6">
              <div className="text-right bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-600 mb-2">الحالة الحالية</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedTransaction.status === 'مفتوح تحت الاجراء' ? 'bg-yellow-100 text-yellow-800' :
                  selectedTransaction.status === 'منجز' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">الحالة الجديدة *</label>
                <select
                  value={statusFormData.newStatus}
                  onChange={(e) => setStatusFormData(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                >
                  <option value="">اختر الحالة الجديدة</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
<div className="text-right">
  <label className="block text-sm font-semibold mb-3">إضافة التاريخ (اختياري)</label>
  <input
    type="date"
    value={statusFormData.statusDate}
    onChange={(e) => setStatusFormData(prev => ({ ...prev, statusDate: e.target.value }))}
    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
  />
</div>
              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">ملاحظة التحديث</label>
                <textarea
                  value={statusFormData.statusNote}
                  onChange={(e) => setStatusFormData(prev => ({ ...prev, statusNote: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows={4}
                  placeholder="ملاحظة حول تغيير الحالة..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-start gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={isUpdating || !statusFormData.newStatus}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 order-1"
                >
                  <Save size={18} />
                  {isUpdating ? 'جاري الحفظ...' : 'حفظ التحديث'}
                </button>
                <button 
                  type="button"
                  onClick={closeAllModals}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all order-2"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">تحويل المعاملة</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="space-y-6">
              <input
                type="hidden"
                value={transferFormData.transaction_id}
              />

              <div className="text-right bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-600 mb-2">المعاملة المراد تحويلها</label>
                <p className="font-semibold text-blue-800">
                  {selectedTransaction.transactionNumber} - {selectedTransaction.subject}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">تاريخ التحويل *</label>
                  <input
                    type="date"
                    value={transferFormData.date}
                    onChange={(e) => setTransferFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">محول بواسطة *</label>
                  <input
                    type="text"
                    value={transferFormData.transferredBy}
                    onChange={(e) => setTransferFormData(prev => ({ ...prev, transferredBy: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="اسم الشخص المحول"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">من *</label>
                  <input
                    type="text"
                    value={transferFormData.from}
                    onChange={(e) => setTransferFormData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right bg-gray-100"
                    readOnly
                  />
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">إلى *</label>
                  <input
                    type="text"
                    value={transferFormData.to}
                    onChange={(e) => setTransferFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="أدخل الجهة المحول إليها"
                    required
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="block text-sm font-semibold mb-3">ملاحظات التحويل</label>
                <textarea
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  rows={4}
                  placeholder="ملاحظة حول التحويل..."
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">صورة مرفقة</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTransferImageUpload}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  {transferImagePreview && (
                    <div className="mt-2 text-right">
                      <img src={transferImagePreview} alt="Image Preview" className="max-w-[150px] max-h-[150px] object-contain border rounded-md" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <label className="block text-sm font-semibold mb-3">ملف PDF مرفق</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleTransferPdfUpload}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  {transferPdfPreview && (
                    <div className="mt-2 text-right">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Download size={16} />
                        <span className="text-sm">{transferPdfPreview}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-start gap-3 pt-4">
                <button 
                  type="submit"
                  disabled={isUpdating || !transferFormData.to || !transferFormData.transferredBy}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 order-1"
                >
                  <ArrowRightLeft size={18} />
                  {isUpdating ? 'جاري التحويل...' : 'تحويل المعاملة'}
                </button>
                <button 
                  type="button"
                  onClick={closeAllModals}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all order-2"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
