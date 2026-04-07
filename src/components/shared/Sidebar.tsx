'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

interface Tool {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const tools: Tool[] = [
  {
    name: 'AMZ利润快算',
    path: '/tools/profit-calculator',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    name: 'WB 利润快算',
    path: '/tools/wb-profit-calculator',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    name: '预留工具2',
    path: '/tools/future-tool-2',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`border-r bg-background transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* 折叠按钮 */}
        <div className="flex items-center justify-between border-b p-4">
          {!collapsed && <span className="font-semibold">工具导航</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1 hover:bg-muted"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* 工具列表 */}
        <nav className="flex-1 overflow-y-auto p-2">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              href={tool.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted ${
                pathname === tool.path ? 'bg-muted' : ''
              }`}
            >
              {tool.icon}
              {!collapsed && <span className="text-sm">{tool.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
