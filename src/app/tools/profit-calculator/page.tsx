'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/shared/FileUpload';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductData, EditableField } from './types';
import { parseExcelFile, exportToExcel, calculateFields } from './utils';
import { EDITABLE_FIELDS, DEFAULT_VALUES } from './types';

export default function ProfitCalculatorPage() {
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const parsedData = await parseExcelFile(file);
      setData(parsedData);
      setFileName(file.name);
    } catch (error) {
      console.error('解析Excel文件失败:', error);
      alert('解析Excel文件失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('请先上传Excel文件');
      return;
    }
    
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToExcel(data, `利润计算结果_${timestamp}.xlsx`);
  };

  const handleEditableChange = (
    rowIndex: number,
    field: EditableField,
    value: number | string
  ) => {
    setUpdating(true);
    
    const newData = [...data];
    const updatedItem = { ...newData[rowIndex] };
    
    // 更新可编辑字段
    if (field === '当前汇率') {
      updatedItem.当前汇率 = Number(value);
      // 更新所有行的汇率
      newData.forEach((item, idx) => {
        if (idx >= rowIndex) {
          newData[idx] = {
            ...newData[idx],
            当前汇率: Number(value),
          };
        }
      });
    } else {
      (updatedItem[field] as any) = Number(value);
      newData[rowIndex] = updatedItem;
    }
    
    // 重新计算所有行
    const calculatedData = newData.map(item => calculateFields(item));
    setData(calculatedData);
    
    // 延迟清除updating状态，避免频繁闪烁
    setTimeout(() => setUpdating(false), 100);
  };

  const handleBulkChange = (
    field: EditableField,
    value: number
  ) => {
    setUpdating(true);
    
    const newData = [...data];
    newData.forEach((item, index) => {
      if (field === '当前汇率') {
        newData[index] = {
          ...newData[index],
          [field]: value,
        };
      } else {
        newData[index] = {
          ...newData[index],
          [field]: value,
        };
      }
    });
    
    // 重新计算所有行
    const calculatedData = newData.map(item => calculateFields(item));
    setData(calculatedData);
    
    setTimeout(() => setUpdating(false), 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">利润计算器</h1>
        <p className="text-muted-foreground">
          上传Excel文件，自动计算产品利润，支持导出带公式的Excel
        </p>
      </div>

      {/* 操作区 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">文件操作</h2>
          {data.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                导出Excel
              </Button>
            </div>
          )}
        </div>

        <FileUpload onFileSelect={handleFileSelect} />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            正在解析Excel文件...
          </div>
        )}

        {fileName && !loading && (
          <div className="text-sm text-muted-foreground">
            当前文件: {fileName}，共 {data.length} 条数据
          </div>
        )}
      </div>

      {/* 数据表格区 */}
      {data.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-background z-10">
                <tr>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    #
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    亚马逊主图
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    商品主图链接
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    IMAG读取
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    类目
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    站点
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    产品名
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    产品链接
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    实时售价本币
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    当前汇率
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    产品成本
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    AMZ佣金
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    VAT
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    头程成本
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    FBA费
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    FBA仓储费
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    站内广告
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    退款费
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    其他
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    含广利润
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    含广利润率
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    不含广利润
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    不含广利润率
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    产品成本RMB
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    头程单价
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    头程重量
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    包装重量_lb
                  </th>
                  <th className="border px-2 py-1 text-left text-xs font-medium whitespace-nowrap bg-muted">
                    数据缺失
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, rowIndex) => (
                  <tr
                    key={item.id}
                    className={
                      item.数据缺失 === '是'
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'hover:bg-muted/50'
                    }
                  >
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      {rowIndex + 1}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      {item.亚马逊主图 ? (
                        <a
                          href={item.亚马逊主图}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          查看图片
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap max-w-[300px] truncate">
                      {item.商品主图链接 || '-'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      {item.商品主图链接 ? `=IMAGE(B${rowIndex + 2},"",3,50,50)` : '-'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      {item.类目 || '-'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      {item.站点}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap max-w-[200px] truncate">
                      {item.产品名 || '-'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap max-w-[200px]">
                      {item.产品链接 ? (
                        <a
                          href={item.产品链接}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          查看链接
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.实时售价本币?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.当前汇率}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, '当前汇率', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('当前汇率', Number(e.target.value))
                        }
                        className="w-20 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.产品成本?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.AMZ佣金?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.VAT}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, 'VAT', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('VAT', Number(e.target.value))
                        }
                        className="w-16 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.头程成本?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.FBA费?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.FBA仓储费}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, 'FBA仓储费', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('FBA仓储费', Number(e.target.value))
                        }
                        className="w-16 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.站内广告?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.退款费?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.其他}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, '其他', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('其他', Number(e.target.value))
                        }
                        className="w-16 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right font-semibold">
                      {item.含广利润?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.含广利润率?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right font-semibold">
                      {item.不含广利润?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.不含广利润率?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.产品成本RMB}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, '产品成本RMB', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('产品成本RMB', Number(e.target.value))
                        }
                        className="w-20 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={item.头程单价}
                        onChange={(e) =>
                          handleEditableChange(rowIndex, '头程单价', e.target.value)
                        }
                        onBlur={(e) =>
                          handleBulkChange('头程单价', Number(e.target.value))
                        }
                        className="w-16 px-1 py-0.5 text-xs border rounded"
                      />
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.头程重量?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-right">
                      {item.包装重量_lb?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-2 py-1 text-xs whitespace-nowrap text-center">
                      {item.数据缺失 === '是' ? (
                        <span className="text-red-600 font-semibold">是</span>
                      ) : (
                        <span>否</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
