import * as XLSX from 'xlsx';
import { COLUMN_INDICES, DEFAULT_VALUES } from './types';
import type { ProductData } from './types';

// Excel列字母转换为索引
export function getColumnIndex(column: string): number {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 64);
  }
  return index - 1;
}

// 去除重量单位，只保留数值
export function parseWeight(value: string | number | undefined | null): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

// 解析数值
export function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// 解析字符串
export function parseString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

// 计算所有字段
export function calculateFields(data: ProductData): ProductData {
  const {
    实时售价本币,
    当前汇率,
    产品成本RMB,
    VAT,
    头程单价,
    包装重量_lb,
    FBA费,
    FBA仓储费,
    其他,
  } = data;

  // 头程重量计算
  const 头程重量 = 包装重量_lb * 0.454;

  // 产品成本计算（当汇率>0时）
  const 产品成本 = 当前汇率 > 0 ? 产品成本RMB / 当前汇率 : 0;

  // 头程成本计算（当汇率>0时）
  const 头程成本 = 当前汇率 > 0 ? (头程单价 / 当前汇率) * 头程重量 : 0;

  // 费用计算
  const AMZ佣金 = 实时售价本币 * 0.15;
  const 站内广告 = 实时售价本币 * 0.20;
  const 退款费 = 实时售价本币 * 0.05;

  // 含广利润计算
  const 含广利润 =
    实时售价本币 -
    产品成本 -
    AMZ佣金 -
    VAT -
    头程成本 -
    FBA费 -
    FBA仓储费 -
    站内广告 -
    退款费 -
    其他;

  // 含广利润率计算
  const 含广利润率 = 实时售价本币 > 0 ? (含广利润 / 实时售价本币) * 100 : 0;

  // 不含广告利润计算
  const 不含广利润 =
    实时售价本币 -
    产品成本 -
    AMZ佣金 -
    VAT -
    头程成本 -
    FBA费 -
    FBA仓储费 -
    退款费 -
    其他;

  // 不含广告利润率计算
  const 不含广利润率 = 实时售价本币 > 0 ? (不含广利润 / 实时售价本币) * 100 : 0;

  // 数据缺失判断
  const 数据缺失 =
    !实时售价本币 ||
    实时售价本币 <= 0 ||
    !data.亚马逊主图 ||
    data.亚马逊主图 === '' ||
    !包装重量_lb ||
    包装重量_lb <= 0
      ? '是'
      : '否';

  return {
    ...data,
    头程重量,
    产品成本,
    头程成本,
    AMZ佣金,
    站内广告,
    退款费,
    含广利润,
    含广利润率,
    不含广利润,
    不含广利润率,
    数据缺失,
  };
}

// 解析Excel文件
export async function parseExcelFile(file: File): Promise<ProductData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为二维数组（包括表头）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
        }) as any[][];

        // 跳过第一行表头
        const dataRows = jsonData.slice(1);

        // 转换为产品数据
        const products: ProductData[] = dataRows
          .filter((row, index) => {
            // 过滤掉完全空行
            return row.length > 0 && row.some(cell => cell !== null && cell !== undefined);
          })
          .map((row, index) => {
            const baseData: ProductData = {
              id: index + 1,
              亚马逊主图: parseString(row[COLUMN_INDICES.H]),
              商品主图链接: parseString(row[COLUMN_INDICES.H]),
              IMAG读取: '',
              类目: parseString(row[COLUMN_INDICES.K]),
              站点: DEFAULT_VALUES.站点,
              产品名: parseString(row[COLUMN_INDICES.F]),
              产品链接: parseString(row[COLUMN_INDICES.G]),
              实时售价本币: parseNumber(row[COLUMN_INDICES.W]),
              当前汇率: DEFAULT_VALUES.当前汇率,
              产品成本: 0,
              AMZ佣金: 0,
              VAT: DEFAULT_VALUES.VAT,
              头程成本: 0,
              FBA费: parseNumber(row[COLUMN_INDICES.AE]),
              FBA仓储费: DEFAULT_VALUES.FBA仓储费,
              站内广告: 0,
              退款费: 0,
              其他: DEFAULT_VALUES.其他,
              含广利润: 0,
              含广利润率: 0,
              不含广利润: 0,
              不含广利润率: 0,
              产品成本RMB: DEFAULT_VALUES.产品成本RMB,
              头程单价: DEFAULT_VALUES.头程单价,
              头程重量: 0,
              包装重量_lb: parseWeight(row[COLUMN_INDICES.BG]),
              数据缺失: '否',
            };

            // 计算所有字段
            return calculateFields(baseData);
          });

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

