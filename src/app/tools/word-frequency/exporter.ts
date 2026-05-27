import * as XLSX from 'xlsx';
import type { AnalyzeResult, NGramSize } from './types';

export function exportFrequencyToExcel(
  result: AnalyzeResult,
  ngramSize: NGramSize,
  options: {
    caseSensitive: boolean;
    excludeStopWords: boolean;
    topN: number;
  }
): void {
  const ngramLabel = ngramSize === 1 ? '单词' : ngramSize === 2 ? '双词' : '三词';

  const summaryRows: (string | number)[][] = [
    ['词频统计导出'],
    [],
    ['统计项', '数值'],
    ['当前字符数', result.stats.字符数],
    ['当前单词数', result.stats.单词数],
    ['当前句子数', result.stats.句子数],
    [],
    ['分析设置', ''],
    ['N-gram', ngramLabel],
    ['区分大小写', options.caseSensitive ? '是' : '否'],
    ['排除语法词', options.excludeStopWords ? '是' : '否'],
    ['显示前 N 项', options.topN],
  ];

  const frequencyRows: (string | number)[][] = [
    ['排名', '词组', '出现次数', '占比(%)'],
    ...result.items.map((item) => [
      item.rank,
      item.phrase,
      item.count,
      Number(item.percentage.toFixed(1)),
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), '统计概览');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(frequencyRows), '词频明细');

  const fileName = `词频统计_${ngramLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
