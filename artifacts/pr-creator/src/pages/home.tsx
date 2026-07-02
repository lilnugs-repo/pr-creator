import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GitPullRequest, Loader2, CheckCircle2, AlertCircle, ExternalLink, FileText, GitBranch, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCreatePullRequest } from "@workspace/api-client-react";

const formSchema = z.object({
  title: z.string().optional(),
  text: z.string().min(1, "File content is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      text: "",
    },
  });

  const { mutate: createPullRequest, isPending, isSuccess, data, isError, error, reset } = useCreatePullRequest();

  const onSubmit = (values: FormValues) => {
    createPullRequest({ data: values });
  };

  const handleReset = () => {
    reset();
    form.reset();
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg shadow-black/50 mb-4 animate-in slide-in-from-bottom-4 duration-500">
            <GitPullRequest className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight animate-in fade-in duration-700">PR Creator</h1>
          <p className="text-muted-foreground font-mono text-sm animate-in fade-in duration-700 delay-150">org-git-fked/git-fked-x2</p>
        </div>

        <Card className="shadow-2xl shadow-black/40 border-border/50 backdrop-blur-xl bg-card/90 animate-in fade-in zoom-in-95 duration-500 delay-150">
          <CardContent className="pt-6">
            {isSuccess && data ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center space-y-6 py-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Pull Request Created</h2>
                  <p className="text-muted-foreground">Your changes have been successfully committed.</p>
                </div>

                <div className="w-full bg-background rounded-lg border border-border p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <GitPullRequest className="w-4 h-4" />
                      <span>PR Number</span>
                    </div>
                    <span className="font-mono text-foreground">#{data.prNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <GitBranch className="w-4 h-4" />
                      <span>Branch</span>
                    </div>
                    <span className="font-mono text-foreground truncate max-w-[150px] sm:max-w-xs">{data.branch}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>File</span>
                    </div>
                    <span className="font-mono text-foreground truncate max-w-[150px] sm:max-w-xs">{data.fileName}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                  <Button asChild className="w-full flex-1" size="lg">
                    <a href={data.prUrl} target="_blank" rel="noreferrer" data-testid="link-view-pr">
                      View on GitHub
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" size="lg" onClick={handleReset} data-testid="button-create-another">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Create Another
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">PR Title (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Update configuration..."
                            className="font-mono bg-background/50 border-border/50 focus-visible:ring-primary h-12"
                            data-testid="input-pr-title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">File Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter text to commit..."
                            className="font-mono min-h-[200px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary p-4"
                            data-testid="textarea-pr-content"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isError && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription className="font-mono text-xs mt-1">
                        {error?.data?.message || "Failed to create pull request. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-medium transition-all active:scale-[0.98]"
                    disabled={isPending}
                    data-testid="button-submit-pr"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating PR...
                      </>
                    ) : (
                      <>
                        Create Pull Request
                        <GitPullRequest className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
