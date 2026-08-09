"use client";

import { useMemo, useState } from "react";

import { Calculator, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_PROPS,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/components/charts/chart-theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DistributionBar,
  type DistributionSegment,
} from "@/components/ui/distribution-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  COMPOUND_FREQUENCIES,
  COMPOUND_FREQUENCY_LABELS,
  CONTRIBUTION_FREQUENCIES,
  CONTRIBUTION_FREQUENCY_LABELS,
  type CompoundFrequency,
  type ContributionFrequency,
  calculateCompoundInterest,
  contributionSplit,
  effectiveAnnualRate,
} from "@/lib/compound-interest";
import { formatMoney, parseMoneyString, toNumber } from "@/lib/money";
import { cn } from "@/lib/utils";

const MAX_YEARS = 60;

export function CompoundCalculator() {
  const [principal, setPrincipal] = useState("100000.00");
  const [contribution, setContribution] = useState("5000.00");
  const [contributionFrequency, setContributionFrequency] =
    useState<ContributionFrequency>("mensual");
  const [compoundFrequency, setCompoundFrequency] =
    useState<CompoundFrequency>("mensual");
  const [years, setYears] = useState("10");
  const [annualRate, setAnnualRate] = useState("8");
  const [useVariableRates, setUseVariableRates] = useState(false);
  const [variableRates, setVariableRates] = useState<string[]>([]);

  const yearCount = clampYears(years);

  const result = useMemo(() => {
    const parsedVariable = useVariableRates
      ? Array.from({ length: yearCount }, (_, index) => {
          const raw = variableRates[index];
          const value = raw === undefined || raw === "" ? Number.NaN : Number(raw);
          return Number.isFinite(value) ? value : Number(annualRate) || 0;
        })
      : undefined;

    return calculateCompoundInterest({
      principal: parseMoneyString(principal),
      contribution: parseMoneyString(contribution),
      contributionFrequency,
      compoundFrequency,
      years: yearCount,
      annualRate: Number(annualRate) || 0,
      ...(parsedVariable ? { variableRates: parsedVariable } : {}),
    });
  }, [
    principal,
    contribution,
    contributionFrequency,
    compoundFrequency,
    yearCount,
    annualRate,
    useVariableRates,
    variableRates,
  ]);

  const chartRows = useMemo(
    () => [
      {
        label: "0",
        aportado: toNumber(parseMoneyString(principal)),
        intereses: 0,
      },
      ...result.rows.map((row) => ({
        label: String(row.year),
        aportado: toNumber(parseMoneyString(principal) + row.totalContributed),
        intereses: toNumber(row.totalInterest),
      })),
    ],
    [result.rows, principal],
  );

  const split = contributionSplit(result);
  const segments: DistributionSegment[] = [
    {
      label: "Capital aportado",
      color: CHART_COLORS.info,
      value: split.investedPercent,
    },
    {
      label: "Intereses generados",
      color: CHART_COLORS.positive,
      value: split.interestPercent,
    },
  ];

  const effective = effectiveAnnualRate(
    Number(annualRate) || 0,
    compoundFrequency,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <Card className="xl:sticky xl:top-20 xl:h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Parámetros
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Capital inicial</Label>
            <Input
              id="principal"
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              inputMode="decimal"
              className="tabular"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution">Aporte periódico</Label>
            <Input
              id="contribution"
              value={contribution}
              onChange={(event) => setContribution(event.target.value)}
              inputMode="decimal"
              className="tabular"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-frequency">Frecuencia del aporte</Label>
            <Select
              value={contributionFrequency}
              onValueChange={(value) =>
                setContributionFrequency(value as ContributionFrequency)
              }
            >
              <SelectTrigger id="contribution-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRIBUTION_FREQUENCIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CONTRIBUTION_FREQUENCY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compound-frequency">
              Frecuencia de capitalización
            </Label>
            <Select
              value={compoundFrequency}
              onValueChange={(value) =>
                setCompoundFrequency(value as CompoundFrequency)
              }
            >
              <SelectTrigger id="compound-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOUND_FREQUENCIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {COMPOUND_FREQUENCY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="years">Plazo (años)</Label>
              <Input
                id="years"
                value={years}
                onChange={(event) => setYears(event.target.value)}
                inputMode="numeric"
                className="tabular"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Tasa anual (%)</Label>
              <Input
                id="rate"
                value={annualRate}
                onChange={(event) => setAnnualRate(event.target.value)}
                inputMode="decimal"
                className="tabular"
                disabled={useVariableRates && variableRates.length >= yearCount}
              />
            </div>
          </div>

          <p className="rounded-md border border-border bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
            Tasa efectiva anual equivalente:{" "}
            <span className="tabular font-semibold text-foreground">
              {effective.toFixed(3)}%
            </span>
          </p>

          <div className="space-y-2 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useVariableRates}
                onChange={(event) => setUseVariableRates(event.target.checked)}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              Tasa variable por año
            </label>

            {useVariableRates ? (
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {Array.from({ length: yearCount }, (_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">
                      Año {index + 1}
                    </span>
                    <Input
                      value={variableRates[index] ?? annualRate}
                      onChange={(event) => {
                        const next = [...variableRates];
                        // Rellena los huecos con la tasa fija actual.
                        for (let i = 0; i < yearCount; i += 1) {
                          next[i] = next[i] ?? annualRate;
                        }
                        next[index] = event.target.value;
                        setVariableRates(next);
                      }}
                      inputMode="decimal"
                      className="tabular h-8"
                      aria-label={`Tasa del año ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setVariableRates([]);
              setUseVariableRates(false);
            }}
          >
            Restablecer tasas
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultTile
            label="Saldo final"
            value={formatMoney(result.finalBalance)}
            tone="accent"
          />
          <ResultTile
            label="Total invertido"
            value={formatMoney(result.totalInvested)}
            tone="info"
          />
          <ResultTile
            label="Intereses generados"
            value={formatMoney(result.totalInterest)}
            tone="positive"
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Proyección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartRows}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="aportadoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.info} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={CHART_COLORS.info} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="interesesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.positive} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={CHART_COLORS.positive} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    {...AXIS_PROPS}
                    label={{
                      value: "Años",
                      position: "insideBottomRight",
                      offset: -4,
                      fill: CHART_COLORS.axis,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    {...AXIS_PROPS}
                    width={64}
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat("es-DO", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value)
                    }
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [
                      new Intl.NumberFormat("es-DO", {
                        style: "currency",
                        currency: "DOP",
                        minimumFractionDigits: 2,
                      }).format(value),
                      name === "aportado" ? "Capital aportado" : "Intereses",
                    ]}
                    labelFormatter={(label: string) => `Año ${label}`}
                  />
                  {/* Mismo motivo que en las barras: el color de serie no
                      sirve como color de texto en tema claro. */}
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-foreground">
                        {value === "aportado" ? "Capital aportado" : "Intereses"}
                      </span>
                    )}
                    wrapperStyle={{ fontSize: "0.8rem" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aportado"
                    stackId="1"
                    stroke={CHART_COLORS.info}
                    fill="url(#aportadoFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="intereses"
                    stackId="1"
                    stroke={CHART_COLORS.positive}
                    fill="url(#interesesFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <DistributionBar segments={segments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle año por año</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Año</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead className="text-right">Aportes</TableHead>
                  <TableHead className="text-right">Intereses</TableHead>
                  <TableHead className="pr-5 text-right">Saldo final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="pl-5 font-medium">{row.year}</TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {row.rate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {formatMoney(row.openingBalance)}
                    </TableCell>
                    <TableCell className="tabular text-right text-info-fg">
                      {formatMoney(row.contributed)}
                    </TableCell>
                    <TableCell className="tabular text-right text-positive-fg">
                      {formatMoney(row.interest)}
                    </TableCell>
                    <TableCell className="tabular pr-5 text-right font-semibold">
                      {formatMoney(row.closingBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {result.rows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Indica un plazo de al menos 1 año para ver la proyección.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function clampYears(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, MAX_YEARS);
}

function ResultTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "info" | "positive";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "accent" && "border-accentAlt/40 bg-accentAlt/10",
        tone === "info" && "border-info/40 bg-info/10",
        tone === "positive" && "border-positive/40 bg-positive/10",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular text-xl font-bold",
          tone === "accent" && "text-accentAlt",
          tone === "info" && "text-info-fg",
          tone === "positive" && "text-positive-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
