"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Home, PlayCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";


const StudentDashboard = () => {
  const router = useRouter();

  const availableExams = [
    {
      id: 1,
      title: "Python Basics Test",
      description: "Test your knowledge of Python fundamentals",
      questions: 20,
      duration: "60 min",
      startTime: "Nov 18, 2024 10:00 AM",
      endTime: "Nov 22, 2024 11:59 PM",
      status: "available",
    },
    {
      id: 2,
      title: "Advanced Programming",
      description: "Advanced concepts in object-oriented programming",
      questions: 15,
      duration: "90 min",
      startTime: "Nov 20, 2024 09:00 AM",
      endTime: "Nov 25, 2024 11:59 PM",
      status: "available",
    },
  ];

  const completedExams = [
    {
      id: 3,
      title: "Data Structures Quiz",
      score: 85,
      maxScore: 100,
      completedAt: "Nov 15, 2024",
    },
  ];

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
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">View and take your exams</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              Student
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Available Exams */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Exams</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {availableExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{exam.title}</CardTitle>
                    <Badge className="bg-success">Available</Badge>
                  </div>
                  <CardDescription>{exam.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      {exam.questions} questions
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {exam.duration}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Available: {exam.startTime} - {exam.endTime}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => router.push(`/exam/${exam.id}`)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Exams */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Exams</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {completedExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{exam.title}</CardTitle>
                    <Badge variant="outline" className="bg-muted">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  <CardDescription>Completed on {exam.completedAt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Score</p>
                      <p className="text-3xl font-bold text-accent">{exam.score}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Max Score</p>
                      <p className="text-2xl font-semibold text-muted-foreground">{exam.maxScore}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/results/${exam.id}`)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
