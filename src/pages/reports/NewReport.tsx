import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Calendar, User, Building2, CheckCircle, Info, Loader2, Settings, Phone, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { reportsApi } from '@/lib/api';
import { dentalAssetsApi } from '@/lib/api';
const reportCategories = [
  { value: 'الصيانة الطبية', label: 'الصيانة الطبية' },
  { value: 'الصيانة العامة', label: 'الصيانة العامة' },
  { value: 'تقنية المعلومات', label: 'تقنية المعلومات' },
  { value: 'الامن والسلامة', label: 'الأمن والسلامة' },
  { value: 'التموين الطبي', label: 'التموين الطبي' },
  { value: 'اخرى', label: 'أخرى' }
];

const warrantyOptions = [
  { value: 'yes', label: 'نعم' },
  { value: 'no', label: 'لا' }
];

const reportStatus = [
  { value: 'مفتوح', label: 'مفتوح', color: 'bg-blue-100 text-blue-800' },
  { value: 'مغلق', label: 'مغلق', color: 'bg-green-100 text-green-800' },
  { value: 'مكهن', label: 'مكهن', color: 'bg-yellow-100 text-yellow-800' }
];

export default function NewReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [serialNumbersLoading, setSerialNumbersLoading] = useState(true);
  const [fetchingSerialNumber, setFetchingSerialNumber] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    facilityName: '',
    reportDate: new Date().toISOString().split('T')[0],
    reportTime: new Date().toTimeString().slice(0, 5),
    category: '',
    deviceName: '',
    serialNumber: '',
    problemDescription: '',
    underWarranty: '',
    repairCompany: '',
    contactNumber: '',
    email: '',
    reporterName: '',
    reporterContact: '',
    status: 'مفتوح',
    notes: ''
  });

  // Load facilities and serial numbers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load facilities
        const facilitiesResponse = await reportsApi.getFacilities();
        if (facilitiesResponse.success) {
          setFacilities(facilitiesResponse.data || []);
        } else {
          toast({
            title: "خطأ في تحميل المنشآت",
            description: facilitiesResponse.message,
            variant: "destructive"
          });
        }

        // Load assets for serial numbers
        const assetsResponse = await dentalAssetsApi.getAssets();
        if (assetsResponse.success) {
          // Extract unique serial numbers
          const uniqueSerialNumbers = [...new Set(
            assetsResponse.data
              ?.filter(asset => asset.serialNumber) // Filter out null/undefined serial numbers
              ?.map(asset => asset.serialNumber) || []
          )];
          setSerialNumbers(uniqueSerialNumbers);
        } else {
          toast({
            title: "خطأ في تحميل الأرقام التسلسلية",
            description: assetsResponse.message,
            variant: "destructive"
          });
        }
      } catch (error: any) {
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "فشل في تحميل البيانات المطلوبة",
          variant: "destructive"
        });
      } finally {
        setFacilitiesLoading(false);
        setSerialNumbersLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Fetch serial number when facility and device name are both selected
  useEffect(() => {
    const fetchSerialNumber = async () => {
      // Only fetch if both facility and device name are selected
      if (!formData.facilityName || !formData.deviceName) {
        return;
      }

      setFetchingSerialNumber(true);

      try {
        const response = await reportsApi.getSerialNumber(
          formData.facilityName,
          formData.deviceName
        );

        if (response.success && response.data?.serial_number) {
          // Auto-fill the serial number
          setFormData(prev => ({
            ...prev,
            serialNumber: response.data.serial_number
          }));
          
          toast({
            title: "تم العثور على الرقم التسلسلي",
            description: `الرقم التسلسلي: ${response.data.serial_number}`,
          });
        }
      } catch (error: any) {
        // Show a nice message if no serial number found
        if (error.status === 404) {
          toast({
            title: "لم يتم العثور على رقم تسلسلي",
            description: "لم يتم العثور على رقم تسلسلي لهذا الجهاز في المنشأة المحددة",
            variant: "default",
          });
        } else {
          // Don't show error for other cases, just log it
          console.log('Serial number fetch failed:', error);
        }
      } finally {
        setFetchingSerialNumber(false);
      }
    };

    fetchSerialNumber();
  }, [formData.facilityName, formData.deviceName, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    
    if (!formData.facilityName || !formData.category || !formData.deviceName || !formData.problemDescription) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        facility_id: formData.facilityName,
        report_date: formData.reportDate,
        report_time: formData.reportTime,
        category: formData.category,
        device_name: formData.deviceName,
        serial_number: formData.serialNumber,
        problem_description: formData.problemDescription,
        under_warranty: formData.underWarranty,
        repair_company: formData.repairCompany,
        contact_number: formData.contactNumber,
        email: formData.email,
        reporter_name: formData.reporterName,
        reporter_contact: formData.reporterContact,
        status: formData.status,
        notes: formData.notes
      };

      const response = await reportsApi.createReport(reportData);

      if (response.success) {
        toast({
          title: "تم إنشاء البلاغ بنجاح",
          description: "سيتم مراجعة البلاغ من قبل الفريق المختص",
        });

        // Reset form
        setFormData({
          facilityName: '',
          reportDate: new Date().toISOString().split('T')[0],
          reportTime: new Date().toTimeString().slice(0, 5),
          category: '',
          deviceName: '',
          serialNumber: '',
          problemDescription: '',
          underWarranty: '',
          repairCompany: '',
          contactNumber: '',
          email: '',
          reporterName: '',
          reporterContact: '',
          status: 'مفتوح',
          notes: ''
        });
      } else {
        toast({
          title: "خطأ في إنشاء البلاغ",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء البلاغ",
        description: error.message || "فشل في إرسال البلاغ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border border-primary/20">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-primary mb-2">إنشاء بلاغ جديد</h1>
          <p className="text-muted-foreground">
            قم بتعبئة النموذج أدناه لإنشاء بلاغ حادثة أو مشكلة في المنشأة الصحية
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <FileText className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
            <CardDescription className="text-right">
              معلومات عامة حول البلاغ والحادثة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. اسم المنشأة */}
            <div className="space-y-2">
              <Label htmlFor="facility">١- اسم المنشأة *</Label>
              {facilitiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="mr-2">جاري تحميل المنشآت...</span>
                </div>
              ) : (
                <Select value={formData.facilityName} onValueChange={(value) => handleInputChange('facilityName', value)}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر اسم المنشأة" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id.toString()}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 2. تاريخ إنشاء البلاغ + الوقت */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportDate">٢- تاريخ إنشاء البلاغ *</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => handleInputChange('reportDate', e.target.value)}
                  className="text-right"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportTime">الوقت *</Label>
                <Input
                  id="reportTime"
                  type="time"
                  value={formData.reportTime}
                  onChange={(e) => handleInputChange('reportTime', e.target.value)}
                  className="text-right"
                  required
                />
              </div>
            </div>

            {/* 3. تصنيف البلاغ */}
            <div className="space-y-2">
              <Label htmlFor="category">٣- تصنيف البلاغ *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر تصنيف البلاغ" />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. اسم الجهاز أو الصنف */}
            <div className="space-y-2">
              <Label htmlFor="deviceName">٤- اسم الجهاز أو الصنف *</Label>
              <Input
                id="deviceName"
                value={formData.deviceName}
                onChange={(e) => handleInputChange('deviceName', e.target.value)}
                placeholder="اسم الجهاز أو نوع الصنف"
                className="text-right"
                required
              />
            </div>

       {/* 5. الرقم التسلسلي */}
<div className="space-y-2">
  <Label htmlFor="serialNumber" className="flex items-center gap-2">
    ٥- الرقم التسلسلي (اختياري)
    {fetchingSerialNumber && (
      <Loader2 className="h-3 w-3 animate-spin text-primary" />
    )}
  </Label>
  <Input
    id="serialNumber"
    type="text"
    value={formData.serialNumber || ''}
    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
    placeholder="أدخل الرقم التسلسلي"
    className="text-right"
    disabled={fetchingSerialNumber}
  />
  {fetchingSerialNumber && (
    <p className="text-xs text-muted-foreground text-right">
      جاري البحث عن الرقم التسلسلي...
    </p>
  )}
</div>

            {/* 6. وصف مشكلة البلاغ */}
            <div className="space-y-2">
              <Label htmlFor="problemDescription">٦- وصف مشكلة البلاغ *</Label>
              <Textarea
                id="problemDescription"
                value={formData.problemDescription}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                placeholder="وصف مفصل للمشكلة أو العطل..."
                className="text-right min-h-[120px]"
                required
              />
            </div>

            {/* 7. هل الجهاز تحت الضمان */}
            <div className="space-y-2">
              <Label htmlFor="warranty">٧- هل الجهاز تحت الضمان؟</Label>
              <Select value={formData.underWarranty} onValueChange={(value) => handleInputChange('underWarranty', value)}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر حالة الضمان" />
                </SelectTrigger>
                <SelectContent>
                  {warrantyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Repair Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Building2 className="h-5 w-5" />
              معلومات جهة الإصلاح
            </CardTitle>
            <CardDescription className="text-right">
              معلومات الإدارة أو الشركة المختصة بالإصلاح
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 8. اسم الإدارة/الشركة */}
            <div className="space-y-2">
              <Label htmlFor="repairCompany">٨- اسم الإدارة / الشركة المختصة بالإصلاح</Label>
              <Input
                id="repairCompany"
                value={formData.repairCompany}
                onChange={(e) => handleInputChange('repairCompany', e.target.value)}
                placeholder="اسم الإدارة أو الشركة المسؤولة عن الإصلاح"
                className="text-right"
              />
            </div>

            {/* 9. رقم الاتصال + الإيميل */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  ٩- رقم الاتصال
                </Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="رقم الهاتف للتواصل"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  الإيميل
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporter Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="h-5 w-5" />
              معلومات المبلغ
            </CardTitle>
            <CardDescription className="text-right">
              معلومات الشخص الذي يقوم بالإبلاغ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 10. اسم المبلغ + رقم الاتصال */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName">١٠- اسم المبلغ</Label>
                <Input
                  id="reporterName"
                  value={formData.reporterName}
                  onChange={(e) => handleInputChange('reporterName', e.target.value)}
                  placeholder="الاسم الكامل للمبلغ"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterContact">رقم الاتصال</Label>
                <Input
                  id="reporterContact"
                  value={formData.reporterContact}
                  onChange={(e) => handleInputChange('reporterContact', e.target.value)}
                  placeholder="رقم جوال المبلغ"
                  className="text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status and Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Settings className="h-5 w-5" />
              حالة البلاغ والملاحظات
            </CardTitle>
            <CardDescription className="text-right">
              حالة البلاغ والملاحظات الإضافية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 11. حالة البلاغ */}
            <div className="space-y-2">
              <Label htmlFor="status">١١- حالة البلاغ</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر حالة البلاغ" />
                </SelectTrigger>
                <SelectContent>
                  {reportStatus.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 12. ملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="notes">١٢- ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية مهمة..."
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            إلغاء
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading} onClick={handleSubmit}>
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <CheckCircle className="ml-2 h-4 w-4" />
                إرسال البلاغ
              </>
            )}
          </Button>
        </div>
              </div>
    </div>
  );
}
