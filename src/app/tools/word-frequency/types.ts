export type NGramSize = 1 | 2 | 3;

export interface TextStats {
  字符数: number;
  单词数: number;
  句子数: number;
}

export interface FrequencyItem {
  rank: number;
  phrase: string;
  count: number;
  percentage: number;
}

export interface AnalyzeOptions {
  caseSensitive: boolean;
  excludeStopWords: boolean;
  ngramSize: NGramSize;
  topN: number;
}

export interface AnalyzeResult {
  stats: TextStats;
  items: FrequencyItem[];
  totalMatches: number;
}
