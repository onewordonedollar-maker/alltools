// Excel列索引映射
export const COLUMN_INDICES = {
  H: 7,  // 商品主图
  K: 10, // 大类目
  F: 5,  // 商品标题
  G: 6,  // 商品详情页链接
  W: 22, // 价格($)
  AE: 30, // FBA($)
  BG: 58, // 包装重量
} as const;

// 输出列定义
export const OUTPUT_COLUMNS = [
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
] as const;

export type OutputColumn = (typeof OUTPUT_COLUMNS)[number];

// 产品数据接口
export interface ProductData {
  id: number;
  亚马逊主图: string;
  商品主图链接: string;
  IMAG读取: string;
  类目: string;
  站点: string;
  产品名: string;
  产品链接: string;
  实时售价本币: number;
  当前汇率: number;
  产品成本: number;
  AMZ佣金: number;
  VAT: number;
  头程成本: number;
  FBA费: number;
  FBA仓储费: number;
  站内广告: number;
  退款费: number;
  其他: number;
  含广利润: number;
  含广利润率: number;
  不含广利润: number;
  不含广利润率: number;
  产品成本RMB: number;
  头程单价: number;
  头程重量: number;
  包装重量_lb: number;
  数据缺失: string;
}

// 可编辑字段
export const EDITABLE_FIELDS = [
  '当前汇率',
  '产品成本RMB',
  'VAT',
  '头程单价',
  'FBA仓储费',
  '其他',
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

// 默认值
export const DEFAULT_VALUES = {
  站点: 'US',
  当前汇率: 0,
  产品成本RMB: 0,
  VAT: 0,
  头程单价: 6.5,
  FBA仓储费: 0,
  其他: 0,
} as const;
