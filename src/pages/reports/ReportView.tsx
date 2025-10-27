import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, User, Phone, Mail, Building, Wrench, AlertCircle, FileText, Printer, Edit } from 'lucide-react';
import { mockReports, mockAssets } from '@/data/mockData';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [downtime, setDowntime] = useState(0);
  const [malfunctionCount, setMalfunctionCount] = useState(0);

  useEffect(() => {
    // Find the report by ID
    const foundReport = mockReports.find(r => r.id === id);
    if (foundReport) {
      setReport(foundReport);
      
      // Find related asset by serial number
      const relatedAsset = mockAssets.find(a => a.serialNumber === foundReport.serialNumber);
      if (relatedAsset) {
        setAsset(relatedAsset);
        setMalfunctionCount(relatedAsset.malfunctionCount);
      }

      // Calculate downtime from report date to current date (if open) or closure date
      const reportDate = new Date(foundReport.reportDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - reportDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDowntime(diffDays);
    }
  }, [id]);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">البلاغ غير موجود</h3>
          <p className="text-muted-foreground">لم يتم العثور على البلاغ المطلوب</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">عرض البلاغ {report.id}</h1>
          <p className="text-muted-foreground mt-2">تفاصيل البلاغ وحالة الجهاز</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/reports/list')}
            className="admin-btn-secondary flex items-center gap-2"
          >
            <ArrowRight size={16} />
            <span className="hidden sm:inline">العودة للقائمة</span>
            <span className="sm:hidden">عودة</span>
          </button>
          <button className="admin-btn-primary flex items-center gap-2">
            <Edit size={16} />
            <span className="hidden sm:inline">تعديل</span>
          </button>
          <button className="admin-btn-info flex items-center gap-2">
            <Printer size={16} />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* Report Status Card */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>حالة البلاغ</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{report.id}</div>
              <div className="text-sm text-muted-foreground">رقم البلاغ</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                report.status === 'مفتوح' ? 'text-warning' :
                report.status === 'مغلق' ? 'text-success' : 'text-danger'
              }`}>
                {report.status}
              </div>
              <div className="text-sm text-muted-foreground">الحالة الحالية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">{downtime}</div>
              <div className="text-sm text-muted-foreground">أيام التوقف</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{malfunctionCount}</div>
              <div className="text-sm text-muted-foreground">مرات التعطل</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Details */}
        <div className="admin-card">
          <div className="admin-header">
            <h2>تفاصيل البلاغ</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">المنشأة</div>
                <div className="text-muted-foreground">{report.facilityName}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">فئة البلاغ</div>
                <div className="text-muted-foreground">{report.category}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">نوع الجهاز</div>
                <div className="text-muted-foreground">{report.deviceType}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">تاريخ البلاغ</div>
                <div className="text-muted-foreground">{report.reportDate}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">وصف العطل</div>
                <div className="text-muted-foreground">{report.description}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="admin-card">
          <div className="admin-header">
            <h2>معلومات الجهاز</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">الرقم التسلسلي</div>
                <div className="text-muted-foreground">{report.serialNumber}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">حالة الضمان</div>
                <div className={`${report.warrantyStatus === 'تحت الضمان' ? 'text-success' : 'text-danger'}`}>
                  {report.warrantyStatus}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">المورد</div>
                <div className="text-muted-foreground">{report.supplierName}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="font-medium">رقم تواصل المورد</div>
                <div className="text-muted-foreground">{report.supplierContact}</div>
              </div>
            </div>

            {asset && (
              <>
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium">طراز الجهاز</div>
                    <div className="text-muted-foreground">{asset.deviceModel}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium">تاريخ التركيب</div>
                    <div className="text-muted-foreground">{asset.installationDate}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reporter Information */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>معلومات المبلغ والقسم المسؤول</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">المبلغ</h3>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">اسم المبلغ</div>
                  <div className="text-muted-foreground">{report.reporterName}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">رقم الهاتف</div>
                  <div className="text-muted-foreground">{report.reporterContact}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">البريد الإلكتروني</div>
                  <div className="text-muted-foreground">{report.reporterEmail}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-lg">القسم المسؤول</h3>
              
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">اسم القسم</div>
                  <div className="text-muted-foreground">{report.responsibleDept}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">رقم الهاتف</div>
                  <div className="text-muted-foreground">{report.deptContact}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">البريد الإلكتروني</div>
                  <div className="text-muted-foreground">{report.deptEmail}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="admin-card">
        <div className="admin-header">
          <h2>سجل الأحداث</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium">تم إنشاء البلاغ</div>
                <div className="text-sm text-muted-foreground">{report.reportDate}</div>
              </div>
            </div>
            
            {report.status === 'مكهن' && (
              <div className="flex items-center gap-4 p-4 bg-danger/10 rounded-lg">
                <div className="w-3 h-3 bg-danger rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="font-medium">تم تكهين الجهاز</div>
                  <div className="text-sm text-muted-foreground">بانتظار تحديد تاريخ التكهين</div>
                </div>
              </div>
            )}
            
            {report.status === 'مغلق' && (
              <div className="flex items-center gap-4 p-4 bg-success/10 rounded-lg">
                <div className="w-3 h-3 bg-success rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="font-medium">تم إغلاق البلاغ</div>
                  <div className="text-sm text-muted-foreground">بانتظار تحديد تاريخ الإغلاق</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}