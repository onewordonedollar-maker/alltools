import type { AnalyzeResult, NGramSize } from './types';

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}

export function exportFrequencyToCsv(result: AnalyzeResult, ngramSize: NGramSize): void {
  const ngramLabel = ngramSize === 1 ? '单词' : ngramSize === 2 ? '双词' : '三词';

  const frequencyRows: (string | number)[][] = [
    ['排名', '词根', '词频', '占比(%)'],
    ...result.items.map((item) => [
      item.rank,
      item.phrase,
      item.count,
      Number(item.percentage.toFixed(1)),
    ]),
  ];

  const csvContent = rowsToCsv(frequencyRows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `词频统计_${ngramLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
