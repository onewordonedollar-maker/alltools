// WB利润计算器类型定义

/**
 * WB利润表数据结构
 * 严格按照字段说明文档定义
 */
export interface WBProfitData {
  // 行号（用于前端显示）
  id: number;
  
  // ==================== 从源数据表引用的字段 ====================
  主图: string; // C - 商品主图链接
  类目: string; // E - 类目
  标题: string; // F - 产品名
  详情页地址: string; // G - 产品链接
  品牌: string; // H - 品牌
  售价卢布: number; // I - 售价（卢布）
  产品成本RMB: number; // M - 产品成本（RMB）
  FBW配送费: number; // T - FBW配送费（RMB）= 原始卢布值 × 汇率
  毛重KG: number; // AH - 毛重KG
  包装长cm: number; // AJ - 包装长cm
  包装宽cm: number; // AK - 包装宽cm
  包装高cm: number; // AL - 包装高cm
  
  // ==================== 需人工输入的字段 ====================
  汇率: number; // K - 汇率
  平台佣金率: number; // U - 平台佣金率（小数，如0.20表示20%）
  头程单价: number; // AF - 头程单价
  佣金率匹配成功: boolean; // 佣金率是否成功匹配（用于高亮显示）
  
  // ==================== 公式计算字段 ====================
  售价RMB: number; // J - 售价（RMB）= 售价卢布 × 汇率
  产品成本含税价: number; // N - 产品成本含税价13% = 产品成本RMB × 1.13
  产品申报成本: number; // L - 产品申报成本+30%（RMB）= 产品成本含税价 × 1.3
  头程重量KG: number; // AG - 头程重量KG = MAX(毛重KG, 体积重KG)
  体积重KG: number; // AI - 体积重KG = 包装长 × 包装宽 × 包装高 ÷ 6000
  头程成本: number; // O - 头程成本 = 头程单价 × 头程重量KG
  其他清关费: number; // P - 其他清关费2% = 产品申报成本 × 2%
  进口增值税: number; // Q - 进口增值税22%（RMB）= 产品申报成本 × 22%
  买方银行收单关税: number; // R - 买方银行收单关税1.5% = ROUND(售价RMB × 1.5%, 2)
  广告费: number; // S - 广告费10% = 售价RMB × 10%
  平台佣金: number; // V - 平台佣金 = 售价RMB × 平台佣金率
  退款费: number; // W - 退款费2% = 售价RMB × 2%
  平台放款: number; // X - 平台放款 = 售价RMB - 买方银行收单关税 - 广告费 - FBW配送费 - 平台佣金 - 退款费
  放款手续费: number; // Y - 放款手续费1% = 平台放款 × 1%
  税费15: number; // Z - 15%税费 = (平台放款 - 产品申报成本 - 其他清关费 - 进口增值税 - 放款手续费) × 15%
  增值税5: number; // AA - 5%增值税 = 售价RMB × 65% × 5%
  回款手续费: number; // AB - 2.5%回款手续费
  国内回款金额: number; // AC - 国内回款金额
  毛利: number; // AD - 毛利 = 国内回款金额 - 产品成本含税价 - 头程成本
  毛利率: number; // AE - 毛利率 = 毛利 ÷ 售价RMB
}

/**
 * 源数据表导入字段映射
 * Excel列名 -> 系统字段名
 */
export const SOURCE_DATA_FIELD_MAP: Record<string, keyof WBProfitData> = {
  '主图': '主图',
  '类目': '类目',
  '标题': '标题',
  '详情页地址': '详情页地址',
  '品牌': '品牌',
  '售价': '售价卢布',
  '产品成本RMB': '产品成本RMB',
  'FBW配送费': 'FBW配送费',
  '毛重KG': '毛重KG',
  '包装长cm': '包装长cm',
  '包装宽cm': '包装宽cm',
  '包装高cm': '包装高cm',
};

/**
 * 可编辑字段列表（用户可在表格中修改）
 */
export const EDITABLE_FIELDS: (keyof WBProfitData)[] = [
  '汇率',
  '平台佣金率',
  '头程单价',
];

/**
 * 默认值
 */
export const DEFAULT_VALUES = {
  汇率: 0.0857, // 实时汇率会通过API获取，此为备用值
  平台佣金率: 0, // 默认为0，上传佣金率表后自动匹配
  头程单价: 3.5,
};
