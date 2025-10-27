import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi, ApiError } from '@/lib/api';

export default function StaffLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.staffLogin({
        username: formData.username,
        password: formData.password,
      });

      // Store token and user data
      localStorage.setItem('staff_token', response.token);
      localStorage.setItem('staff_user', JSON.stringify(response.user));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في النظام",
        className: "text-right",
      });

      // Redirect to staff dashboard
      navigate('/');
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "خطأ في تسجيل الدخول",
        description: apiError.message || "تحقق من بيانات الدخول وحاول مرة أخرى",
        variant: "destructive",
        className: "text-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-green-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">تسجيل دخول الموظفين</CardTitle>
            <p className="text-gray-600 text-sm mt-2">الوصول إلى النظام الأساسي</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-right block font-medium text-gray-700">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="text-right pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block font-medium text-gray-700">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="text-right pr-10 pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                مدير النظام؟
                <a href="/admin/login" className="text-green-600 hover:text-green-800 font-medium mr-1">
                  تسجيل دخول المدراء
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-white/80 text-sm">
          <p>© 2025 تجمع الرياض الصحي الثاني - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
