"use client";

import Link from "next/link";
import { Database, Sparkles, Plus, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const demoProjects = [
  {
    id: "analytics",
    name: "Analytics Dashboard",
    description: "Web analytics and user behavior data",
  },
  {
    id: "logs",
    name: "Log Analysis",
    description: "Application logs and error tracking",
  },
  {
    id: "metrics",
    name: "System Metrics",
    description: "Server performance and monitoring data",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Hawkeyes</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            AI-powered ClickHouse SQL view runner. Query your data with natural
            language assistance.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Tambo AI</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-12">
          {demoProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:border-primary cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Open project
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create New Project
            </Button>
          </Link>
        </div>

        <div className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Getting Started
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-semibold">1</span>
              </div>
              <h3 className="font-medium mb-2">Start ClickHouse</h3>
              <p className="text-sm text-muted-foreground">
                Run <code className="bg-muted px-1 rounded">docker-compose up -d</code> to start the local ClickHouse instance.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-semibold">2</span>
              </div>
              <h3 className="font-medium mb-2">Configure Tambo</h3>
              <p className="text-sm text-muted-foreground">
                Set your <code className="bg-muted px-1 rounded">NEXT_PUBLIC_TAMBO_API_KEY</code> in .env.local
              </p>
            </div>
            <div className="text-center">
              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-semibold">3</span>
              </div>
              <h3 className="font-medium mb-2">Start Querying</h3>
              <p className="text-sm text-muted-foreground">
                Browse tables in the sidebar and use AI to help write queries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
