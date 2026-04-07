import { NextResponse } from 'next/server';

/**
 * 获取美元兑人民币汇率
 * 使用 Open ER API（免费、无需注册）
 */
export async function GET() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // 缓存1小时
    });

    if (!response.ok) {
      throw new Error('获取汇率失败');
    }

    const data = await response.json();

    if (data.result !== 'success' || !data.rates?.CNY) {
      throw new Error('汇率数据格式错误');
    }

    return NextResponse.json({
      success: true,
      rate: data.rates.CNY,
      updateTime: data.time_last_update_utc,
      base: 'USD',
      target: 'CNY'
    });
  } catch (error) {
    console.error('获取美元汇率失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取汇率失败',
      // 返回备用汇率（美元兑人民币）
      rate: 7.24
    }, { status: 500 });
  }
}
