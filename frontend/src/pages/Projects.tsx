import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Clock } from "lucide-react"

const projects = [
  {
    id: 1,
    name: "Website Redesign",
    client: "Acme Corp",
    status: "active",
    totalHours: 24.5,
    budget: 80,
    color: "bg-chart-1",
  },
  {
    id: 2,
    name: "Mobile App Development",
    client: "TechStart Inc",
    status: "active",
    totalHours: 38.2,
    budget: 120,
    color: "bg-chart-2",
  },
  {
    id: 3,
    name: "API Integration",
    client: "DataFlow Systems",
    status: "active",
    totalHours: 15.8,
    budget: 40,
    color: "bg-chart-3",
  },
  {
    id: 4,
    name: "Database Migration",
    client: "CloudBase",
    status: "completed",
    totalHours: 12.3,
    budget: 20,
    color: "bg-chart-4",
  },
  {
    id: 5,
    name: "UI Component Library",
    client: "DesignHub",
    status: "active",
    totalHours: 31.7,
    budget: 60,
    color: "bg-chart-5",
  },
  {
    id: 6,
    name: "E-commerce Platform",
    client: "ShopEasy",
    status: "planning",
    totalHours: 5.2,
    budget: 150,
    color: "bg-chart-1",
  },
]

export default function ProjectsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-balance">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="relative">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{project.client}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    project.status === "active" ? "default" : project.status === "completed" ? "secondary" : "outline"
                  }
                >
                  {project.status}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-3 w-3" />
                  {project.totalHours}h
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round((project.totalHours / project.budget) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${project.color}`}
                    style={{ width: `${Math.min((project.totalHours / project.budget) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {project.totalHours} of {project.budget} hours
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
