"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  CommandIcon,
  FolderGit2Icon,
  FolderPlusIcon,
  InboxIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  MailIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { useTodoStore, type WorkspaceView } from "@/stores/todo-store";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const {
    tasks,
    projects,
    selectedProjectId,
    setActiveView,
    setSelectedProjectId,
    createProject,
    deleteProject,
    fetchProjects,
  } = useTodoStore();

  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectColor, setNewProjectColor] = React.useState("#0075de");
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const myDayCount = tasks.filter((t) => !t.completed && t.myDay).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim(), newProjectColor);
    setNewProjectName("");
    setIsProjectDrawerOpen(false);
  };

  const navItems = [
    {
      title: "Inbox",
      view: "inbox" as WorkspaceView,
      icon: <InboxIcon className="size-4" />,
      count: activeCount,
      url: "/todo",
    },
    {
      title: "My Day",
      view: "my-day" as WorkspaceView,
      icon: <SunIcon className="size-4 text-amber-500" />,
      count: myDayCount,
      url: "/todo/my-day",
    },
    {
      title: "Upcoming",
      view: "upcoming" as WorkspaceView,
      icon: <CalendarCheckIcon className="size-4 text-indigo-500" />,
      url: "/todo/upcoming",
    },
    {
      title: "Kanban Board",
      view: "kanban" as WorkspaceView,
      icon: <KanbanIcon className="size-4 text-primary" />,
      url: "/todo/kanban",
    },
    {
      title: "Completed",
      view: "completed" as WorkspaceView,
      icon: <CheckCircle2Icon className="size-4 text-emerald-500" />,
      count: completedCount,
      url: "/todo/completed",
    },
  ];

  const currentUser = {
    name: session?.user?.name || "Workspace",
    email: session?.user?.email || "tasks@utility.local",
    avatar: session?.user?.image || null,
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border" {...props}>
      <SidebarHeader className="border-b border-border/50 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent transition-colors"
            >
              <Link href="/todo" className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <CommandIcon className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    Utility Todo
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Focused Workspace
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Workspace views */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground px-2">
            Views
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url && selectedProjectId === null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`gap-3 rounded-lg px-2.5 py-2 font-normal transition-colors ${
                        isActive
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <Link
                        href={item.url}
                        onClick={() => {
                          setActiveView(item.view);
                          setSelectedProjectId(null);
                        }}
                      >
                        {item.icon}
                        <span className="flex-1">{item.title}</span>
                        {typeof item.count === "number" && item.count > 0 && (
                          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Dashboard Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  className={`gap-3 rounded-lg px-2.5 py-2 font-normal transition-colors ${
                    pathname === "/dashboard"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Link href="/dashboard">
                    <LayoutDashboardIcon className="size-4" />
                    <span className="flex-1">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* GitHub Workspace Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/github"}
                  className={`gap-3 rounded-lg px-2.5 py-2 font-normal transition-colors ${
                    pathname === "/github"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Link href="/github">
                    <FolderGit2Icon className="size-4 text-primary" />
                    <span className="flex-1">GitHub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Integrations & Gmail Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/settings/integrations")}
                  className={`gap-3 rounded-lg px-2.5 py-2 font-normal transition-colors ${
                    pathname.startsWith("/settings/integrations")
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Link href="/settings/integrations">
                    <MailIcon className="size-4 text-rose-500" />
                    <span className="flex-1">Gmail & Apps</span>
                    <span className="rounded bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      New
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects section */}
        <SidebarGroup className="mt-4">
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground p-0">
              Projects
            </SidebarGroupLabel>
            <Drawer open={isProjectDrawerOpen} onOpenChange={setIsProjectDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Create Project"
                >
                  <FolderPlusIcon className="size-3.5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="border-border bg-card">
                <DrawerHeader>
                  <DrawerTitle>Create New Project</DrawerTitle>
                  <DrawerDescription>
                    Organize related tasks into focused project workspaces.
                  </DrawerDescription>
                </DrawerHeader>
                <form onSubmit={handleCreateProject} className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Project Name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. Website Redesign, Marketing, Personal"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Color Badge</label>
                    <div className="flex items-center gap-2">
                      {["#0075de", "#2a9d99", "#f77463", "#ffc95e", "#a855f7", "#ec4899"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewProjectColor(color)}
                          className={`size-6 rounded-full transition-transform ${
                            newProjectColor === color ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <DrawerFooter className="px-0 pt-4">
                    <Button type="submit">Create Project</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </form>
              </DrawerContent>
            </Drawer>
          </div>

          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {projects.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground/60 italic">
                  No projects yet
                </div>
              ) : (
                projects.map((proj) => {
                  const isProjActive =
                    pathname === "/todo" && selectedProjectId === proj.id;
                  const projCount = tasks.filter(
                    (t) => !t.completed && t.projectId === proj.id
                  ).length;

                  return (
                    <SidebarMenuItem key={proj.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          if (pathname !== "/todo") {
                            router.push("/todo");
                          }
                        }}
                        isActive={isProjActive}
                        className={`gap-3 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          isProjActive
                            ? "bg-secondary text-foreground font-medium"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="truncate flex-1">{proj.name}</span>
                        {projCount > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {projCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        onClick={() => deleteProject(proj.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer opacity-0 group-hover/menu-item:opacity-100"
                        title="Delete Project"
                      >
                        <Trash2Icon className="size-3" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
