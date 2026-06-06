'use client'

// 업무 상태별 분포를 도넛 차트로 시각화하는 컴포넌트
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
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
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// 상태별 색상 및 레이블 설정
const chartConfig = {
  pending: {
    label: '대기',
    color: 'hsl(220 14% 60%)',
  },
  in_progress: {
    label: '진행중',
    color: 'hsl(217 91% 60%)',
  },
  review: {
    label: '확인요청',
    color: 'hsl(43 96% 56%)',
  },
  done: {
    label: '완료',
    color: 'hsl(142 71% 45%)',
  },
} satisfies ChartConfig

interface TaskStatusChartProps {
  data: ChartStats['statusCounts']
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  // 데이터가 없거나 모든 항목의 count가 0인 경우 빈 상태 표시
  const hasData = data.length > 0 && data.some((item) => item.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>업무 현황</CardTitle>
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
          <ChartContainer config={chartConfig} className='mx-auto aspect-square max-h-[280px]'>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey='count'
                nameKey='status'
                innerRadius={60}
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.status}`}
                    fill={entry.fill}
                  />
                ))}
              </Pie>
              {/* 범례: 상태별 레이블 표시 */}
              <Legend
                content={<ChartLegendContent nameKey='status' />}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
