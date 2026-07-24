import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayoutTemplate from '@/components/templates/DashboardLayout';

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayoutTemplate>{children}</DashboardLayoutTemplate>
    </AuthGuard>
  );
}
