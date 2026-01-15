"use client";

import Link from "next/link";
import { Database, Sparkles, Droplets } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Fictional water and wastewater agencies from California
const demoProjects = [
  // SF Bay Area (8 agencies)
  {
    id: "eastbay-water",
    name: "East Bay Water Authority",
    description: "Oakland, Berkeley, Emeryville - Water distribution system",
    region: "SF Bay Area",
  },
  {
    id: "peninsula-water",
    name: "Peninsula Water Services",
    description: "San Mateo County - Water and recycled water",
    region: "SF Bay Area",
  },
  {
    id: "marin-water",
    name: "Marin Municipal Water",
    description: "Marin County - Reservoir and distribution management",
    region: "SF Bay Area",
  },
  {
    id: "south-bay-water",
    name: "South Bay Water District",
    description: "San Jose, Santa Clara - Urban water systems",
    region: "SF Bay Area",
  },
  {
    id: "contra-costa-water",
    name: "Contra Costa Water Services",
    description: "Walnut Creek, Concord - Treatment and delivery",
    region: "SF Bay Area",
  },
  {
    id: "napa-valley-water",
    name: "Napa Valley Water Agency",
    description: "Napa County - Agricultural and municipal water",
    region: "SF Bay Area",
  },
  {
    id: "sonoma-water",
    name: "Sonoma County Water",
    description: "Santa Rosa, Petaluma - Regional water supply",
    region: "SF Bay Area",
  },
  {
    id: "alameda-water",
    name: "Alameda Island Water",
    description: "Alameda - Island water infrastructure",
    region: "SF Bay Area",
  },
  // Los Angeles Area (7 agencies)
  {
    id: "la-metro-water",
    name: "LA Metro Water District",
    description: "Downtown LA, Hollywood - Urban water network",
    region: "Los Angeles",
  },
  {
    id: "westside-water",
    name: "Westside Water Authority",
    description: "Santa Monica, Venice - Coastal water systems",
    region: "Los Angeles",
  },
  {
    id: "valley-water-la",
    name: "San Fernando Valley Water",
    description: "Burbank, Glendale - Valley water services",
    region: "Los Angeles",
  },
  {
    id: "long-beach-water",
    name: "Long Beach Water Dept",
    description: "Long Beach - Port area water infrastructure",
    region: "Los Angeles",
  },
  {
    id: "pasadena-water",
    name: "Pasadena Water & Power",
    description: "Pasadena, Altadena - Foothill water systems",
    region: "Los Angeles",
  },
  {
    id: "orange-county-water",
    name: "Orange County Water Agency",
    description: "Anaheim, Irvine - County-wide water management",
    region: "Los Angeles",
  },
  {
    id: "inland-empire-water",
    name: "Inland Empire Water District",
    description: "Riverside, San Bernardino - Regional water supply",
    region: "Los Angeles",
  },
  // San Diego Area (5 agencies)
  {
    id: "san-diego-water",
    name: "San Diego Water Authority",
    description: "San Diego - Metropolitan water distribution",
    region: "San Diego",
  },
  {
    id: "north-county-water",
    name: "North County Water District",
    description: "Oceanside, Carlsbad - Coastal north county",
    region: "San Diego",
  },
  {
    id: "east-county-water",
    name: "East County Water Agency",
    description: "El Cajon, La Mesa - Eastern suburbs",
    region: "San Diego",
  },
  {
    id: "south-bay-sd",
    name: "South Bay Water Services",
    description: "Chula Vista, National City - Border region",
    region: "San Diego",
  },
  {
    id: "imperial-beach-water",
    name: "Imperial Beach Water",
    description: "Imperial Beach - Coastal water systems",
    region: "San Diego",
  },
];

// Group projects by region
const regions = ["SF Bay Area", "Los Angeles", "San Diego"];
const projectsByRegion = regions.map((region) => ({
  region,
  projects: demoProjects.filter((p) => p.region === region),
}));

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Hawkeyes</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-4">
            AI-powered water utility data explorer. Query infrastructure data with natural language.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Tambo AI</span>
          </div>
        </div>

        {projectsByRegion.map(({ region, projects }) => (
          <div key={region} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">{region}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Database className="h-4 w-4 shrink-0" />
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold text-center mb-6">
            Getting Started
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto text-sm">
            <div className="text-center">
              <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-semibold">1</span>
              </div>
              <h3 className="font-medium mb-1">Select an Agency</h3>
              <p className="text-muted-foreground">
                Choose a water utility from the list above to explore its data.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-semibold">2</span>
              </div>
              <h3 className="font-medium mb-1">Browse Tables</h3>
              <p className="text-muted-foreground">
                View available tables like hydrants, valves, mains, and work orders.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-semibold">3</span>
              </div>
              <h3 className="font-medium mb-1">Ask Questions</h3>
              <p className="text-muted-foreground">
                Use the AI assistant to query data in natural language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
