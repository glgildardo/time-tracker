import { TaskFormDialog } from "./TaskFormDialog"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  return <TaskFormDialog open={open} onOpenChange={onOpenChange} />
}

