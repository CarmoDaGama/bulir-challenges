import { ProtectedLayoutShell } from '../../components/protected-layout-shell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutShell>{children}</ProtectedLayoutShell>;
}
