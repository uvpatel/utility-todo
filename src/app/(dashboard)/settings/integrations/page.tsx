import { getGmailConnection, getGmailMessages } from "@/lib/actions/gmail";
import { getGitHubConnection, getGitHubRepositories } from "@/lib/actions/github";
import { IntegrationsPage } from "@/components/integrations-page";

export default async function SettingsIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queryStatus = typeof params.status === "string" ? params.status : undefined;
  const queryError = typeof params.error === "string" ? params.error : undefined;
  const githubStatusParam = typeof params.github_status === "string" ? params.github_status : undefined;
  const githubErrorParam = typeof params.github_error === "string" ? params.github_error : undefined;

  const [gmailStatus, githubStatus] = await Promise.all([
    getGmailConnection(),
    getGitHubConnection(),
  ]);

  const [initialData, githubRepositories] = await Promise.all([
    gmailStatus.isConnected
      ? getGmailMessages()
      : { messages: [], isConnected: false, isDemo: false, nextPageToken: undefined, resultSizeEstimate: undefined },
    githubStatus.isConnected ? getGitHubRepositories() : [],
  ]);

  return (
    <IntegrationsPage
      initialStatus={gmailStatus}
      initialMessages={initialData.messages}
      initialNextPageToken={initialData.nextPageToken}
      initialTotalEstimate={initialData.resultSizeEstimate}
      queryStatus={queryStatus}
      queryError={queryError}
      initialGitHubStatus={githubStatus}
      initialGitHubRepositories={githubRepositories}
      githubStatusParam={githubStatusParam}
      githubErrorParam={githubErrorParam}
    />
  );
}
