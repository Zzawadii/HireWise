import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Shield, Brain, ChevronDown, ChevronUp, MessageSquare, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ScreeningResult {
  id: string;
  candidate_id: string;
  job_id: string;
  user_id: string;
  final_score: number;
  strengths: string[];
  gaps: string[];
  culture_fit: string;
  skill_tags: string[];
  interview_questions: string[];
  candidate?: any;
}

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-score-high";
  if (score >= 50) return "text-score-medium";
  return "text-score-low";
};

const getScoreBg = (score: number) => {
  if (score >= 70) return "bg-score-high";
  if (score >= 50) return "bg-score-medium";
  return "bg-score-low";
};

const getCultureBadge = (fit: string) => {
  const lower = fit?.toLowerCase() || "";
  if (lower.includes("high")) return { variant: "default" as const, className: "bg-success text-success-foreground" };
  if (lower.includes("medium")) return { variant: "default" as const, className: "bg-warning text-warning-foreground" };
  return { variant: "destructive" as const, className: "" };
};

const getTagColor = (tag: string) => {
  const tech = ["react", "typescript", "node", "python", "java", "go", "sql", "postgresql", "aws", "docker", "kubernetes", "css", "html", "vue", "angular", "redis", "mongodb", "terraform", "ci/cd", "testing", "stripe", "system design", "microservices", "data visualization", "machine learning", "tailwind"];
  const soft = ["leadership", "mentoring", "team player", "communication", "problem solving", "collaboration", "adaptability", "ownership", "proactive"];
  const lower = tag.toLowerCase();
  if (tech.some((t) => lower.includes(t))) return "bg-tag-technical/10 text-tag-technical border-tag-technical/20";
  if (soft.some((t) => lower.includes(t))) return "bg-tag-soft/10 text-tag-soft border-tag-soft/20";
  return "bg-tag-domain/10 text-tag-domain border-tag-domain/20";
};

