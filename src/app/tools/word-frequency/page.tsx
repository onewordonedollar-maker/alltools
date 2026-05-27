'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Eraser, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { analyzeWordFrequency, dedupeLines } from './analyzer';
import { exportFrequencyToExcel } from './exporter';
import type { NGramSize } from './types';

const DEFAULT_TOP_N = 10;

export default function WordFrequencyPage() {
  const [text, setText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [excludeStopWords, setExcludeStopWords] = useState(true);
  const [ngramSize, setNgramSize] = useState<NGramSize>(1);
  const [topN, setTopN] = useState(DEFAULT_TOP_N);

  const result = useMemo(
    () =>
      analyzeWordFrequency(text, {
        caseSensitive,
        excludeStopWords,
        ngramSize,
        topN: Math.max(1, topN),
      }),
    [text, caseSensitive, excludeStopWords, ngramSize, topN]
  );

  const handleDedupe = () => {
    setText(dedupeLines(text, caseSensitive));
  };

  const handleClear = () => {
    setText('');
  };

  const handleExport = () => {
    if (result.items.length === 0) {
      alert('暂无词频数据可导出，请先粘贴关键词');
      return;
    }
    exportFrequencyToExcel(result, ngramSize, {
      caseSensitive,
      excludeStopWords,
      topN: Math.max(1, topN),
    });
  };

  const ngramLabel = ngramSize === 1 ? '一个单词' : ngramSize === 2 ? '两个单词' : '三个单词';

  return (
    <div className="min-h-full bg-slate-50/80 p-4 md:p-6">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          首页
        </Link>
        <span className="mx-2">/</span>
        <span>词频统计工具</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* 左侧：输入区 */}
        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">关键词输入</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
                <Label htmlFor="case-sensitive" className="cursor-pointer font-normal">
                  是否区分大小写
                </Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" onClick={handleDedupe}>
                <ListFilter className="mr-1 h-3.5 w-3.5" />
                一键去重
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleClear}>
                <Eraser className="mr-1 h-3.5 w-3.5" />
                一键清空
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="每行一条产品关键词，粘贴后自动统计词频&#10;例如：&#10;keurig reusable k cup&#10;kcup refillable coffee pod"
              className="min-h-[420px] w-full flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </CardContent>
        </Card>

        {/* 右侧：统计结果 */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">字符统计信息</CardTitle>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-primary"
                onClick={handleExport}
                disabled={!text.trim()}
              >
                <Download className="mr-1 h-4 w-4" />
                结果导出
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md border bg-background px-2 py-3">
                  <div className="text-muted-foreground">当前字符数</div>
                  <div className="mt-1 text-lg font-semibold text-primary">
                    {result.stats.字符数}
                  </div>
                </div>
                <div className="rounded-md border bg-background px-2 py-3">
                  <div className="text-muted-foreground">当前单词数</div>
                  <div className="mt-1 text-lg font-semibold text-primary">
                    {result.stats.单词数}
                  </div>
                </div>
                <div className="rounded-md border bg-background px-2 py-3">
                  <div className="text-muted-foreground">当前句子数</div>
                  <div className="mt-1 text-lg font-semibold text-primary">
                    {result.stats.句子数}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                句子数按非空行统计，适用于每行一条关键词的列表。
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-1 flex-col">
            <CardHeader className="space-y-3 pb-2">
              <CardTitle className="text-base">单词出现次数统计</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  id="exclude-stop-words"
                  checked={excludeStopWords}
                  onCheckedChange={setExcludeStopWords}
                />
                <Label htmlFor="exclude-stop-words" className="cursor-pointer font-normal">
                  排除语法词
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">前</span>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={topN}
                  onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-8 w-16 text-center"
                />
                <span className="text-muted-foreground">个</span>
              </div>
              <RadioGroup
                value={String(ngramSize)}
                onValueChange={(v) => setNgramSize(Number(v) as NGramSize)}
                className="flex flex-row flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="1" id="ngram-1" />
                  <Label htmlFor="ngram-1" className="cursor-pointer font-normal">
                    一个单词
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="2" id="ngram-2" />
                  <Label htmlFor="ngram-2" className="cursor-pointer font-normal">
                    两个单词
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="3" id="ngram-3" />
                  <Label htmlFor="ngram-3" className="cursor-pointer font-normal">
                    三个单词
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                当前统计：{ngramLabel} · 共 {result.totalMatches} 次匹配
              </p>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <div className="max-h-[360px] overflow-y-auto rounded-md border">
                {result.items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    粘贴关键词后将自动显示词频排行
                  </p>
                ) : (
                  <ol className="divide-y">
                    {result.items.map((item) => (
                      <li
                        key={`${item.rank}-${item.phrase}`}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
                      >
                        <span className="flex min-w-0 flex-1 items-baseline gap-2">
                          <span className="shrink-0 text-muted-foreground">{item.rank}.</span>
                          <span className="truncate font-medium">{item.phrase}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
