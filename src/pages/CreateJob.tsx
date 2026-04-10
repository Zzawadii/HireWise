import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    required_skills: "",
    experience_level: "",
    top_performer_profile: "",
    weight_skills: 40,
    weight_experience: 30,
    weight_culture: 30,
  });

  const updateWeight = (field: string, value: number) => {
    const remaining = 100 - value;
    const others = ["weight_skills", "weight_experience", "weight_culture"].filter((k) => k !== field);
    const currentOtherTotal = (form as any)[others[0]] + (form as any)[others[1]];
    const ratio0 = currentOtherTotal > 0 ? (form as any)[others[0]] / currentOtherTotal : 0.5;

    setForm({
      ...form,
      [field]: value,
      [others[0]]: Math.round(remaining * ratio0),
      [others[1]]: remaining - Math.round(remaining * ratio0),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: form.title,
        department: form.department,
        description: form.description,
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience_level: form.experience_level,
        top_performer_profile: form.top_performer_profile,
        weight_skills: form.weight_skills,
        weight_experience: form.weight_experience,
        weight_culture: form.weight_culture,
      });
      if (error) throw error;
      toast.success("Job created!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Job Posting</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Full-Stack Engineer" required />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and expectations..." rows={4} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Skills (comma-separated)</Label>
                  <Input value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="React, TypeScript, Node.js" required />
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Input value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })} placeholder="Senior (5+ years)" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cultural DNA Profile</CardTitle>
              <CardDescription>Describe your ideal top performer to help AI assess culture fit</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={form.top_performer_profile} onChange={(e) => setForm({ ...form, top_performer_profile: e.target.value })} placeholder="Our top performers are proactive problem-solvers who take ownership..." rows={3} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scoring Weights</CardTitle>
              <CardDescription>Adjust how much each factor influences the final ranking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <Label>Skills Match</Label>
                  <span className="font-semibold text-primary">{form.weight_skills}%</span>
                </div>
                <Slider value={[form.weight_skills]} onValueChange={([v]) => updateWeight("weight_skills", v)} max={100} step={5} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <Label>Experience</Label>
                  <span className="font-semibold text-primary">{form.weight_experience}%</span>
                </div>
                <Slider value={[form.weight_experience]} onValueChange={([v]) => updateWeight("weight_experience", v)} max={100} step={5} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <Label>Culture Fit</Label>
                  <span className="font-semibold text-primary">{form.weight_culture}%</span>
                </div>
                <Slider value={[form.weight_culture]} onValueChange={([v]) => updateWeight("weight_culture", v)} max={100} step={5} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
