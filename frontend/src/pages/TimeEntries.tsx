import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Square, MoreVertical, Loader2, ArrowUp, ArrowDown } from "lucide-react"
import { useTimeEntries, useActiveTimer, useStopTimer } from "@/hooks/useTimeEntries"
import { formatDateTime, formatDurationSeconds, formatDurationHuman } from "@/lib/utils"
import { StartTimerDialog } from "@/components/time-entries/StartTimerDialog"
import { EditTimeEntryDialog } from "@/components/time-entries/EditTimeEntryDialog"
import { DeleteTimeEntryDialog } from "@/components/time-entries/DeleteTimeEntryDialog"
import { DateFilter } from "@/components/shared/DateFilter"
import type { TimeEntry, TimeEntriesFilters, DateFilterType } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TimeEntriesPage() {
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00")
  const [dateFilter, setDateFilter] = useState<DateFilterType>('day')
  const [filters, setFilters] = useState<TimeEntriesFilters>({
    orderDirection: 'desc',
    dateFilter: 'day',
  })

  // Update filters when date filter changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      dateFilter,
      // Remove startDate/endDate when using dateFilter
      startDate: undefined,
      endDate: undefined,
    }))
  }, [dateFilter])

  const { data: timeEntriesData, isLoading: entriesLoading } = useTimeEntries(filters)
  const { data: activeTimer, isLoading: activeLoading } = useActiveTimer()
  const stopTimer = useStopTimer()

  // Client-side elapsed time calculation for active timer
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime("00:00:00")
      return
    }

    const updateElapsed = () => {
      const startTime = new Date(activeTimer.startTime).getTime()
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      setElapsedTime(formatDurationSeconds(elapsedSeconds))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeTimer])

  const handleStopTimer = async () => {
    if (!activeTimer) return
    await stopTimer.mutateAsync(undefined)
  }

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setEditDialogOpen(true)
  }

  const handleDelete = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setDeleteDialogOpen(true)
  }

  const timeEntries = timeEntriesData?.timeEntries || []

  const toggleSortDirection = () => {
    setFilters((prev) => ({
      ...prev,
      orderDirection: prev.orderDirection === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Time Entries</h1>
          <p className="text-muted-foreground">Track and manage your time logs.</p>
        </div>
        <div className="flex items-center gap-4">
          <DateFilter value={dateFilter} onChange={setDateFilter} className="w-[140px]" />
          <Button
            variant="outline"
            onClick={toggleSortDirection}
            className="flex items-center gap-2"
          >
            {filters.orderDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            Sort by Date
          </Button>
          <Button onClick={() => setStartDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Active Timer Card */}
      {activeLoading ? (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : activeTimer ? (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {typeof activeTimer.taskId === "object" && activeTimer.taskId.name
                    ? activeTimer.taskId.name
                    : "Task"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(activeTimer.startTime, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Started at {formatDateTime(activeTimer.startTime, { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="font-mono text-2xl font-bold">{elapsedTime}</p>
              </div>
              
              {/* Timer Control Button */}
              <div className="flex gap-2">
                <Button variant="destructive" size="lg" onClick={handleStopTimer} disabled={stopTimer.isPending}>
                  <Square className="mr-2 h-4 w-4" />
                  {stopTimer.isPending ? "Stopping..." : "Stop"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="mb-4 text-muted-foreground">No active timer</p>
            <Button onClick={() => setStartDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Start New Timer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Time Entries List */}
      {entriesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : timeEntries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">No time entries yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {timeEntries.map((entry) => (
            <Card key={entry._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {typeof entry.taskId === "object"
                        ? entry.taskId.name
                        : "Task"}
                    </h3>
                    {typeof entry.taskId === "object" &&
                      typeof entry.taskId.projectId === "object" && (
                        <Badge variant="outline" className="text-xs">
                          {entry.taskId.projectId.name}
                        </Badge>
                      )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {formatDateTime(entry.startTime, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDateTime(entry.startTime, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {entry.endTime &&
                        ` - ${formatDateTime(entry.endTime, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {entry.duration ? (
                      <p className="font-mono text-lg font-semibold">
                        {formatDurationHuman(entry.duration)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Running...</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(entry)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(entry)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <StartTimerDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
      />
      <EditTimeEntryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        timeEntry={selectedEntry}
      />
      <DeleteTimeEntryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        timeEntry={selectedEntry}
      />
    </div>
  )
}
