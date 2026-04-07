import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-4xl space-y-8">
        {/* 欢迎标题 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">欢迎使用跨境工具合集</h1>
          <p className="text-lg text-muted-foreground">
            亚马逊选品/运营重要提效小工具合集
          </p>
        </div>

        {/* 工具卡片 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 利润计算器卡片 */}
          <Link href="/tools/profit-calculator">
            <div className="group rounded-lg border p-6 transition-all hover:border-primary hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">选品利润快算</h3>
                    <p className="text-sm text-muted-foreground">
                      上传Excel表格，快速计算产品利润，支持多维度费用分析和导出
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <Button className="mt-4 w-full" variant="outline">
                立即使用
              </Button>
            </div>
          </Link>

          {/* 预留工具卡片 */}
          <div className="rounded-lg border border-dashed p-6 opacity-50">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">更多工具</h3>
                <p className="text-sm text-muted-foreground">
                  敬请期待更多实用工具...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
