import Link from "next/link"
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  CommandIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const focusItems = [
  { label: "Plan sprint backlog", status: "In progress", active: true },
  { label: "Review auth guard", status: "Today", active: false },
  { label: "Ship dashboard polish", status: "Done", active: false },
]

const metrics = [
  { label: "Active tasks", value: "18", icon: ListTodoIcon },
  { label: "Done this week", value: "42", icon: CheckCircle2Icon },
  { label: "Focus hours", value: "11.5", icon: Clock3Icon },
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate border-b">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
        <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
              <CommandIcon className="size-4" />
            </span>
            
            Utility Todo
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost">
              <Link href="/dashboard">Dashboard</Link>



              
            </Button>
            <Button asChild variant="ghost">
              <Link href="/todo">Todo</Link>
            </Button>
          </div>
          <Button asChild>
            <Link href="/todo">
              Open app
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </nav>

        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-12 md:px-6 md:pb-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5 gap-2 bg-background/80">
              <SparklesIcon className="size-3.5" />
              shadcn dashboard with a focused todo workflow
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Plan the day, track the work, and keep tasks moving.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Utility Todo combines a fast persisted todo list with a dashboard
              view for workload, completion, priorities, and recent activity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/todo">
                  Add your first task
                  <PlusIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">
                  View dashboard
                  <LayoutDashboardIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardDescription>Today</CardDescription>
                  <CardTitle className="text-2xl">Focus dashboard</CardTitle>
                </div>
                <Badge className="gap-1">
                  <CalendarCheckIcon className="size-3.5" />
                  74% complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border bg-background p-4"
                  >
                    <metric.icon className="mb-3 size-4 text-muted-foreground" />
                    <div className="text-2xl font-semibold tabular-nums">
                      {metric.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {focusItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3"
                  >
                    {item.active ? (
                      <CheckCircle2Icon className="size-5 text-primary" />
                    ) : (
                      <CircleIcon className="size-5 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.status}
                      </div>
                    </div>
                    <Badge variant={item.active ? "default" : "secondary"}>
                      {item.active ? "Live" : "Queued"}
                    </Badge>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr]">
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Weekly progress</div>
                      <div className="text-xs text-muted-foreground">
                        Tasks completed by day
                      </div>
                    </div>
                    <BarChart3Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex h-28 items-end gap-2">
                    {[38, 54, 42, 76, 68, 88, 61].map((height, index) => (
                      <div
                        key={index}
                        className="flex flex-1 items-end rounded-md bg-muted"
                      >
                        <div
                          className="w-full rounded-md bg-primary"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="text-sm font-medium">Next checkpoint</div>
                  <div className="mt-2 text-3xl font-semibold tabular-nums">
                    2:30
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Review open tasks, clear completed work, and pick the next
                    priority.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 md:grid-cols-3 md:px-6">
        {[
          ["Persistent todos", "Zustand keeps draft, filters, and tasks ready."],
          ["Dashboard view", "shadcn cards, charts, table controls, and sidebar."],
          ["Fast workflow", "Add, rename, complete, filter, and bulk clear tasks."],
        ].map(([title, description]) => (
          <Card key={title} className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  )
}
