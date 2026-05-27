import { ENGLISH_STOP_WORDS } from './stop-words';
import type { AnalyzeOptions, AnalyzeResult, FrequencyItem, NGramSize, TextStats } from './types';

/** 从文本中提取英文/数字词元（适配亚马逊关键词） */
function tokenizeLine(line: string, caseSensitive: boolean): string[] {
  const normalized = caseSensitive ? line : line.toLowerCase();
  const matches = normalized.match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/gi);
  if (!matches) return [];
  return matches.map((w) => (caseSensitive ? w : w.toLowerCase()));
}

function shouldKeepToken(token: string, excludeStopWords: boolean, caseSensitive: boolean): boolean {
  if (!token) return false;
  if (!excludeStopWords) return true;
  const key = caseSensitive ? token.toLowerCase() : token;
  return !ENGLISH_STOP_WORDS.has(key);
}

function buildNGrams(tokens: string[], size: NGramSize): string[] {
  if (tokens.length < size) return [];
  const phrases: string[] = [];
  for (let i = 0; i <= tokens.length - size; i += 1) {
    phrases.push(tokens.slice(i, i + size).join(' '));
  }
  return phrases;
}

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();
  if (!trimmed) {
    return { 字符数: 0, 单词数: 0, 句子数: 0 };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  let wordCount = 0;
  for (const line of lines) {
    wordCount += tokenizeLine(line, false).length;
  }

  return {
    字符数: trimmed.length,
    单词数: wordCount,
    句子数: lines.length,
  };
}

export function dedupeLines(text: string, caseSensitive: boolean): string {
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }

  return result.join('\n');
}

export function analyzeWordFrequency(text: string, options: AnalyzeOptions): AnalyzeResult {
  const stats = computeTextStats(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const frequencyMap = new Map<string, number>();

  for (const line of lines) {
    const tokens = tokenizeLine(line, options.caseSensitive).filter((token) =>
      shouldKeepToken(token, options.excludeStopWords, options.caseSensitive)
    );
    const phrases = buildNGrams(tokens, options.ngramSize);
    for (const phrase of phrases) {
      frequencyMap.set(phrase, (frequencyMap.get(phrase) ?? 0) + 1);
    }
  }

  const totalMatches = Array.from(frequencyMap.values()).reduce((sum, n) => sum + n, 0);
  const sorted = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, Math.max(1, options.topN));

  const items: FrequencyItem[] = sorted.map(([phrase, count], index) => ({
    rank: index + 1,
    phrase,
    count,
    percentage: totalMatches > 0 ? (count / totalMatches) * 100 : 0,
  }));

  return { stats, items, totalMatches };
}
