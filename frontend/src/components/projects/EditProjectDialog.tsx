import { ProjectFormDialog } from "./ProjectFormDialog"
import type { Project } from "@/types"

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) {
  return <ProjectFormDialog open={open} onOpenChange={onOpenChange} project={project} />
}
