import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeXml, ExternalLink, Star, GitBranch } from "lucide-react";

export interface GitHubRepoItem {
  id: number | string;
  name: string;
  html_url: string;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
}

export function GitHubRepos({ repos }: { repos: GitHubRepoItem[] }) {
  if (!repos || !Array.isArray(repos)) return null;

  return (
    <Card className="w-full max-w-md shadow-2xl border-border bg-card/80 backdrop-blur-xl mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CodeXml className="h-5 w-5" />
              Public Repositories
            </CardTitle>
            <CardDescription>
              Total: {repos.length} repos found
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {repos.map((repo) => (
              <div 
                key={repo.id} 
                className="group p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/40 hover:bg-secondary/60 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground truncate max-w-[200px]">
                    {repo.name}
                  </h3>
                  <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {repo.description || "No description provided"}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="h-3 w-3" />
                    {repo.stargazers_count ?? 0}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    {repo.forks_count ?? 0}
                  </div>
                  {repo.language && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary ml-auto">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {repo.language}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
