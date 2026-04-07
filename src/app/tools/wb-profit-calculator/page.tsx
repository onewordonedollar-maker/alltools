'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import type { WBProfitData } from './types';
import { DEFAULT_VALUES } from './types';
import { parseSourceExcel, batchCalculateWBProfit, parseCommissionRateExcel, type CommissionRateMap } from './calculator';
import { exportWBProfitTable } from './exporter';

export default function WBProfitCalculatorPage() {
  const [data, setData] = useState<WBProfitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [commissionFileName, setCommissionFileName] = useState<string>('');
  const [commissionMap, setCommissionMap] = useState<CommissionRateMap | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commissionFileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const bottomScrollbarRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState('0px');

  // 全局设置
  const [globalSettings, setGlobalSettings] = useState({
    汇率: DEFAULT_VALUES.汇率,
    头程单价: DEFAULT_VALUES.头程单价,
  });

  // 获取实时汇率
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();

        if (data.success && data.rate) {
          setGlobalSettings(prev => ({
            ...prev,
            汇率: parseFloat(data.rate.toFixed(4))
          }));
        }
      } catch (error) {
        console.error('获取汇率失败，使用默认值:', error);
      }
    };

    fetchExchangeRate();
  }, []);

  // 同步滚动条与表格滚动
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const topScrollbar = topScrollbarRef.current;
    const bottomScrollbar = bottomScrollbarRef.current;

    if (!tableContainer || !topScrollbar || !bottomScrollbar) return;

    // 更新滚动条宽度
    const updateScrollbarWidth = () => {
      const scrollWidth = `${tableContainer.scrollWidth}px`;
      setTableScrollWidth(scrollWidth);

      const innerTop = topScrollbar.querySelector('div');
      const innerBottom = bottomScrollbar.querySelector('div');
      if (innerTop) innerTop.style.width = scrollWidth;
      if (innerBottom) innerBottom.style.width = scrollWidth;
    };

    updateScrollbarWidth();
    window.addEventListener('resize', updateScrollbarWidth);

    // 同步滚动函数
    const syncScroll = (source: HTMLElement) => {
      const scrollLeft = source.scrollLeft;
      tableContainer.scrollLeft = scrollLeft;
      if (source !== topScrollbar) topScrollbar.scrollLeft = scrollLeft;
      if (source !== bottomScrollbar) bottomScrollbar.scrollLeft = scrollLeft;
    };

    const handleTableScroll = () => syncScroll(tableContainer);
    const handleTopScroll = () => syncScroll(topScrollbar);
    const handleBottomScroll = () => syncScroll(bottomScrollbar);

    tableContainer.addEventListener('scroll', handleTableScroll);
    topScrollbar.addEventListener('scroll', handleTopScroll);
    bottomScrollbar.addEventListener('scroll', handleBottomScroll);

    return () => {
      window.removeEventListener('resize', updateScrollbarWidth);
      tableContainer.removeEventListener('scroll', handleTableScroll);
      topScrollbar.removeEventListener('scroll', handleTopScroll);
      bottomScrollbar.removeEventListener('scroll', handleBottomScroll);
    };
  }, [data]);

  // 数据变化时更新滚动条宽度
  useEffect(() => {
    const timer = setTimeout(() => {
      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      const scrollWidth = `${tableContainer.scrollWidth}px`;
      setTableScrollWidth(scrollWidth);

      const topScrollbar = topScrollbarRef.current;
      const bottomScrollbar = bottomScrollbarRef.current;

      if (topScrollbar) {
        const inner = topScrollbar.querySelector('div');
        if (inner) inner.style.width = scrollWidth;
      }
      if (bottomScrollbar) {
        const inner = bottomScrollbar.querySelector('div');
        if (inner) inner.style.width = scrollWidth;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const sourceData = await parseSourceExcel(file);

      if (sourceData.length === 0) {
        setError('导入的Excel文件中没有有效数据，请检查文件格式');
        setLoading(false);
        return;
      }

      // 批量计算利润（佣金率自动匹配）
      const calculatedData = batchCalculateWBProfit(
        sourceData,
        { ...globalSettings, 平台佣金率: undefined }, // 不传递全局佣金率，使用自动匹配
        commissionMap || undefined
      );
      setData(calculatedData);

      // 统计未匹配的数量
      const unmatchedCount = calculatedData.filter(item => !item.佣金率匹配成功).length;
      if (unmatchedCount > 0) {
        setSuccessMessage(`成功导入 ${calculatedData.length} 条数据，${unmatchedCount} 条类目未匹配佣金率（显示0%，已标红）`);
      } else {
        setSuccessMessage(`成功导入 ${calculatedData.length} 条数据，所有类目均匹配成功`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请检查文件格式');
    } finally {
      setLoading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理佣金率文件上传
  const handleCommissionFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const map = await parseCommissionRateExcel(file);

      if (map.russianMap.size === 0 && map.chineseMap.size === 0) {
        setError('佣金率Excel文件中没有有效数据');
        setLoading(false);
        return;
      }

      setCommissionFileName(file.name);
      setCommissionMap(map);

      // 如果已有数据，重新计算
      if (data.length > 0) {
        const recalculatedData = batchCalculateWBProfit(
          data.map(item => ({
            主图: item.主图,
            类目: item.类目,
            标题: item.标题,
            详情页地址: item.详情页地址,
            品牌: item.品牌,
            售价卢布: item.售价卢布,
            产品成本RMB: item.产品成本RMB,
            FBW配送费: item.FBW配送费 / item.汇率, // 转换回卢布
            毛重KG: item.毛重KG,
            包装长cm: item.包装长cm,
            包装宽cm: item.包装宽cm,
            包装高cm: item.包装高cm,
          })),
          globalSettings,
          map
        );
        setData(recalculatedData);

        // 统计未匹配的数量
        const unmatchedCount = recalculatedData.filter(item => !item.佣金率匹配成功).length;
        if (unmatchedCount > 0) {
          setSuccessMessage(`佣金率表已加载（${map.russianMap.size + map.chineseMap.size}条），${unmatchedCount} 条类目未匹配，显示0%并标红`);
        } else {
          setSuccessMessage(`佣金率表已加载（${map.russianMap.size + map.chineseMap.size}条），所有类目均匹配成功`);
        }
      } else {
        setSuccessMessage(`佣金率表已加载（${map.russianMap.size + map.chineseMap.size}条）`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '佣金率文件导入失败，请检查文件格式');
    } finally {
      setLoading(false);
      // 重置文件输入
      if (commissionFileInputRef.current) {
        commissionFileInputRef.current.value = '';
      }
    }
  };

  // 成功提示自动消失
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 应用全局设置到所有行
  const applyGlobalSettings = () => {
    if (data.length === 0) return;

    const updatedData = batchCalculateWBProfit(
      data.map(item => ({
        主图: item.主图,
        类目: item.类目,
        标题: item.标题,
        详情页地址: item.详情页地址,
        品牌: item.品牌,
        售价卢布: item.售价卢布,
        产品成本RMB: item.产品成本RMB,
        FBW配送费: item.FBW配送费 / item.汇率, // 转换回卢布
        毛重KG: item.毛重KG,
        包装长cm: item.包装长cm,
        包装宽cm: item.包装宽cm,
        包装高cm: item.包装高cm,
      })),
      { ...globalSettings, 平台佣金率: undefined }, // 不传递全局佣金率，使用自动匹配
      commissionMap || undefined
    );
    setData(updatedData);
  };

  // 更新单行数据（鼠标移开后自动计算）
  const handleInputChange = (id: number, field: keyof WBProfitData, value: number) => {
    // 只更新显示值，不触发计算
    setData(prevData => prevData.map(item => {
      if (item.id !== id) return item;

      // 平台佣金率：输入的是百分数，需要转换为小数存储
      if (field === '平台佣金率') {
        return { ...item, [field]: value / 100 };
      }

      return { ...item, [field]: value };
    }));
  };

  const handleInputBlur = (id: number, field: keyof WBProfitData, value: number) => {
    // 鼠标移开后触发计算
    setData(prevData => {
      return batchCalculateWBProfit(
        prevData.map(item => ({
          id: item.id,
          主图: item.主图,
          类目: item.类目,
          标题: item.标题,
          详情页地址: item.详情页地址,
          品牌: item.品牌,
          售价卢布: item.id === id && field === '售价卢布' ? value : item.售价卢布,
          产品成本RMB: item.id === id && field === '产品成本RMB' ? value : item.产品成本RMB,
          FBW配送费: item.FBW配送费 / item.汇率, // 转换回卢布
          毛重KG: item.毛重KG,
          包装长cm: item.包装长cm,
          包装宽cm: item.包装宽cm,
          包装高cm: item.包装高cm,
        })),
        {
          汇率: item => item.id === id && field === '汇率' ? value : (item.汇率 ?? globalSettings.汇率),
          平台佣金率: (item) => {
            // 如果正在编辑平台佣金率，使用用户输入的值
            if (item.id === id && field === '平台佣金率') {
              return value; // 用户手动输入的值（已转换为小数）
            }
            // 否则使用自动匹配
            return undefined as unknown as number;
          },
          头程单价: item => item.id === id && field === '头程单价' ? value : (item.头程单价 ?? globalSettings.头程单价),
        },
        commissionMap || undefined
      ).map((item, index) => ({ ...item, id: prevData[index].id }));
    });
  };

  // 导出Excel
  const handleExport = () => {
    exportWBProfitTable(data);
    setSuccessMessage('导出成功！');
  };

  // 格式化数字
  const formatNumber = (value: number, decimals: number = 2): string => {
    if (isNaN(value)) return '0.00';
    return value.toFixed(decimals);
  };

  // 格式化百分比
  const formatPercent = (value: number): string => {
    if (isNaN(value)) return '0.00%';
    return (value * 100).toFixed(2) + '%';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <style>{`
        /* 隐藏数字输入框的上下箭头 */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="max-w-[95vw] mx-auto">
        {/* 主功能卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">WB 利润快算</CardTitle>
            <CardDescription className="space-y-2">
              <div>上传Excel表格，自动计算各项成本和利润指标</div>
              <div className="pt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex gap-2">
                  <span className="text-slate-500 dark:text-slate-500">1.</span>
                  <span>上传包含以下列的Excel：<strong>主图、类目、标题、详情页地址、品牌、售价、产品成本RMB、FBW配送费、毛重KG、包装长/宽/高cm</strong></span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 dark:text-slate-500">2.</span>
                  <span>（推荐）上传佣金率表，系统自动匹配类目佣金率（支持双重匹配：俄文→中文→默认0%）</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 dark:text-slate-500">3.</span>
                  <span>修改<strong>汇率/头程单价</strong>后自动应用到所有行，也可在表格中单独修改</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 dark:text-slate-500">4.</span>
                  <span><strong>浅红色背景</strong>表示该行类目未匹配到佣金率，显示0%</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {/* 主数据上传 */}
              <div className="flex gap-4 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={loading}>
                  <Upload className="w-4 h-4" />
                  {loading ? '导入中...' : '上传商品Excel文件'}
                </Button>
                {fileName && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {fileName}
                  </span>
                )}
              </div>

              {/* 佣金率表上传 */}
              <div className="flex gap-4 items-center">
                <input
                  ref={commissionFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleCommissionFileUpload}
                  className="hidden"
                />
                <Button onClick={() => commissionFileInputRef.current?.click()} className="gap-2" variant="outline" disabled={loading}>
                  <FileSpreadsheet className="w-4 h-4" />
                  {loading ? '加载中...' : '上传佣金率表'}
                </Button>
                {commissionFileName && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {commissionFileName}
                  </span>
                )}
                {!commissionFileName && (
                  <span className="text-xs text-muted-foreground">（推荐，支持7300+类目自动匹配，未匹配将显示0%）</span>
                )}
              </div>

              {/* 导出按钮 */}
              {data.length > 0 && (
                <Button onClick={handleExport} className="gap-2" variant="outline">
                  <Download className="w-4 h-4" />
                  导出Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 成功提示 */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据表格卡片 */}
        {data.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>利润表</CardTitle>
              <CardDescription>
                共 {data.length} 条数据，可编辑蓝色背景单元格后自动计算
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
              {/* 全局设置 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    全局设置
                  </span>
                  <span className="text-xs text-muted-foreground">修改后自动应用到所有行</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">汇率（RUB→CNY）：</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={globalSettings.汇率}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, 汇率: parseFloat(e.target.value) || 0 })}
                      onBlur={applyGlobalSettings}
                      className="w-24 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">头程单价：</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={globalSettings.头程单价}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, 头程单价: parseFloat(e.target.value) || 0 })}
                      onBlur={applyGlobalSettings}
                      className="w-20 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 顶部横向滚动条 */}
              <div
                ref={topScrollbarRef}
                className="border rounded-t-lg overflow-x-auto bg-white mb-0"
                style={{ height: '16px' }}
              >
                <div style={{ height: '1px', width: tableScrollWidth }} />
              </div>

              <div
                ref={tableContainerRef}
                className="border-x border-b rounded-b-lg overflow-auto"
                style={{
                  maxHeight: '60vh',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}
              >
                <style>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 sticky top-0 z-20">
                      <TableHead className="sticky left-0 bg-gray-100 z-30 min-w-[60px]">序号</TableHead>
                      <TableHead className="bg-gray-100 min-w-[60px]">主图</TableHead>
                      <TableHead className="bg-gray-100 min-w-[120px]">类目</TableHead>
                      <TableHead className="bg-gray-100 min-w-[200px]">产品名</TableHead>
                      <TableHead className="bg-gray-100 min-w-[150px]">产品链接</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">品牌</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">售价(卢布)</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">售价(RMB)</TableHead>
                      <TableHead className="bg-blue-50 min-w-[80px]">汇率</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">产品成本(RMB)</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">产品成本含税价</TableHead>
                      <TableHead className="bg-gray-100 min-w-[120px]">产品申报成本+30%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">头程成本</TableHead>
                      <TableHead className="bg-blue-50 min-w-[80px]">头程单价</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">头程重量KG</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">其他清关费2%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[120px]">进口增值税22%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[150px]">买方银行收单关税1.5%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">广告费10%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">FBW配送费RMB</TableHead>
                      <TableHead className="bg-blue-50 min-w-[100px]">平台佣金率</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">平台佣金</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">退款费2%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">平台放款</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">放款手续费1%</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">15%税费</TableHead>
                      <TableHead className="bg-gray-100 min-w-[100px]">5%增值税</TableHead>
                      <TableHead className="bg-gray-100 min-w-[130px]">2.5%回款手续费</TableHead>
                      <TableHead className="bg-gray-100 min-w-[110px]">国内回款金额</TableHead>
                      <TableHead className="bg-green-50 min-w-[100px]">毛利</TableHead>
                      <TableHead className="bg-green-50 min-w-[80px]">毛利率</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">毛重KG</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">体积重KG</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">包装长cm</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">包装宽cm</TableHead>
                      <TableHead className="bg-gray-100 min-w-[80px]">包装高cm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="sticky left-0 bg-white z-10">{item.id + 1}</TableCell>
                        <TableCell>
                          {item.主图 ? (
                            <img src={item.主图} alt="商品" className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                              无图
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate" title={item.类目}>{item.类目 || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.标题}>
                          {item.标题}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {item.详情页地址 ? (
                            <a href={item.详情页地址} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              查看详情
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{item.品牌 || '-'}</TableCell>
                        <TableCell className="bg-blue-50">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.售价卢布}
                            onChange={(e) => handleInputChange(item.id, '售价卢布', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleInputBlur(item.id, '售价卢布', parseFloat(e.target.value) || 0)}
                            className="w-24 h-8"
                          />
                        </TableCell>
                        <TableCell>{formatNumber(item.售价RMB)}</TableCell>
                        <TableCell className="bg-blue-50">
                          <Input
                            type="number"
                            step="0.0001"
                            value={item.汇率}
                            onChange={(e) => handleInputChange(item.id, '汇率', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleInputBlur(item.id, '汇率', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.产品成本RMB}
                            onChange={(e) => handleInputChange(item.id, '产品成本RMB', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleInputBlur(item.id, '产品成本RMB', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                          />
                        </TableCell>
                        <TableCell>{formatNumber(item.产品成本含税价)}</TableCell>
                        <TableCell>{formatNumber(item.产品申报成本)}</TableCell>
                        <TableCell>{formatNumber(item.头程成本)}</TableCell>
                        <TableCell className="bg-blue-50">
                          <Input
                            type="number"
                            step="0.1"
                            value={item.头程单价}
                            onChange={(e) => handleInputChange(item.id, '头程单价', parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleInputBlur(item.id, '头程单价', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                          />
                        </TableCell>
                        <TableCell>{formatNumber(item.头程重量KG)}</TableCell>
                        <TableCell>{formatNumber(item.其他清关费)}</TableCell>
                        <TableCell>{formatNumber(item.进口增值税)}</TableCell>
                        <TableCell>{formatNumber(item.买方银行收单关税)}</TableCell>
                        <TableCell>{formatNumber(item.广告费)}</TableCell>
                        <TableCell>{formatNumber(item.FBW配送费)}</TableCell>
                        <TableCell
                          className={`bg-blue-50 ${
                            !item.佣金率匹配成功 ? 'bg-red-100' : ''
                          }`}
                          title={item.佣金率匹配成功 ? '佣金率匹配成功' : '未匹配到类目，显示0%'}
                        >
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={(item.平台佣金率 * 100).toFixed(1)}
                              onChange={(e) => handleInputChange(item.id, '平台佣金率', parseFloat(e.target.value) || 0)}
                              onBlur={(e) => handleInputBlur(item.id, '平台佣金率', (parseFloat(e.target.value) || 0) / 100)}
                              className={`w-16 h-8 ${!item.佣金率匹配成功 ? 'bg-red-100' : ''}`}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(item.平台佣金)}</TableCell>
                        <TableCell>{formatNumber(item.退款费)}</TableCell>
                        <TableCell>{formatNumber(item.平台放款)}</TableCell>
                        <TableCell>{formatNumber(item.放款手续费)}</TableCell>
                        <TableCell>{formatNumber(item.税费15)}</TableCell>
                        <TableCell>{formatNumber(item.增值税5)}</TableCell>
                        <TableCell>{formatNumber(item.回款手续费)}</TableCell>
                        <TableCell>{formatNumber(item.国内回款金额)}</TableCell>
                        <TableCell className="bg-green-50 font-semibold">{formatNumber(item.毛利)}</TableCell>
                        <TableCell className="bg-green-50 font-semibold">{formatPercent(item.毛利率)}</TableCell>
                        <TableCell>{formatNumber(item.毛重KG)}</TableCell>
                        <TableCell>{formatNumber(item.体积重KG)}</TableCell>
                        <TableCell>{formatNumber(item.包装长cm)}</TableCell>
                        <TableCell>{formatNumber(item.包装宽cm)}</TableCell>
                        <TableCell>{formatNumber(item.包装高cm)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 底部横向滚动条 */}
              <div
                ref={bottomScrollbarRef}
                className="border rounded-b-lg overflow-x-auto bg-gray-50"
                style={{ height: '20px' }}
              >
                <div style={{ height: '1px', width: tableScrollWidth }} />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
