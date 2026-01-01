import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, TrendingDown, FileCheck, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RentGuaranteeList } from '@/components/RentGuaranteeList';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function RentGuarantee() {
  const { t } = useTranslation();
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== 'landlord') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Garantia de Renda</h1>
              <p className="text-muted-foreground">
                Proteção contra incumprimento de pagamento
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Meses de Cobertura</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingDown className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-50%</p>
                  <p className="text-xs text-muted-foreground">Desconto Máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileCheck className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-muted-foreground">Despesas Legais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">90</p>
                  <p className="text-xs text-muted-foreground">Dias Carência</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>
              Proteção inteligente baseada no Trust Score do inquilino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-semibold">Solicite Cotação</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Aceda ao contrato e solicite uma cotação. O prémio é calculado automaticamente com base no Trust Score do inquilino.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <h3 className="font-semibold">Ative a Proteção</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Confirme e pague o prémio anual. A cobertura começa imediatamente após aprovação.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <h3 className="font-semibold">Fique Protegido</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Em caso de incumprimento, reporte o sinistro e receba até 12 meses de renda mais despesas legais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Tabela de Descontos</CardTitle>
            <CardDescription>
              Quanto maior o Trust Score do inquilino, menor o prémio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Trust Score</th>
                    <th className="text-left py-3 px-4 font-medium">Desconto</th>
                    <th className="text-left py-3 px-4 font-medium">Taxa Final</th>
                    <th className="text-left py-3 px-4 font-medium">Exemplo (€1.000/mês)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">0-30</td>
                    <td className="py-3 px-4 text-muted-foreground">0%</td>
                    <td className="py-3 px-4">4.0%</td>
                    <td className="py-3 px-4">€480/ano</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">31-50</td>
                    <td className="py-3 px-4 text-green-600">-10%</td>
                    <td className="py-3 px-4">3.6%</td>
                    <td className="py-3 px-4">€432/ano</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">51-70</td>
                    <td className="py-3 px-4 text-green-600">-20%</td>
                    <td className="py-3 px-4">3.2%</td>
                    <td className="py-3 px-4">€384/ano</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">71-85</td>
                    <td className="py-3 px-4 text-green-600">-30%</td>
                    <td className="py-3 px-4">2.8%</td>
                    <td className="py-3 px-4">€336/ano</td>
                  </tr>
                  <tr className="border-b bg-primary/5">
                    <td className="py-3 px-4 font-medium">86-100</td>
                    <td className="py-3 px-4 text-green-600 font-medium">-40%</td>
                    <td className="py-3 px-4 font-medium">2.4%</td>
                    <td className="py-3 px-4 font-medium">€288/ano</td>
                  </tr>
                  <tr className="bg-green-500/10">
                    <td className="py-3 px-4 font-medium">+ Open Banking</td>
                    <td className="py-3 px-4 text-green-600 font-medium">-10% extra</td>
                    <td className="py-3 px-4 font-medium">até 2.0%</td>
                    <td className="py-3 px-4 font-medium">€240/ano</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Guarantees List */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <RentGuaranteeList />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <RentGuaranteeList />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
