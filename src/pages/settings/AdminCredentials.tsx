import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Settings, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiCall } from '@/lib/api';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  lastLogin: string;
  isActive: boolean;
  permissions: string[];
}

export default function AdminCredentials() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileData, setProfileData] = useState<AdminProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    lastLogin: '',
    isActive: true,
    permissions: []
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/profile', {
        method: 'GET'
      }, true, 'admin');

      if (response.success && response.data) {
        setProfileData({
          id: response.data.id.toString(),
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          role: response.data.role || '',
          lastLogin: response.data.lastLogin || '',
          isActive: true,
          permissions: response.data.permissions || []
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في جلب بيانات المدير",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setUpdating(true);
      const response = await apiCall('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
        })
      }, true, 'admin');

      if (response.success) {
        toast({
          title: "تم تحديث المعلومات الشخصية",
          description: "تم حفظ التغييرات بنجاح",
        });
        await fetchAdminProfile();
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث المعلومات الشخصية",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdating(true);
      const response = await apiCall('/admin/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          new_password: passwordData.newPassword
        })
      }, true, 'admin');

      if (response.success) {
        setPasswordData({ newPassword: '' });
        toast({
          title: "تم تغيير كلمة المرور",
          description: "تم تحديث كلمة المرور بنجاح",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: error.message || "فشل في تحديث كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل بيانات المدير...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-primary mb-2">إعدادات المدير</h1>
            <p className="text-muted-foreground">إدارة المعلومات الشخصية</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
            <CardDescription className="text-right">
              معلومات الحساب الأساسية ومعرفات الاتصال
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="text-right"
                />
              </div>
            </div>

            <Button onClick={handleProfileUpdate} className="w-full" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ المعلومات الشخصية'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Settings className="h-5 w-5" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="text-sm font-mono">{profileData.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">حالة الحساب</span>
                <Badge variant="default">نشط</Badge>
              </div>
              <Separator />
              <div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="h-5 w-5" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription className="text-right">
            تحديث كلمة المرور الخاصة بك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-right">
              يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل وتتضمن أحرف وأرقام ورموز خاصة
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="text-right pr-10"
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handlePasswordChange} className="w-full" disabled={updating || !passwordData.newPassword}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
