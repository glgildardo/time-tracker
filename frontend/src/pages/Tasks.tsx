import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Clock } from "lucide-react"

const tasks = [
  {
    id: 1,
    title: "Design homepage mockups",
    project: "Website Redesign",
    priority: "high",
    status: "in-progress",
    estimatedHours: 8,
    loggedHours: 5.5,
    dueDate: "2025-10-22",
  },
  {
    id: 2,
    title: "Implement user authentication",
    project: "Mobile App Development",
    priority: "high",
    status: "in-progress",
    estimatedHours: 12,
    loggedHours: 8.2,
    dueDate: "2025-10-25",
  },
  {
    id: 3,
    title: "Write API documentation",
    project: "API Integration",
    priority: "medium",
    status: "todo",
    estimatedHours: 6,
    loggedHours: 0,
    dueDate: "2025-10-28",
  },
  {
    id: 4,
    title: "Database schema optimization",
    project: "Database Migration",
    priority: "high",
    status: "completed",
    estimatedHours: 10,
    loggedHours: 12.3,
    dueDate: "2025-10-18",
  },
  {
    id: 5,
    title: "Create button component variants",
    project: "UI Component Library",
    priority: "medium",
    status: "in-progress",
    estimatedHours: 4,
    loggedHours: 2.5,
    dueDate: "2025-10-24",
  },
  {
    id: 6,
    title: "Setup payment gateway",
    project: "E-commerce Platform",
    priority: "high",
    status: "todo",
    estimatedHours: 15,
    loggedHours: 0,
    dueDate: "2025-11-01",
  },
  {
    id: 7,
    title: "Responsive layout testing",
    project: "Website Redesign",
    priority: "low",
    status: "todo",
    estimatedHours: 5,
    loggedHours: 0,
    dueDate: "2025-10-30",
  },
  {
    id: 8,
    title: "Code review and refactoring",
    project: "Mobile App Development",
    priority: "medium",
    status: "in-progress",
    estimatedHours: 8,
    loggedHours: 3.8,
    dueDate: "2025-10-26",
  },
]

const priorityColors: Record<string, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

export default function TasksPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-balance">Tasks</h1>
          <p className="text-muted-foreground">Organize and track your work items.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Checkbox checked={task.status === "completed"} className="h-5 w-5" />

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.title}
                  </h3>
                  <Badge variant={priorityColors[task.priority]} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span>{task.project}</span>
                  <span>•</span>
                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{task.loggedHours}h</span>
                    <span className="text-muted-foreground">/ {task.estimatedHours}h</span>
                  </div>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min((task.loggedHours / task.estimatedHours) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Log Time
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
