import { Space_Grotesk, Work_Sans } from 'next/font/google';
import { AuthProvider } from '../components/auth-provider';
import './global.css';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = Work_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Bulir Challenges Web',
  description: 'Web app para autenticação, serviços e transações.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
