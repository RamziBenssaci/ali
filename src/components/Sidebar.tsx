import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  ClipboardList, 
  Package, 
  ShoppingCart, 
  FileText, 
  HardDrive, 
  Menu, 
  X,
  Users,
  AlertCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'لوحة التحكم الرئيسية',
    href: '/',
    icon: BarChart3
  },
  {
    title: 'البلاغات',
    icon: AlertCircle,
    submenu: [
      { title: 'إنشاء بلاغ جديد', href: '/reports/new' },
      { title: 'قائمة البلاغات', href: '/reports/list' },
      { title: 'لوحة تحكم البلاغات', href: '/reports/dashboard' }
    ]
  },
  {
    title: 'التموين',
    icon: Package,
    submenu: [
      { title: 'المستودع', href: '/supply/warehouse' },
      { title: 'لوحة تحكم المستودع', href: '/supply/warehouse-dashboard' },
      { title: 'تقارير الصرف', href: '/supply/dispensing-reports' }
    ]
  },
  {
    title: 'الشراء المباشر',
    icon: ShoppingCart,
    submenu: [
      { title: 'إنشاء طلب شراء جديد', href: '/direct-purchase/new' },
      { title: 'متابعة مسار الطلبات', href: '/direct-purchase/track' },
      { title: 'التقارير', href: '/direct-purchase/reports' },
      { title: 'لوحة تحكم الشراء', href: '/direct-purchase/dashboard' }
    ]
  },
  {
    title: 'قسم عقود الأسنان',
    icon: Users,
    submenu: [
      { title: 'عقود الأسنان', href: '/dental/contracts' },
      { title: 'التقارير', href: '/dental/reports' },
      { title: 'لوحة تحكم', href: '/dental/dashboard' }
    ]
  },
  {
    title: 'قسم الأصول',
    icon: HardDrive,
    submenu: [
      { title: 'جميع الأصول - الجرد', href: '/dental/assets' },
      { title: 'لوحة تحكم الأصول', href: '/dental/assets-dashboard' }
    ]
  },
  {
    title: 'المعاملات الإدارية',
    icon: FileText,
    submenu: [
      { title: 'إنشاء معاملة جديدة', href: '/transactions/new' },
      { title: 'قائمة المعاملات', href: '/transactions/list' },
      { title: 'لوحة تحكم المعاملات', href: '/transactions/dashboard' }
    ]
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    submenu: [
      { title: 'إدارة المنشآت', href: '/settings/facilities' },
      { title: 'إعدادات المدير', href: '/settings/admin' },
      { title: 'إدارة الموظفين', href: '/settings/staff' }
    ]
  }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (title: string) => {
    setExpandedSubmenu(expandedSubmenu === title ? null : title);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-40 w-64 bg-card border-l border-border transform transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-primary text-right">
            نظام الإدارة المتكامل
          </h1>
          <p className="text-sm text-muted-foreground text-right">
            ادارة التشغيل بخدمات الاسنان
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2" dir="rtl">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className="w-full flex items-center justify-between p-3 text-right hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <item.icon size={20} />
                      <span>{item.title}</span>
                    </div>
                    <svg
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedSubmenu === item.title && "transform rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSubmenu === item.title && (
                    <div className="mr-6 mt-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive }) =>
                            cn(
                              "block p-2 text-sm rounded-md transition-colors text-right",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            )
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.href!}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center space-x-3 space-x-reverse p-3 rounded-md transition-colors text-right",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
