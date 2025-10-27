import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  subtitle 
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    danger: 'bg-danger text-danger-foreground',
    info: 'bg-info text-info-foreground'
  };

  return (
    <div className="admin-card">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-full",
            colorClasses[color]
          )}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}