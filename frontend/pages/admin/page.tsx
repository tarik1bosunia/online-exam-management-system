'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, Search, FileText, Calendar, Users, Home } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";



export default function AdminDashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const questions = [
    { id: 1, title: "What is Python?", complexity: "Class 1", type: "single_choice", score: 1 },
    { id: 2, title: "Explain OOP concepts", complexity: "Class 2", type: "text", score: 5 },
    { id: 3, title: "Multiple inheritance benefits", complexity: "Class 3", type: "multi_choice", score: 2 },
  ];

  const exams = [
    { id: 1, title: "Python Basics Test", questions: 20, duration: "60 min", status: "Published" },
    { id: 2, title: "Advanced Programming", questions: 15, duration: "90 min", status: "Draft" },
  ];

  const handleFileUpload = () => {
    toast.success("Excel file uploaded successfully! Questions are being processed.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage questions and exams</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Users className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="questions">Question Bank</TabsTrigger>
            <TabsTrigger value="exams">Exam Management</TabsTrigger>
          </TabsList>

          {/* Question Bank Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
            </div>

            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{question.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{question.complexity}</Badge>
                          <Badge variant="outline">{question.type.replace("_", " ")}</Badge>
                          <Badge className="bg-accent text-accent-foreground">{question.score} pts</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Import Questions</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  Upload an Excel file with your questions to automatically populate the question bank
                </p>
                <Button onClick={handleFileUpload}>Choose File</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Management Tab */}
          <TabsContent value="exams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Exams</h2>
              <Button onClick={() => router.push("/admin/create-exam")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </div>

            <div className="grid gap-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          <Badge 
                            variant={exam.status === "Published" ? "default" : "secondary"}
                            className={exam.status === "Published" ? "bg-success" : ""}
                          >
                            {exam.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {exam.questions} questions
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {exam.duration}
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Create Your First Exam</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  Select questions from your question bank to create a new exam
                </p>
                <Button onClick={() => router.push("/admin/create-exam")}>Get Started</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

