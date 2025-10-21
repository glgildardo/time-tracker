import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Square, MoreVertical } from "lucide-react"

const timeEntries = [
  {
    id: 1,
    task: "Design homepage mockups",
    project: "Website Redesign",
    date: "2025-10-20",
    startTime: "09:00",
    endTime: "12:30",
    duration: 3.5,
    status: "completed",
  },
  {
    id: 2,
    task: "Implement user authentication",
    project: "Mobile App Development",
    date: "2025-10-20",
    startTime: "13:30",
    endTime: "17:45",
    duration: 4.25,
    status: "completed",
  },
  {
    id: 3,
    task: "Design homepage mockups",
    project: "Website Redesign",
    date: "2025-10-19",
    startTime: "10:00",
    endTime: "12:00",
    duration: 2.0,
    status: "completed",
  },
  {
    id: 4,
    task: "Create button component variants",
    project: "UI Component Library",
    date: "2025-10-19",
    startTime: "14:00",
    endTime: "16:30",
    duration: 2.5,
    status: "completed",
  },
  {
    id: 5,
    task: "Code review and refactoring",
    project: "Mobile App Development",
    date: "2025-10-18",
    startTime: "09:30",
    endTime: "13:15",
    duration: 3.75,
    status: "completed",
  },
  {
    id: 6,
    task: "Database schema optimization",
    project: "Database Migration",
    date: "2025-10-18",
    startTime: "14:00",
    endTime: "18:00",
    duration: 4.0,
    status: "completed",
  },
  {
    id: 7,
    task: "Implement user authentication",
    project: "Mobile App Development",
    date: "2025-10-17",
    startTime: "10:00",
    endTime: "14:00",
    duration: 4.0,
    status: "completed",
  },
]

const currentEntry = {
  task: "Design homepage mockups",
  project: "Website Redesign",
  startTime: "14:30",
  elapsed: "01:23:45",
}

export default function TimeEntriesPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-balance">Time Entries</h1>
          <p className="text-muted-foreground">Track and manage your time logs.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      <Card className="mb-6 border-primary/50 bg-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{currentEntry.task}</h3>
              <p className="text-muted-foreground text-sm">{currentEntry.project}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Started at {currentEntry.startTime}</p>
              <p className="font-mono font-bold text-2xl">{currentEntry.elapsed}</p>
            </div>
            <Button variant="destructive" size="lg">
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {timeEntries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{entry.task}</h3>
                  <Badge variant="outline" className="text-xs">
                    {entry.project}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span>
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {entry.startTime} - {entry.endTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-mono font-semibold text-lg">{entry.duration.toFixed(2)}h</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