// 导出Excel（带公式）
export function exportToExcel(data: ProductData[], filename: string = '利润计算结果.xlsx') {
  const workbook = XLSX.utils.book_new();
  
  // 准备表头
  const headers = [
    '亚马逊主图',
    '商品主图链接',
    'IMAG读取',
    '类目',
    '站点',
    '产品名',
    '产品链接',
    '实时售价本币',
    '当前汇率',
    '产品成本',
    'AMZ佣金',
    'VAT',
    '头程成本',
    'FBA费',
    'FBA仓储费',
    '站内广告',
    '退款费',
    '其他',
    '含广利润',
    '含广利润率',
    '不含广利润',
    '不含广利润率',
    '产品成本RMB',
    '头程单价',
    '头程重量',
    '包装重量_lb',
    '数据缺失',
  ];

  // 准备数据行（带公式）
  const rows = data.map((item, index) => {
    const rowNumber = index + 2; // Excel行号从2开始（第1行是表头）
    
    return [
      item.亚马逊主图, // A列
      item.商品主图链接, // B列
      { f: `=IMAGE(B${rowNumber},"",3,50,50)`, t: 's' }, // C列: IMAG读取公式
      item.类目, // D列
      item.站点, // E列
      item.产品名, // F列
      item.产品链接, // G列
      item.实时售价本币 || 0, // H列
      item.当前汇率 || 0, // I列
      { f: `=W${rowNumber}/I${rowNumber}`, z: '0.00' }, // J列: 产品成本公式
      { f: `=H${rowNumber}*0.15`, z: '0.00' }, // K列: AMZ佣金公式
      item.VAT || 0, // L列
      { f: `=X${rowNumber}/I${rowNumber}*Y${rowNumber}`, z: '0.00' }, // M列: 头程成本公式
      item.FBA费 || 0, // N列
      item.FBA仓储费 || 0, // O列
      { f: `=H${rowNumber}*0.20`, z: '0.00' }, // P列: 站内广告公式
      { f: `=H${rowNumber}*0.05`, z: '0.00' }, // Q列: 退款费公式
      item.其他 || 0, // R列
      { f: `=H${rowNumber}-J${rowNumber}-K${rowNumber}-L${rowNumber}-M${rowNumber}-N${rowNumber}-O${rowNumber}-P${rowNumber}-Q${rowNumber}-R${rowNumber}`, z: '0.00' }, // S列: 含广利润公式
      { f: `=S${rowNumber}/H${rowNumber}`, z: '0.00%' }, // T列: 含广利润率公式
      { f: `=H${rowNumber}-J${rowNumber}-K${rowNumber}-L${rowNumber}-M${rowNumber}-N${rowNumber}-O${rowNumber}-Q${rowNumber}-R${rowNumber}`, z: '0.00' }, // U列: 不含广利润公式
      { f: `=U${rowNumber}/H${rowNumber}`, z: '0.00%' }, // V列: 不含广利润率公式
      item.产品成本RMB || 0, // W列
      item.头程单价 || 0, // X列
      { f: `=Z${rowNumber}*0.454`, z: '0.00' }, // Y列: 头程重量公式
      item.包装重量_lb || 0, // Z列
      item.数据缺失, // AA列
    ];
  });

  // 合并表头和数据
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 设置列宽
  const colWidths = [
    { wch: 20 }, // 亚马逊主图
    { wch: 50 }, // 商品主图链接
    { wch: 15 }, // IMAG读取
    { wch: 12 }, // 类目
    { wch: 8 },  // 站点
    { wch: 30 }, // 产品名
    { wch: 25 }, // 产品链接
    { wch: 12 }, // 实时售价本币
    { wch: 12 }, // 当前汇率
    { wch: 12 }, // 产品成本
    { wch: 12 }, // AMZ佣金
    { wch: 10 }, // VAT
    { wch: 12 }, // 头程成本
    { wch: 10 }, // FBA费
    { wch: 12 }, // FBA仓储费
    { wch: 12 }, // 站内广告
    { wch: 10 }, // 退款费
    { wch: 10 }, // 其他
    { wch: 12 }, // 含广利润
    { wch: 12 }, // 含广利润率
    { wch: 12 }, // 不含广利润
    { wch: 12 }, // 不含广利润率
    { wch: 12 }, // 产品成本RMB
    { wch: 12 }, // 头程单价
    { wch: 12 }, // 头程重量
    { wch: 12 }, // 包装重量_lb
    { wch: 10 }, // 数据缺失
  ];
  worksheet['!cols'] = colWidths;

  // 标记数据缺失的行（红色字体）
  data.forEach((item, index) => {
    if (item.数据缺失 === '是') {
      const rowNumber = index + 2;
      for (let col = 0; col < 27; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowNumber - 1, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          cell.s = {
            font: { color: { rgb: 'FF0000' } },
          };
        }
      }
    }
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, '利润计算');

  // 下载文件
  XLSX.writeFile(workbook, filename);
}
