/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Boxes, TrendingUp, FolderOpen, AlertTriangle } from 'lucide-react';
import { Produto } from '../types';

interface DashboardChartsProps {
  products: Produto[];
}

// Shared color palette aligned with the app's indigo/slate theme
const PALETTE = [
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

// Lightweight custom tooltip shared across charts
const ChartTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-bold text-slate-700">{label ?? payload[0].name}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-medium text-slate-500">
          <span style={{ color: entry.color ?? entry.payload?.fill }}>●</span>{' '}
          {entry.name}:{' '}
          <span className="font-semibold text-slate-700">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconClass: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, iconClass, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        {subtitle && <h3 className="text-lg font-bold tracking-tight text-slate-900 mt-0.5">{subtitle}</h3>}
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-3xs ${iconClass}`}>
        {icon}
      </div>
    </div>
    <div className="flex-1 min-h-[220px]">{children}</div>
  </div>
);

const EmptyState = () => (
  <div className="flex h-full min-h-[200px] items-center justify-center text-xs font-medium text-slate-400">
    Sem dados para exibir
  </div>
);

export default function DashboardCharts({ products }: DashboardChartsProps) {
  // Aggregations derived from the live product list
  const { byCategoryCount, byCategoryValue, stockBuckets, totals } = React.useMemo(() => {
    const countMap = new Map<string, number>();
    const valueMap = new Map<string, number>();

    let totalValue = 0;
    let critical = 0; // estoque <= 3
    let low = 0; // 4 a 10
    let healthy = 0; // > 10

    for (const p of products) {
      countMap.set(p.categoria, (countMap.get(p.categoria) ?? 0) + 1);
      const value = p.preco * p.estoque;
      valueMap.set(p.categoria, (valueMap.get(p.categoria) ?? 0) + value);
      totalValue += value;

      if (p.estoque <= 3) critical++;
      else if (p.estoque <= 10) low++;
      else healthy++;
    }

    const byCategoryCount = Array.from(countMap.entries())
      .map(([categoria, quantidade]) => ({ categoria, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const byCategoryValue = Array.from(valueMap.entries())
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);

    const stockBuckets = [
      { faixa: 'Crítico (≤3)', quantidade: critical, fill: '#f59e0b' },
      { faixa: 'Baixo (4-10)', quantidade: low, fill: '#0ea5e9' },
      { faixa: 'Saudável (>10)', quantidade: healthy, fill: '#10b981' },
    ].filter((b) => b.quantidade > 0);

    return {
      byCategoryCount,
      byCategoryValue,
      stockBuckets,
      totals: {
        totalCount: products.length,
        totalValue,
        uniqueCats: countMap.size,
        critical,
      },
    };
  }, [products]);

  return (
    <div className="space-y-4" id="charts-dashboard">
      {/* Compact KPI strip kept as quick reference above the charts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          label="Total de Produtos"
          value={String(totals.totalCount)}
          icon={<Boxes className="h-4 w-4" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
        <MiniStat
          label="Valor do Inventário"
          value={formatCurrency(totals.totalValue)}
          icon={<TrendingUp className="h-4 w-4" />}
          iconClass="bg-emerald-50 text-emerald-600"
          mono
        />
        <MiniStat
          label="Categorias Ativas"
          value={String(totals.uniqueCats)}
          icon={<FolderOpen className="h-4 w-4" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <MiniStat
          label="Estoque Crítico (≤3)"
          value={String(totals.critical)}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClass={totals.critical > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}
          valueClass={totals.critical > 0 ? 'text-amber-600' : 'text-slate-900'}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products per category */}
        <ChartCard
          title="Produtos por Categoria"
          icon={<Boxes className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
        >
          {byCategoryCount.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byCategoryCount}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  width={90}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                <Bar dataKey="quantidade" name="Produtos" radius={[0, 6, 6, 0]} barSize={18}>
                  {byCategoryCount.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Inventory value distribution per category */}
        <ChartCard
          title="Valor do Inventário"
          subtitle={formatCompactCurrency(totals.totalValue)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
        >
          {byCategoryValue.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} />
                <Pie
                  data={byCategoryValue}
                  dataKey="valor"
                  nameKey="categoria"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {byCategoryValue.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Stock health distribution */}
        <ChartCard
          title="Distribuição de Estoque"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
        >
          {stockBuckets.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockBuckets} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                <Bar dataKey="quantidade" name="Produtos" radius={[6, 6, 0, 0]} barSize={48}>
                  {stockBuckets.map((b, i) => (
                    <Cell key={i} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

const MiniStat: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  valueClass?: string;
  mono?: boolean;
}> = ({ label, value, icon, iconClass, valueClass, mono }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs flex items-center justify-between gap-2">
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
      <h3 className={`text-base font-bold tracking-tight mt-0.5 truncate ${mono ? 'font-mono' : ''} ${valueClass ?? 'text-slate-900'}`}>
        {value}
      </h3>
    </div>
    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${iconClass}`}>
      {icon}
    </div>
  </div>
);
