import { usePatients } from "@/hooks/use-patients";
import { useGuarantors } from "@/hooks/use-guarantors";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Users, FileCheck, Building2, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const COLORS = ['#3b82f6', '#eab308', '#a855f7', '#f97316', '#22c55e'];

export default function Dashboard() {
  const { data: patients, isLoading: pLoading } = usePatients();
  const { data: guarantors, isLoading: gLoading } = useGuarantors();

  if (pLoading || gLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const patientList = patients || [];
  const totalPatients = patientList.length;
  const activeCases = patientList.filter(p => p.status !== "Paid" && p.status !== "Returned").length;
  const lockedFiles = patientList.filter(p => p.isLocked).length;

  // Calculate status distribution
  const statusCounts = patientList.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Rahatuk Medical Services case management summary.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">All registered cases</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCases}</div>
            <p className="text-xs text-muted-foreground">In progress / Traveling</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed/Paid</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lockedFiles}</div>
            <p className="text-xs text-muted-foreground">Locked files</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guarantors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guarantors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Partner organizations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Recent Patients List */}
        <Card className="col-span-4 shadow-md">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Latest 5 registered cases.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientList.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <Link href={`/patients/${patient.id}`} className="font-medium hover:text-primary transition-colors">
                      {patient.fullName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {patient.passportNumber} • {patient.destination || "No destination"}
                    </div>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>
              ))}
              {patientList.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No patients found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="col-span-3 shadow-md">
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
