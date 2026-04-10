import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import Candidates from "./pages/Candidates";
import Results from "./pages/Results";
import CandidateLanding from "./pages/candidate/CandidateLanding";
import CandidateAuth from "./pages/candidate/CandidateAuth";
import JobBoard from "./pages/candidate/JobBoard";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateFeedback from "./pages/candidate/CandidateFeedback";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Recruiter */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
            <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />

            {/* Candidate */}
            <Route path="/candidate" element={<CandidateLanding />} />
            <Route path="/candidate/auth" element={<CandidateAuth />} />
            <Route path="/candidate/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
            <Route path="/candidate/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/candidate/feedback" element={<ProtectedRoute><CandidateFeedback /></ProtectedRoute>} />
            <Route path="/candidate/profile" element={<ProtectedRoute><CandidateProfile /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
