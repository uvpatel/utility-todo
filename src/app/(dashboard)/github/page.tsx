import { getGitHubDashboardData } from "@/lib/actions/github";
import { GitHubDashboard } from "@/components/github-dashboard";
import { requireAuth } from "@/lib/auth-guard";

export const metadata = {
  title: "GitHub Workspace | Utility Todo",
  description: "Repository visibility, pull request tracking, and bidirectional task synchronization.",
};

export default async function GitHubDashboardPage() {
  await requireAuth();

  const data = await getGitHubDashboardData();

  return (
    <GitHubDashboard
      initialConnection={data.connection}
      initialRepositories={data.repositories}
      initialOpenIssues={data.openIssues}
      initialPullRequests={data.pullRequests}
      initialMappedTasks={data.mappedTasks}
      initialSyncSettings={data.syncSettings}
    />
  );
}
