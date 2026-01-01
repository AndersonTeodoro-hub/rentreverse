import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-app-premium relative">
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
