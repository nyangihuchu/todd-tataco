'use client'

// 업체별 업무량을 가로 바 차트로 시각화하는 컴포넌트
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import type { ChartStats } from '@/lib/actions/dashboard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// 차트 설정: 업체 업무량 단일 시리즈
const chartConfig = {
  count: {
    label: '업무 수',
  },
} satisfies ChartConfig

interface CompanyTaskChartProps {
  data: ChartStats['companyCounts']
}

export function CompanyTaskChart({ data }: CompanyTaskChartProps) {
  // 데이터가 없을 때 빈 상태 표시
  const hasData = data.length > 0

  // 업체 수에 따라 차트 높이 동적 조정 (최소 200px, 업체당 40px)
  const chartHeight = Math.max(200, data.length * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>업체별 업무량</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 데이터가 없을 때 빈 상태 표시 */}
        {!hasData ? (
          <div className='flex h-[200px] items-center justify-center'>
            <p className='text-sm text-muted-foreground'>
              등록된 업무가 없습니다
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='w-full'
            style={{ height: chartHeight }}
          >
            <BarChart
              data={data}
              layout='vertical'
              margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
            >
              {/* 그리드 라인 (수직) */}
              <CartesianGrid horizontal={false} strokeDasharray='3 3' />
              {/* X축: 업무 수 (숫자) */}
              <XAxis
                type='number'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              {/* Y축: 업체명 (카테고리), 긴 이름 대비 충분한 너비 확보 */}
              <YAxis
                type='category'
                dataKey='name'
                width={80}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className='text-xs'
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              {/* 바: primary 색상 적용 */}
              <Bar
                dataKey='count'
                fill='hsl(var(--primary))'
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
