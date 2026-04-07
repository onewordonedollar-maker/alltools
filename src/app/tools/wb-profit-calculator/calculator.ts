import * as XLSX from 'xlsx';
import type { WBProfitData } from './types';
import { DEFAULT_VALUES, SOURCE_DATA_FIELD_MAP, WB_COMMISSION_RATE_MAP } from './types';

/**
 * 根据类目自动匹配佣金率
 * 优先俄文，次级中文，失败则返回0
 * @param category 类目名称
 * @returns 佣金率（百分数形式，如14.5表示14.5%）
 */
export function matchCommissionRate(category: string): number {
  if (!category) return 0;

  // 优先俄文匹配
  for (const [key, rate] of Object.entries(WB_COMMISSION_RATE_MAP)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return rate;
    }
  }

  // 返回默认值0%
  return 0;
}

/**
 * 计算WB利润
 * 严格按照字段说明文档的公式计算
 */
export function calculateWBProfit(
  sourceData: Partial<WBProfitData>,
  userInput: {
    汇率?: number;
    平台佣金率?: number;
    头程单价?: number;
  } = {}
): WBProfitData {
  // 获取源数据
  const 售价卢布 = Number(sourceData.售价卢布) || 0;
  const 产品成本RMB = Number(sourceData.产品成本RMB) || 0;
  const FBW配送费 = Number(sourceData.FBW配送费) || 0;
  const 毛重KG = Number(sourceData.毛重KG) || 0;
  const 包装长cm = Number(sourceData.包装长cm) || 0;
  const 包装宽cm = Number(sourceData.包装宽cm) || 0;
  const 包装高cm = Number(sourceData.包装高cm) || 0;

  // 获取用户输入
  const 汇率 = userInput.汇率 ?? DEFAULT_VALUES.汇率;
  // 佣金率为百分数形式（如14.5表示14.5%），需要转换为小数
  const 平台佣金率 = (userInput.平台佣金率 ?? DEFAULT_VALUES.平台佣金率) / 100;
  const 头程单价 = userInput.头程单价 ?? DEFAULT_VALUES.头程单价;
  
  // ========== 开始计算 ==========

  // J - 售价（RMB）= 售价卢布 × 汇率
  const 售价RMB = 售价卢布 * 汇率;

  // T - FBW配送费（RMB）= FBW配送费（卢布）× 汇率
  const FBW配送费RMB = FBW配送费 * 汇率;

  // N - 产品成本含税价13% = 产品成本RMB × 1.13
  const 产品成本含税价 = 产品成本RMB * 1.13;
  
  // L - 产品申报成本+30%（RMB）= 产品成本含税价 × 1.3
  const 产品申报成本 = 产品成本含税价 * 1.3;
  
  // AI - 体积重KG = 包装长 × 包装宽 × 包装高 ÷ 6000
  const 体积重KG = (包装长cm * 包装宽cm * 包装高cm) / 6000;
  
  // AG - 头程重量KG = MAX(毛重KG, 体积重KG)
  const 头程重量KG = Math.max(毛重KG, 体积重KG);
  
  // O - 头程成本 = 头程单价 × 头程重量KG
  const 头程成本 = 头程单价 * 头程重量KG;
  
  // P - 其他清关费2% = 产品申报成本 × 2%
  const 其他清关费 = 产品申报成本 * 0.02;
  
  // Q - 进口增值税22%（RMB）= 产品申报成本 × 22%
  const 进口增值税 = 产品申报成本 * 0.22;
  
  // R - 买方银行收单关税1.5% = ROUND(售价RMB × 1.5%, 2)
  const 买方银行收单关税 = Math.round(售价RMB * 0.015 * 100) / 100;
  
  // S - 广告费10% = 售价RMB × 10%
  const 广告费 = 售价RMB * 0.10;
  
  // V - 平台佣金 = 售价RMB × 平台佣金率
  const 平台佣金 = 售价RMB * 平台佣金率;
  
  // W - 退款费2% = 售价RMB × 2%
  const 退款费 = 售价RMB * 0.02;
  
  // X - 平台放款 = 售价RMB - 买方银行收单关税 - 广告费 - FBW配送费RMB - 平台佣金 - 退款费
  const 平台放款 = 售价RMB - 买方银行收单关税 - 广告费 - FBW配送费RMB - 平台佣金 - 退款费;
  
  // Y - 放款手续费1% = 平台放款 × 1%
  const 放款手续费 = 平台放款 * 0.01;
  
  // Z - 15%税费 = (平台放款 - 产品申报成本 - 其他清关费 - 进口增值税 - 放款手续费) × 15%
  const 税费15 = (平台放款 - 产品申报成本 - 其他清关费 - 进口增值税 - 放款手续费) * 0.15;
  
  // AA - 5%增值税 = 售价RMB × 65% × 5%
  const 增值税5 = 售价RMB * 0.65 * 0.05;
  
  // AB - 2.5%回款手续费 = (平台放款 - 放款手续费 - 15%税费 - 5%增值税 - 进口增值税 - 其他清关费) × 2.5%
  const 回款手续费 = (平台放款 - 放款手续费 - 税费15 - 增值税5 - 进口增值税 - 其他清关费) * 0.025;
  
  // AC - 国内回款金额 = 平台放款 - 放款手续费 - 15%税费 - 5%增值税 - 2.5%回款手续费 - 进口增值税 - 其他清关费
  const 国内回款金额 = 平台放款 - 放款手续费 - 税费15 - 增值税5 - 回款手续费 - 进口增值税 - 其他清关费;
  
  // AD - 毛利 = 国内回款金额 - 产品成本含税价 - 头程成本
  const 毛利 = 国内回款金额 - 产品成本含税价 - 头程成本;
  
  // AE - 毛利率 = 毛利 ÷ 售价RMB
  const 毛利率 = 售价RMB > 0 ? 毛利 / 售价RMB : 0;
  
  return {
    id: sourceData.id || 0,
    // 源数据字段
    主图: sourceData.主图 || '',
    类目: sourceData.类目 || '',
    标题: sourceData.标题 || '',
    详情页地址: sourceData.详情页地址 || '',
    品牌: sourceData.品牌 || '',
    售价卢布,
    产品成本RMB,
    FBW配送费: FBW配送费RMB, // 转换为RMB后返回
    毛重KG,
    包装长cm,
    包装宽cm,
    包装高cm,
    // 用户输入字段
    汇率,
    平台佣金率,
    头程单价,
    // 计算字段
    售价RMB,
    产品成本含税价,
    产品申报成本,
    头程重量KG,
    体积重KG,
    头程成本,
    其他清关费,
    进口增值税,
    买方银行收单关税,
    广告费,
    平台佣金,
    退款费,
    平台放款,
    放款手续费,
    税费15,
    增值税5,
    回款手续费,
    国内回款金额,
    毛利,
    毛利率,
  };
}

