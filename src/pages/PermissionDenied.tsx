import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PermissionDenied = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          غير مخول بالدخول
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          عذراً، ليس لديك الصلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المدير للحصول على الصلاحيات المطلوبة.
        </p>
        
        <button
          onClick={handleGoBack}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <ArrowRight className="w-5 h-5" />
          العودة للوحة التحكم الرئيسية
        </button>
      </div>
    </div>
  );
};

export default PermissionDenied;
