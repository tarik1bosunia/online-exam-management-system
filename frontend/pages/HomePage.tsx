'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Award } from "lucide-react";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Online Exam Management System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for creating, managing, and taking online exams with automatic grading and real-time progress tracking.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 cursor-pointer" onClick={() => router.push("/admin")}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Admin Portal</CardTitle>
                  <CardDescription>Manage questions and exams</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                  Import questions from Excel
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                  Create and publish exams
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                  View student results
                </li>
              </ul>
              <Button className="w-full mt-6" size="lg">
                Enter as Admin
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 cursor-pointer" onClick={() => router.push("/student")}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Student Portal</CardTitle>
                  <CardDescription>Take exams and view results</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" />
                  View available exams
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" />
                  Auto-save exam progress
                </li>
                <li className="flex items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent mr-2" />
                  Get instant results
                </li>
              </ul>
              <Button className="w-full mt-6 bg-accent hover:bg-accent/90" size="lg">
                Enter as Student
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Auto-Grading</h3>
              <p className="text-sm text-muted-foreground">
                Instant results with automatic evaluation of objective questions
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Question Bank</h3>
              <p className="text-sm text-muted-foreground">
                Import and manage thousands of questions with ease
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Real-time auto-save and resume functionality
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