const Results = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState(searchParams.get("job") || "");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [screening, setScreening] = useState(false);
  const [biasMode, setBiasMode] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ScreeningResult | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "culture">("score");
  const [weights, setWeights] = useState({ skills: 40, experience: 30, culture: 30 });

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data ?? []);
        if (!selectedJob && data?.length) setSelectedJob(data[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !selectedJob) return;
    const load = async () => {
      const [candsRes, resultsRes, jobRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("user_id", user.id).eq("job_id", selectedJob),
        supabase.from("screening_results").select("*").eq("user_id", user.id).eq("job_id", selectedJob),
        supabase.from("jobs").select("*").eq("id", selectedJob).single(),
      ]);
      setCandidates(candsRes.data ?? []);
      if (jobRes.data) {
        setWeights({
          skills: jobRes.data.weight_skills || 40,
          experience: jobRes.data.weight_experience || 30,
          culture: jobRes.data.weight_culture || 30,
        });
      }
      // Merge candidate data into results
      const merged = (resultsRes.data ?? []).map((r: any) => ({
        ...r,
        candidate: (candsRes.data ?? []).find((c: any) => c.id === r.candidate_id),
      }));
      setResults(merged);
    };
    load();
  }, [user, selectedJob]);

  const screenCandidates = async () => {
    if (!user || !selectedJob) return;
    setScreening(true);

    try {
      const job = jobs.find((j) => j.id === selectedJob);
      if (!job) throw new Error("Job not found");

      const { data, error } = await supabase.functions.invoke("screen-candidates", {
        body: {
          job_id: selectedJob,
          job_description: job.description,
          required_skills: job.required_skills,
          experience_level: job.experience_level,
          top_performer_profile: job.top_performer_profile,
          weight_skills: weights.skills,
          weight_experience: weights.experience,
          weight_culture: weights.culture,
          candidates: candidates.map((c) => ({
            id: c.id,
            name: c.name,
            resume_text: c.resume_text,
            skills: c.skills,
          })),
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Rate limit")) toast.error("AI rate limited. Please try again in a moment.");
        else if (data.error.includes("Payment")) toast.error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
        else throw new Error(data.error);
        return;
      }

      // Save results
      const resultsToInsert = (data.results || []).map((r: any) => ({
        candidate_id: r.candidate_id,
        job_id: selectedJob,
        user_id: user.id,
        final_score: r.final_score,
        strengths: r.strengths,
        gaps: r.gaps,
        culture_fit: r.culture_fit,
        skill_tags: r.skill_tags,
        interview_questions: r.interview_questions,
      }));

      // Delete old results first
      await supabase.from("screening_results").delete().eq("user_id", user.id).eq("job_id", selectedJob);
      const { error: insertError } = await supabase.from("screening_results").insert(resultsToInsert);
      if (insertError) throw insertError;

      // Reload
      const { data: newResults } = await supabase.from("screening_results").select("*").eq("user_id", user.id).eq("job_id", selectedJob);
      const merged = (newResults ?? []).map((r: any) => ({
        ...r,
        candidate: candidates.find((c) => c.id === r.candidate_id),
      }));
      setResults(merged);
      toast.success("Screening complete!");
    } catch (err: any) {
      toast.error(err.message || "Screening failed");
    } finally {
      setScreening(false);
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === "score") return b.final_score - a.final_score;
      const fitOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (fitOrder[b.culture_fit?.toLowerCase()] || 0) - (fitOrder[a.culture_fit?.toLowerCase()] || 0);
    });
  }, [results, sortBy]);

  const anonymize = (name: string, index: number) => biasMode ? `Candidate ${String.fromCharCode(65 + index)}` : name;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Screening Results</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="bias" className="text-sm">Bias Reduction</Label>
              <Switch id="bias" checked={biasMode} onCheckedChange={setBiasMode} />
            </div>
          </div>
        </div>

        {/* Job selector */}
        <div className="flex gap-4 flex-wrap items-end">
          <div className="w-72">
            <Label className="mb-2 block">Select Job</Label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger><SelectValue placeholder="Choose a job..." /></SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={screenCandidates} disabled={screening || candidates.length === 0}>
            {screening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {screening ? "Screening..." : "Screen with AI"}
          </Button>
        </div>

        {/* Weights control */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adjust Scoring Weights</CardTitle>
              <CardDescription>Change weights and re-screen to see updated rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Skills</Label><span className="font-semibold text-primary">{weights.skills}%</span>
                  </div>
                  <Slider value={[weights.skills]} max={100} step={5} onValueChange={([v]) => {
                    const rem = 100 - v;
                    const ratio = weights.experience / (weights.experience + weights.culture || 1);
                    setWeights({ skills: v, experience: Math.round(rem * ratio), culture: rem - Math.round(rem * ratio) });
                  }} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Experience</Label><span className="font-semibold text-primary">{weights.experience}%</span>
                  </div>
                  <Slider value={[weights.experience]} max={100} step={5} onValueChange={([v]) => {
                    const rem = 100 - v;
                    const ratio = weights.skills / (weights.skills + weights.culture || 1);
                    setWeights({ experience: v, skills: Math.round(rem * ratio), culture: rem - Math.round(rem * ratio) });
                  }} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Culture Fit</Label><span className="font-semibold text-primary">{weights.culture}%</span>
                  </div>
                  <Slider value={[weights.culture]} max={100} step={5} onValueChange={([v]) => {
                    const rem = 100 - v;
                    const ratio = weights.skills / (weights.skills + weights.experience || 1);
                    setWeights({ culture: v, skills: Math.round(rem * ratio), experience: rem - Math.round(rem * ratio) });
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sort */}
        {results.length > 0 && (
          <div className="flex gap-2">
            <Button variant={sortBy === "score" ? "default" : "outline"} size="sm" onClick={() => setSortBy("score")}>Sort by Score</Button>
            <Button variant={sortBy === "culture" ? "default" : "outline"} size="sm" onClick={() => setSortBy("culture")}>Sort by Culture Fit</Button>
          </div>
        )}

        {/* Results list */}
        {sortedResults.length > 0 ? (
          <div className="space-y-3">
            {sortedResults.map((result, idx) => (
              <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCandidate(result)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="text-2xl font-bold text-muted-foreground w-8 text-center">#{idx + 1}</div>

                    {/* Score */}
                    <div className="w-16 text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(result.final_score)}`}>{result.final_score}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{anonymize(result.candidate?.name || "Unknown", idx)}</span>
                        <Badge className={getCultureBadge(result.culture_fit).className}>{result.culture_fit}</Badge>
                      </div>
                      {!biasMode && <p className="text-sm text-muted-foreground">{result.candidate?.email}</p>}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {(result.skill_tags || []).slice(0, 6).map((tag) => (
                          <Badge key={tag} variant="outline" className={`text-xs ${getTagColor(tag)}`}>{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-32 hidden md:block">
                      <Progress value={result.final_score} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates.length > 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No screening results yet. Click "Screen with AI" to analyze candidates.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No candidates for this job. Add candidates first.</p>
            </CardContent>
          </Card>
        )}

        {/* Candidate Detail Dialog */}
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span>{biasMode ? `Candidate ${String.fromCharCode(65 + sortedResults.indexOf(selectedCandidate))}` : selectedCandidate.candidate?.name}</span>
                    <Badge className={getCultureBadge(selectedCandidate.culture_fit).className}>{selectedCandidate.culture_fit} Fit</Badge>
                  </DialogTitle>
                </DialogHeader>

                {/* Score gauge */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(selectedCandidate.final_score)}`}>{selectedCandidate.final_score}</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="flex-1">
                    <Progress value={selectedCandidate.final_score} className="h-3" />
                  </div>
                </div>

                {/* Skill Tags */}
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {(selectedCandidate.skill_tags || []).map((tag) => (
                      <Badge key={tag} variant="outline" className={getTagColor(tag)}>{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />Strengths
                  </h4>
                  <ul className="space-y-1">
                    {(selectedCandidate.strengths || []).map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps / "Why Not" */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    {selectedCandidate.final_score < 60 ? 'Why Not Shortlisted' : 'Areas for Growth'}
                  </h4>
                  <ul className="space-y-1">
                    {(selectedCandidate.gaps || []).map((g, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-warning mt-0.5">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interview Questions */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />Suggested Interview Questions
                  </h4>
                  <ul className="space-y-2">
                    {(selectedCandidate.interview_questions || []).map((q, i) => (
                      <li key={i} className="text-sm p-3 rounded-lg bg-muted/50 border">{q}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Results;
