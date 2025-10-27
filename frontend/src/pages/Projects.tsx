import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreVertical, Clock, Pencil, Trash2 } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { useTimeEntries } from "@/hooks/useTimeEntries"
import { calculateProjectHours, formatDurationHuman } from "@/lib/utils"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { EditProjectDialog } from "@/components/projects/EditProjectDialog"
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/types"

export default function ProjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: timeEntriesData } = useTimeEntries()
  const timeEntries = timeEntriesData?.timeEntries || []

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setEditDialogOpen(true)
  }

  const handleDelete = (project: Project) => {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }

  if (projectsLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-balance">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No projects yet. Create your first project to get started!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalHours = calculateProjectHours(project._id, timeEntries)
            const progressPercentage = project.budget
              ? Math.min((totalHours / project.budget) * 100, 100)
              : 0

            return (
              <Card key={project._id} className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    {project.client && (
                      <p className="text-muted-foreground text-sm">{project.client}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(project)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={project.status === "active" ? "default" : "secondary"}
                    >
                      {project.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="h-3 w-3" />
                      {formatDurationHuman(totalHours * 3600)}
                    </div>
                  </div>

                  {project.budget && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full"
                          style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: project.color || "#3B82F6",
                          }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatDurationHuman(totalHours * 3600)} of {formatDurationHuman(project.budget * 3600)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={selectedProject}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={selectedProject}
      />
    </div>
  )
}