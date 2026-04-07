import * as XLSX from 'xlsx';
import type { WBProfitData } from './types';

/**
 * 获取Excel列字母（0->A, 1->B, ..., 25->Z, 26->AA, ...）
 */
function getColLetter(index: number): string {
  let letter = '';
  let i = index;
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
}

/**
 * 导出WB利润表
 * 严格按照字段说明文档的列顺序和公式
 */
export function exportWBProfitTable(data: WBProfitData[]): void {
  if (data.length === 0) {
    alert('没有数据可导出');
    return;
  }
  
  // 定义列（38列，A-AL）
  const columns = [
    '导出表的格式',           // A
    'WB主图',                 // B
    '商品主图链接',           // C
    'IMAG读取',               // D
    '类目',                   // E
    '产品名',                 // F
    '产品链接',               // G
    '品牌',                   // H
    '售价（卢布）',           // I
    '售价（RMB）',            // J
    '汇率',                   // K
    '产品申报成本+30%（RMB）', // L
    '产品成本（RMB）',        // M
    '产品成本含税价13%',      // N
    '头程成本',               // O
    '其他清关费2%',           // P
    '进口增值税22%（RMB）',   // Q
    '买方银行收单关税1.5%',   // R
    '广告费10%',              // S
    'FBW配送费',              // T
    '平台佣金率',             // U
    '平台佣金',               // V
    '退款费2%',               // W
    '平台放款',               // X
    '放款手续费1%',           // Y
    '15%税费',                // Z
    '5%增值税',               // AA
    '2.5%回款手续费',         // AB
    '国内回款金额',           // AC
    '毛利',                   // AD
    '毛利率',                 // AE
    '头程单价',               // AF
    '头程重量KG',             // AG
    '毛重KG',                 // AH
    '体积重KG',               // AI
    '包装长cm',               // AJ
    '包装宽cm',               // AK
    '包装高cm',               // AL
  ];
  
  // 列字母映射
  const col: Record<string, string> = {};
  columns.forEach((name, index) => {
    col[name] = getColLetter(index);
  });
  
  // 构建表头
  const header = columns;
  const rows: any[][] = [header];
  
  // 构建数据行
  data.forEach((item, rowIndex) => {
    const rowNum = rowIndex + 2; // Excel行号（从1开始，表头是第1行）
    const row: any[] = [];
    
    // A - 导出表的格式（空）
    row.push('');
    
    // B - WB主图（带链接）
    if (item.主图) {
      row.push({
        v: '查看图片',
        l: { Target: item.主图, Tooltip: '点击查看产品图片' }
      });
    } else {
      row.push('');
    }
    
    // C - 商品主图链接
    row.push(item.主图 || '');
    
    // D - IMAG读取（IMAGE公式）
    if (item.主图) {
      row.push({
        f: `=IMAGE(${col['商品主图链接']}${rowNum},"",3,50,50)`
      });
    } else {
      row.push('');
    }
    
    // E - 类目
    row.push(item.类目 || '');
    
    // F - 产品名
    row.push(item.标题 || '');
    
    // G - 产品链接
    row.push(item.详情页地址 || '');
    
    // H - 品牌
    row.push(item.品牌 || '');
    
    // I - 售价（卢布）
    row.push(item.售价卢布 || 0);
    
    // J - 售价（RMB）= 售价卢布 × 汇率
    row.push({
      f: `=${col['售价（卢布）']}${rowNum}*${col['汇率']}${rowNum}`,
      z: '0.00'
    });
    
    // K - 汇率（用户输入）
    row.push(item.汇率 || 0);
    
    // L - 产品申报成本+30%（RMB）= 产品成本含税价 × 1.3
    row.push({
      f: `=${col['产品成本含税价13%']}${rowNum}*1.3`,
      z: '0.00'
    });
    
    // M - 产品成本（RMB）
    row.push(item.产品成本RMB || 0);
    
    // N - 产品成本含税价13% = 产品成本RMB × 1.13
    row.push({
      f: `=${col['产品成本（RMB）']}${rowNum}*1.13`,
      z: '0.00'
    });
    
    // O - 头程成本 = 头程单价 × 头程重量KG
    row.push({
      f: `=${col['头程单价']}${rowNum}*${col['头程重量KG']}${rowNum}`,
      z: '0.00'
    });
    
    // P - 其他清关费2% = 产品申报成本 × 2%
    row.push({
      f: `=${col['产品申报成本+30%（RMB）']}${rowNum}*2%`,
      z: '0.00'
    });
    
    // Q - 进口增值税22%（RMB）= 产品申报成本 × 22%
    row.push({
      f: `=${col['产品申报成本+30%（RMB）']}${rowNum}*22%`,
      z: '0.00'
    });
    
    // R - 买方银行收单关税1.5% = ROUND(售价RMB × 1.5%, 2)
    row.push({
      f: `=ROUND(${col['售价（RMB）']}${rowNum}*1.5%,2)`,
      z: '0.00'
    });
    
    // S - 广告费10% = 售价RMB × 10%
    row.push({
      f: `=${col['售价（RMB）']}${rowNum}*10%`,
      z: '0.00'
    });
    
    // T - FBW配送费
    row.push(item.FBW配送费 || 0);
    
    // U - 平台佣金率（用户输入）
    row.push(item.平台佣金率 || 0);
    
    // V - 平台佣金 = 售价RMB × 平台佣金率
    row.push({
      f: `=${col['售价（RMB）']}${rowNum}*${col['平台佣金率']}${rowNum}`,
      z: '0.00'
    });
    
    // W - 退款费2% = 售价RMB × 2%
    row.push({
      f: `=${col['售价（RMB）']}${rowNum}*2%`,
      z: '0.00'
    });
    
    // X - 平台放款 = 售价RMB - 买方银行收单关税 - 广告费 - FBW配送费 - 平台佣金 - 退款费
    row.push({
      f: `=${col['售价（RMB）']}${rowNum}-${col['买方银行收单关税1.5%']}${rowNum}-${col['广告费10%']}${rowNum}-${col['FBW配送费']}${rowNum}-${col['平台佣金']}${rowNum}-${col['退款费2%']}${rowNum}`,
      z: '0.00'
    });
    
    // Y - 放款手续费1% = 平台放款 × 1%
    row.push({
      f: `=${col['平台放款']}${rowNum}*1%`,
      z: '0.00'
    });
    
    // Z - 15%税费 = (平台放款 - 产品申报成本 - 其他清关费 - 进口增值税 - 放款手续费) × 15%
    row.push({
      f: `=(${col['平台放款']}${rowNum}-${col['产品申报成本+30%（RMB）']}${rowNum}-${col['其他清关费2%']}${rowNum}-${col['进口增值税22%（RMB）']}${rowNum}-${col['放款手续费1%']}${rowNum})*15%`,
      z: '0.00'
    });
    
    // AA - 5%增值税 = 售价RMB × 65% × 5%
    row.push({
      f: `=${col['售价（RMB）']}${rowNum}*65%*5%`,
      z: '0.00'
    });
    
    // AB - 2.5%回款手续费
    row.push({
      f: `=(${col['平台放款']}${rowNum}-${col['放款手续费1%']}${rowNum}-${col['15%税费']}${rowNum}-${col['5%增值税']}${rowNum}-${col['进口增值税22%（RMB）']}${rowNum}-${col['其他清关费2%']}${rowNum})*2.5%`,
      z: '0.00'
    });
    
    // AC - 国内回款金额
    row.push({
      f: `=${col['平台放款']}${rowNum}-${col['放款手续费1%']}${rowNum}-${col['15%税费']}${rowNum}-${col['5%增值税']}${rowNum}-${col['2.5%回款手续费']}${rowNum}-${col['进口增值税22%（RMB）']}${rowNum}-${col['其他清关费2%']}${rowNum}`,
      z: '0.00'
    });
    
    // AD - 毛利 = 国内回款金额 - 产品成本含税价 - 头程成本
    row.push({
      f: `=${col['国内回款金额']}${rowNum}-${col['产品成本含税价13%']}${rowNum}-${col['头程成本']}${rowNum}`,
      z: '0.00'
    });
    
    // AE - 毛利率 = 毛利 ÷ 售价RMB
    row.push({
      f: `=${col['毛利']}${rowNum}/${col['售价（RMB）']}${rowNum}`,
      z: '0.00%'
    });
    
    // AF - 头程单价（用户输入）
    row.push(item.头程单价 || 0);
    
    // AG - 头程重量KG = MAX(毛重KG, 体积重KG)
    row.push({
      f: `=MAX(${col['毛重KG']}${rowNum},${col['体积重KG']}${rowNum})`,
      z: '0.00'
    });
    
    // AH - 毛重KG
    row.push(item.毛重KG || 0);
    
    // AI - 体积重KG = 包装长 × 包装宽 × 包装高 ÷ 6000
    row.push({
      f: `=${col['包装长cm']}${rowNum}*${col['包装宽cm']}${rowNum}*${col['包装高cm']}${rowNum}/6000`,
      z: '0.00'
    });
    
    // AJ - 包装长cm
    row.push(item.包装长cm || 0);
    
    // AK - 包装宽cm
    row.push(item.包装宽cm || 0);
    
    // AL - 包装高cm
    row.push(item.包装高cm || 0);
    
    rows.push(row);
  });
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // 设置列宽
  const colWidths = [
    { wch: 12 },  // A - 导出表的格式
    { wch: 10 },  // B - WB主图
    { wch: 40 },  // C - 商品主图链接
    { wch: 12 },  // D - IMAG读取
    { wch: 15 },  // E - 类目
    { wch: 30 },  // F - 产品名
    { wch: 40 },  // G - 产品链接
    { wch: 12 },  // H - 品牌
    { wch: 12 },  // I - 售价（卢布）
    { wch: 12 },  // J - 售价（RMB）
    { wch: 10 },  // K - 汇率
    { wch: 20 },  // L - 产品申报成本+30%（RMB）
    { wch: 15 },  // M - 产品成本（RMB）
    { wch: 18 },  // N - 产品成本含税价13%
    { wch: 12 },  // O - 头程成本
    { wch: 14 },  // P - 其他清关费2%
    { wch: 18 },  // Q - 进口增值税22%（RMB）
    { wch: 18 },  // R - 买方银行收单关税1.5%
    { wch: 12 },  // S - 广告费10%
    { wch: 12 },  // T - FBW配送费
    { wch: 12 },  // U - 平台佣金率
    { wch: 12 },  // V - 平台佣金
    { wch: 12 },  // W - 退款费2%
    { wch: 12 },  // X - 平台放款
    { wch: 14 },  // Y - 放款手续费1%
    { wch: 12 },  // Z - 15%税费
    { wch: 12 },  // AA - 5%增值税
    { wch: 15 },  // AB - 2.5%回款手续费
    { wch: 14 },  // AC - 国内回款金额
    { wch: 12 },  // AD - 毛利
    { wch: 10 },  // AE - 毛利率
    { wch: 10 },  // AF - 头程单价
    { wch: 12 },  // AG - 头程重量KG
    { wch: 10 },  // AH - 毛重KG
    { wch: 10 },  // AI - 体积重KG
    { wch: 10 },  // AJ - 包装长cm
    { wch: 10 },  // AK - 包装宽cm
    { wch: 10 },  // AL - 包装高cm
  ];
  worksheet['!cols'] = colWidths;
  
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WB利润表');
  
  // 下载文件
  const fileName = `WB利润表_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
