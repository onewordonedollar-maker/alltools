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
import { exportFrequencyToCsv } from './exporter';
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
    exportFrequencyToCsv(result, ngramSize);
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

      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        {/* 左侧：关键词输入 */}
        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="space-y-3 pb-3">
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
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={handleDedupe}>
                <ListFilter className="mr-1 h-3.5 w-3.5" />
                一键去重
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleClear}>
                <Eraser className="mr-1 h-3.5 w-3.5" />
                一键清空
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                <span className="text-muted-foreground">字符 </span>
                <span className="font-semibold text-primary">{result.stats.字符数}</span>
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span>
                <span className="text-muted-foreground">单词 </span>
                <span className="font-semibold text-primary">{result.stats.单词数}</span>
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span>
                <span className="text-muted-foreground">行数 </span>
                <span className="font-semibold text-primary">{result.stats.句子数}</span>
              </span>
              <span className="text-xs text-muted-foreground">（行数按非空行统计）</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="每行一条产品关键词，粘贴后自动统计词频&#10;例如：&#10;keurig reusable k cup&#10;kcup refillable coffee pod"
              className="min-h-[380px] w-full flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:min-h-0"
            />
          </CardContent>
        </Card>

        {/* 右侧：词频统计 */}
        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">词频统计</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={result.items.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                结果导出
              </Button>
            </div>
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
          <CardContent className="flex flex-1 flex-col pt-0">
            <div className="min-h-[380px] flex-1 overflow-y-auto rounded-md border lg:min-h-0">
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
  );
}
