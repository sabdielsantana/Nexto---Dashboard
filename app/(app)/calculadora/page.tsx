import { CompoundCalculator } from "@/components/calculator/compound-calculator";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Calculadora — Nexto" };

export default function CalculatorPage() {
  return (
    <>
      <PageHeader
        title="Calculadora de interés compuesto"
        description="Proyecta cuánto crecerá tu dinero con aportes periódicos y capitalización."
      />
      <CompoundCalculator />
    </>
  );
}