/**
 * 解析源数据Excel文件
 */
export async function parseSourceExcel(file: File): Promise<Partial<WBProfitData>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('文件读取失败'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'arraybuffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel文件为空或格式不正确'));
          return;
        }
        
        // 获取表头
        const headers = jsonData[0] as string[];
        
        // 建立列名到索引的映射
        const colIndexMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          if (header) {
            colIndexMap[header.trim()] = index;
          }
        });
        
        // 解析数据行
        const rows = jsonData.slice(1);
        const result: Partial<WBProfitData>[] = [];
        
        rows.forEach((row, index) => {
          const rowArray = row as unknown[];
          
          // 跳过空行
          if (!rowArray || rowArray.every(cell => cell === undefined || cell === null || cell === '')) {
            return;
          }
          
          const item: Partial<WBProfitData> = { id: index };
          
          // 根据字段映射读取数据
          for (const [excelCol, fieldName] of Object.entries(SOURCE_DATA_FIELD_MAP)) {
            const colIndex = colIndexMap[excelCol];
            if (colIndex !== undefined && rowArray[colIndex] !== undefined) {
              const value = rowArray[colIndex];
              if (typeof value === 'number') {
                (item as Record<string, number | string>)[fieldName] = value;
              } else if (typeof value === 'string') {
                // 尝试转换为数字
                const num = parseFloat(value);
                if (!isNaN(num) && fieldName !== '主图' && fieldName !== '类目' && fieldName !== '标题' && fieldName !== '详情页地址' && fieldName !== '品牌') {
                  (item as Record<string, number | string>)[fieldName] = num;
                } else {
                  (item as Record<string, number | string>)[fieldName] = value;
                }
              }
            }
          }
          
          // 只保留有售价的行
          if (item.售价卢布 && item.售价卢布 > 0) {
            result.push(item);
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 批量计算WB利润
 */
export function batchCalculateWBProfit(
  sourceDataList: Partial<WBProfitData>[],
  userInput: {
    汇率?: number | ((item: Partial<WBProfitData>, index: number) => number);
    平台佣金率?: number | ((item: Partial<WBProfitData>, index: number) => number);
    头程单价?: number | ((item: Partial<WBProfitData>, index: number) => number);
  } = {}
): WBProfitData[] {
  return sourceDataList.map((item, index) => {
    // 解析每行的userInput
    const rowUserInput = {
      汇率: typeof userInput.汇率 === 'function'
        ? userInput.汇率(item, index)
        : (userInput.汇率 ?? DEFAULT_VALUES.汇率),
      平台佣金率: typeof userInput.平台佣金率 === 'function'
        ? userInput.平台佣金率(item, index)
        : (userInput.平台佣金率 ?? DEFAULT_VALUES.平台佣金率),
      头程单价: typeof userInput.头程单价 === 'function'
        ? userInput.头程单价(item, index)
        : (userInput.头程单价 ?? DEFAULT_VALUES.头程单价),
    };

    return calculateWBProfit({ ...item, id: index }, rowUserInput);
  });
}
