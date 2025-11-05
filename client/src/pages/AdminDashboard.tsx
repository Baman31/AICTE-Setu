import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Users, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.getAdminDashboard(),
  });

  const stats = [
    { title: "Total Applications", value: String(data?.stats.totalApplications || 0), change: "+12%", icon: FileText },
    { title: "Active Evaluators", value: String(data?.stats.activeEvaluators || 0), change: "+5%", icon: Users },
    { title: "Approval Rate", value: `${data?.stats.approvalRate || 0}%`, change: "+3%", icon: TrendingUp },
    { title: "Avg. Processing Time", value: data?.stats.avgProcessingTime || "0 days", change: "-2 days", icon: Clock },
  ];

  const chartData = data?.chartData || [];

  const workflowStages = (data?.workflowStages || []).map((w: any, i: number) => ({
    stage: w.stage,
    count: w.count,
    color: ["bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-orange-500", "bg-green-500"][i % 5]
  }));

  const alerts = [
    { id: 1, type: "warning", message: "15 applications pending evaluator assignment", icon: AlertTriangle },
    { id: 2, type: "info", message: "8 site visits scheduled for next week", icon: CheckCircle },
    { id: 3, type: "warning", message: "5 applications nearing deadline", icon: Clock },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage the AICTE approval process
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-green-600 font-medium">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowStages.map((item) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.stage}</span>
                  <span className="text-sm text-muted-foreground">{item.count} applications</span>
                </div>
                <Progress value={(item.count / 135) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Alerts</CardTitle>
          <Button variant="outline" size="sm">View All</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                data-testid={`alert-${alert.id}`}
              >
                <Icon className={`w-5 h-5 ${alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
                <p className="text-sm flex-1">{alert.message}</p>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
