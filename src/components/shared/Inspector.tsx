'use client';

import dynamic from 'next/dynamic';

// 只在开发环境动态导入 react-dev-inspector
const DevInspector = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('react-dev-inspector').then(mod => ({ default: mod.Inspector })))
  : () => null;

export function Inspector() {
  return <DevInspector />;
}
