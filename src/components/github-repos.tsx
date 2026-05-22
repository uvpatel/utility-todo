import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeXml, ExternalLink, Star, GitBranch } from "lucide-react";

export function GitHubRepos({ repos }: { repos: any[] }) {
  if (!repos || !Array.isArray(repos)) return null;

  return (
    <Card className="w-full max-w-md shadow-2xl border-zinc-200/50 bg-white/80 backdrop-blur-xl mt-6">
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
                className="group p-3 rounded-lg bg-zinc-50 border border-zinc-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 truncate max-w-[200px]">
                    {repo.name}
                  </h3>
                  <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {repo.description || "No description provided"}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Star className="h-3 w-3" />
                    {repo.stargazers_count}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <GitBranch className="h-3 w-3" />
                    {repo.forks_count}
                  </div>
                  {repo.language && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary/70 ml-auto">
                      <span className="w-2 h-2 rounded-full bg-primary/40" />
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