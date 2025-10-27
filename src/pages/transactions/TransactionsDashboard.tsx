import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, TrendingDown, Loader2, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import { transactionsApi, reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
}

interface Facility {
  id: number;
  name: string;
}

interface DashboardData {
  transactions: Transaction[];
  statistics: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    overdue: number;
  };
  facilityBreakdown: Array<{
    facility: string;
    total: number;
    pending: number;
    completed: number;
    rejected: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  completionRate: number;
}

export default function TransactionsDashboard() {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [uniqueFacilities, setUniqueFacilities] = useState<string[]>([]);
  const [transactionStatuses, setTransactionStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [transactionsResponse, statusesResponse] = await Promise.all([
        transactionsApi.getTransactions().catch(error => ({
          success: false,
          data: [],
          message: error.message
        })),
        transactionsApi.getTransactionStatuses().catch(error => ({
          success: false,
          data: [],
          message: error.message
        }))
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setAllTransactions(transactionsResponse.data);
        
        // Extract unique facilities from transferredTo field
        const facilities = [...new Set(transactionsResponse.data.map(t => t.transferredTo))].filter(Boolean);
        setUniqueFacilities(facilities);
      } else {
        setAllTransactions([]);
        setUniqueFacilities([]);
        toast({
          title: "تعذر تحميل بيانات لوحة التحكم",
          description: transactionsResponse.message || "فشل في تحميل بيانات المعاملات",
          variant: "destructive"
        });
      }

      if (statusesResponse.success && statusesResponse.data) {
        setTransactionStatuses(statusesResponse.data);
      } else {
        setTransactionStatuses([
          'مفتوح تحت الاجراء',
          'منجز',
          'مرفوض'
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAllTransactions([]);
      setUniqueFacilities([]);
      setTransactionStatuses([]);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering based on selected facility
  const filteredTransactions = selectedFacility === '' 
    ? allTransactions 
    : allTransactions.filter(transaction => transaction.transferredTo === selectedFacility);

  // Calculate statistics based on filtered data
  const getFilteredStats = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0, overdue: 0, completionRate: 0 };
    }
    
    const total = filteredTransactions.length;
    const pending = filteredTransactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
    const completed = filteredTransactions.filter(t => t.status === 'منجز').length;
    const rejected = filteredTransactions.filter(t => t.status === 'مرفوض').length;
    
    // Calculate overdue (more than 21 days)
    const today = new Date();
    const overdue = filteredTransactions.filter(transaction => {
      const receiveDate = new Date(transaction.receiveDate);
      const daysDiff = Math.floor((today.getTime() - receiveDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 21 && transaction.status === 'مفتوح تحت الاجراء';
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, pending, completed, rejected, overdue, completionRate };
  };

  // Calculate facility breakdown
  const getFacilityBreakdown = () => {
    if (!allTransactions || allTransactions.length === 0) return [];
    
    return uniqueFacilities.map(facility => {
      const facilityTransactions = allTransactions.filter(t => t.transferredTo === facility);
      const total = facilityTransactions.length;
      const pending = facilityTransactions.filter(t => t.status === 'مفتوح تحت الاجراء').length;
      const completed = facilityTransactions.filter(t => t.status === 'منجز').length;
      const rejected = facilityTransactions.filter(t => t.status === 'مرفوض').length;
      
      return {
        facility,
        total,
        pending,
        completed,
        rejected
      };
    });
  };

  const stats = getFilteredStats();
  const facilityBreakdown = getFacilityBreakdown();

  // Export to PDF (Print)
  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      const statusBreakdown = transactionStatuses.map(status => ({
        status,
        count: filteredTransactions.filter(t => t.status === status).length
      }));

      const printContent = `
        <html dir="rtl">
          <head>
            <title>تقرير المعاملات الإدارية</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
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
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              .table th { background: #f5f5f5; font-weight: bold; }
              .overdue-alert { background: #fee; border: 2px solid #f44; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .overdue-number { font-size: 48px; font-weight: bold; color: #f44; }
              @media print { 
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .chart-section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير المعاملات الإدارية</h1>
              <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
              ${selectedFacility ? `<p>الجهة المحددة: ${selectedFacility}</p>` : '<p>جميع الجهات</p>'}
            </div>
            
            <div class="stats-grid">
              <div class="stat-card"><h3>إجمالي المعاملات</h3><p>${stats.total}</p></div>
              <div class="stat-card"><h3>تحت الإجراء</h3><p>${stats.pending}</p></div>
              <div class="stat-card"><h3>المعاملات المنجزة</h3><p>${stats.completed}</p></div>
              <div class="stat-card"><h3>المعاملات المرفوضة</h3><p>${stats.rejected}</p></div>
            </div>

            <div class="overdue-alert">
              <div class="overdue-number">${stats.overdue}</div>
              <div>معاملة متأخرة (أكثر من 3 أسابيع)</div>
            </div>

            <div class="chart-section">
              <div class="chart-title">توزيع المعاملات حسب الحالة</div>
              ${statusBreakdown.map(item => `
                <div class="chart-bar">
                  <div class="bar-label">${item.status}</div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${stats.total > 0 ? (item.count / stats.total * 100) : 0}%; background-color: ${item.status === 'منجز' ? '#10b981' : item.status === 'مرفوض' ? '#ef4444' : '#f59e0b'};">
                      ${stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%
                    </div>
                  </div>
                  <div class="bar-value">${item.count} معاملة</div>
                </div>
              `).join('')}
            </div>

            <div class="chart-section">
              <div class="chart-title">توزيع المعاملات حسب الجهات</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>الجهة</th>
                    <th>إجمالي المعاملات</th>
                    <th>تحت الإجراء</th>
                    <th>منجز</th>
                    <th>مرفوض</th>
                  </tr>
                </thead>
                <tbody>
                  ${facilityBreakdown.map(item => `
                    <tr>
                      <td>${item.facility}</td>
                      <td>${item.total}</td>
                      <td>${item.pending}</td>
                      <td>${item.completed}</td>
                      <td>${item.rejected}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="chart-section" style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px;">
              <div style="font-size: 48px; font-weight: bold; color: #10b981; margin-bottom: 10px;">
                ${stats.completionRate}%
              </div>
              <div style="font-size: 18px; color: #666;">معدل إنجاز المعاملات الإدارية</div>
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
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ في تصدير PDF",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const statusBreakdown = transactionStatuses.map(status => ({
        status,
        count: filteredTransactions.filter(t => t.status === status).length
      }));

      const summarySection = [
        'تقرير المعاملات الإدارية',
        `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
        selectedFacility ? `الجهة المحددة: ${selectedFacility}` : 'جميع الجهات',
        '',
        'الإحصائيات العامة',
        'إجمالي المعاملات,' + stats.total,
        'تحت الإجراء,' + stats.pending,
        'المعاملات المنجزة,' + stats.completed,
        'المعاملات المرفوضة,' + stats.rejected,
        'المعاملات المتأخرة,' + stats.overdue,
        'معدل الإنجاز,' + stats.completionRate + '%',
        '',
        'توزيع المعاملات حسب الحالة',
        'الحالة,العدد,النسبة المئوية'
      ];
      
      const statusSection = statusBreakdown.map(item => 
        `"${item.status}",${item.count},${stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : 0}%`
      );
      
      const facilitiesSection = [
        '',
        'توزيع المعاملات حسب الجهات',
        'الجهة,إجمالي المعاملات,تحت الإجراء,منجز,مرفوض',
        ...facilityBreakdown.map(item => 
          `"${item.facility}",${item.total},${item.pending},${item.completed},${item.rejected}`
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
        link.setAttribute('download', `transactions-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ في تصدير Excel",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-right">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة تحكم المعاملات الإدارية</h1>
          <p className="text-muted-foreground mt-2">إحصائيات ومعدلات الإنجاز للمعاملات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            disabled={exportLoading || loading}
            title="طباعة / تصدير PDF"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Printer className="h-4 w-4 ml-2" />}
            طباعة
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            disabled={exportLoading || loading}
            title="تصدير Excel"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileSpreadsheet className="h-4 w-4 ml-2" />}
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-header"><h2>التصفية</h2></div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-right"
              disabled={loading}
            >
              <option value="">
                {loading ? "جاري تحميل الجهات..." : "جميع الجهات"}
              </option>
              {uniqueFacilities.map((facility, index) => (
                <option key={index} value={facility}>{facility}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="responsive-grid">
        {loading ? (
          <div className="col-span-full">
            <div className="admin-card">
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <StatCard
              title="إجمالي المعاملات"
              value={stats.total}
              icon={AlertCircle}
              color="primary"
            />
            <StatCard
              title="تحت الإجراء"
              value={stats.pending}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="المعاملات المنجزة"
              value={stats.completed}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="المعاملات المرفوضة"
              value={stats.rejected}
              icon={XCircle}
              color="danger"
            />
          </>
        )}
      </div>

      {/* Overdue Transactions Alert */}
      <div className="admin-card">
        <div className="admin-header bg-danger text-danger-foreground">
          <h2>المعاملات المتأخرة</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل بيانات المعاملات المتأخرة...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-danger mb-2">
                {stats.overdue}
              </div>
              <div className="text-muted-foreground">
                معاملة متأخرة (أكثر من 3 أسابيع)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الحالة</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع المعاملات...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transactionStatuses.map(status => {
                const statusCount = filteredTransactions.filter(t => t.status === status).length;
                return (
                  <div key={status} className="stat-card">
                    <div className="stat-number">{statusCount}</div>
                    <div className="stat-label">{status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Facility Breakdown */}
      <div className="admin-card">
        <div className="admin-header"><h2>توزيع المعاملات حسب الجهات</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل توزيع الجهات...</p>
            </div>
          ) : (
            <>
              <div className="responsive-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right">
                      <th className="p-3">الجهة</th>
                      <th className="p-3">إجمالي المعاملات</th>
                      <th className="p-3">تحت الإجراء</th>
                      <th className="p-3">منجز</th>
                      <th className="p-3">مرفوض</th>
                    </tr>
                  </thead>
                  <tbody>
                     {facilityBreakdown.map((item, index) => (
                        <tr key={index} className="border-b border-border text-right">
                          <td className="p-3 font-medium">{item.facility}</td>
                          <td className="p-3">{item.total}</td>
                          <td className="p-3 text-warning">{item.pending}</td>
                          <td className="p-3 text-success">{item.completed}</td>
                          <td className="p-3 text-danger">{item.rejected}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {facilityBreakdown.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد جهات متاحة
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="admin-card">
        <div className="admin-header"><h2>معدل الإنجاز</h2></div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">جاري تحميل معدل الإنجاز...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-success">
                {stats.completionRate}%
              </div>
              <div className="text-muted-foreground">معدل إنجاز المعاملات الإدارية</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
