import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '小工具集合',
    template: '%s | 小工具集合',
  },
  description: '实用小工具集合，包含利润计算器等工具',
  keywords: [
    '小工具',
    '利润计算器',
    'Excel工具',
  ],
  authors: [{ name: 'Vibe Coding' }],
  generator: 'Vibe Coding',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev && <Inspector />}
        <div className="flex h-screen flex-col overflow-hidden">
          {/* 顶部导航栏 */}
          <Header />
          
          {/* 主体内容区 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧边栏 */}
            <Sidebar />
            
            {/* 右侧内容区 */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
