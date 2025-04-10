import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const modules = [
    {
      title: "Dashboard",
      description: "View key metrics and navigate to other system components",
      href: "/dashboard",
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      href: "/users",
    },
    {
      title: "HR Management",
      description: "Manage employees, departments, and HR processes",
      href: "/hr",
    },
    {
      title: "Help Desk",
      description: "Support ticketing system and knowledge base",
      href: "/helpdesk",
    },
    {
      title: "Document Management",
      description: "Secure document storage and sharing",
      href: "/documents",
    },
    {
      title: "Asset Management",
      description: "Track hardware, software, and other assets",
      href: "/assets",
    },
  ];

  return (
    <>
      <Head>
        <title>Enterprise Management System</title>
        <meta name="description" content="Complete enterprise management solution" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4">
            Enterprise Management System
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            A comprehensive solution for managing your organization's resources, processes, and people.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {modules.map((module) => (
            <Card key={module.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={module.href}>
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}