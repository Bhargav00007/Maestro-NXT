import React from "react";
import { pixelFont } from "@/lib/fonts";

const About = () => {
  return (
    <div className="lg:my-10 lg:mx-36 mx-5 my-5">
      <div className="max-w-4xl pb-5">
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-4xl">
          About{" "}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Maestro
            <span className={`${pixelFont.className} text-xs ml-2 text-2xl font-bold tracking-tight md:text-xl lg:text-xl`}>
              NXT
            </span>
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mt-3 text-justify">
          Real-time Network Monitoring & Packet Analysis Platform
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold lg:text-3xl mb-4">Overview</h2>
        <p className="lg:text-xl text-lg leading-relaxed text-justify">
          Maestro NXT is a cutting-edge network monitoring and packet analysis
          platform designed for modern network administrators and security
          professionals. It provides real-time visibility into network traffic,
          device status, and security events through an intuitive dashboard
          interface.
        </p>
        <p className="lg:text-xl text-lg leading-relaxed mt-4 text-justify">
          The platform captures and analyzes network packets in real-time,
          displaying geographic distribution of traffic, device health metrics,
          and security alerts. With Maestro NXT, you can monitor your entire
          network infrastructure from a single, unified dashboard.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold lg:text-3xl mb-6">
          How It Works: Real-time Data Flow
        </h2>

        <div className="space-y-6">
          

          <div className="border-l-4 border-cyan-500 pl-4">
            <h3 className="text-xl font-semibold">1. Real-time Processing</h3>
            <p className="lg:text-lg text-base mt-2 text-justify">
              The data is analyzed, parsed, and enriched with
              geographic information, device metadata, and threat intelligence
              before being sent to the dashboard.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-xl font-semibold">2. Live Dashboard Updates</h3>
            <p className="lg:text-lg text-base mt-2 text-justify">
              The processed data is pushed to the client-side dashboard using
              WebSocket connections, ensuring zero-latency updates. The World
              Map shows real-time geographic distribution, the Alerts Panel
              displays security events, and the Dashboard Cards show key
              metrics.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-xl font-semibold">3. Data Visualization</h3>
            <p className="lg:text-lg text-base mt-2 text-justify">
              All network data is presented through interactive visualizations
              including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-justify">
              <li>World Map with real-time traffic indicators</li>
              <li>Device health and status monitoring</li>
              <li>Security alerts and threat detection</li>
              <li>Network performance metrics</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold lg:text-3xl mb-6">
          Technology Stack
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <h3 className="text-xl font-semibold text-blue-600">Frontend</h3>
            <ul className="mt-3 space-y-3 flex-1">
              <li className="flex flex-col">
                <div className="font-medium">Next.js 16:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  React framework with App Router for server-side rendering and
                  optimal performance
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">TypeScript:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Type-safe JavaScript for better code quality and developer
                  experience
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Tailwind CSS:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Utility-first CSS framework for rapid UI development with
                  consistent styling
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Shadcn/ui:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Reusable, accessible UI components built with Radix UI and
                  Tailwind
                </div>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <h3 className="text-xl font-semibold text-cyan-600">Backend & Real-time</h3>
            <ul className="mt-3 space-y-3 flex-1">
              <li className="flex flex-col">
                <div className="font-medium">Node.js:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  JavaScript runtime for building scalable network applications
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Pusher:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Real-time WebSocket connections for instant data updates and
                  bidirectional communication
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Express.js:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Web framework for building REST APIs and handling HTTP requests
                </div>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <h3 className="text-xl font-semibold text-purple-600">Data & Visualization</h3>
            <ul className="mt-3 space-y-3 flex-1">
              <li className="flex flex-col">
                <div className="font-medium">Leaflet.js:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Interactive map visualization for geographic network traffic
                  display
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Chart.js:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Beautiful, responsive charts for network metrics and analytics
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Recharts:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Composable charting library for React applications
                </div>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <h3 className="text-xl font-semibold text-green-600">
              Why This Stack?
            </h3>
            <ul className="mt-3 space-y-3 flex-1">
              <li className="flex flex-col">
                <div className="font-medium">Real-time:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  WebSocket (Pusher) enables real-time data streaming with
                  sub-100ms latency
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Scalability:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Next.js and Node.js provide a scalable architecture for
                  handling large network traffic
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">UX Excellence:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  Tailwind + Shadcn/ui deliver a polished, responsive user
                  experience
                </div>
              </li>
              <li className="flex flex-col">
                <div className="font-medium">Type Safety:</div>
                <div className="text-muted-foreground text-justify mt-0.5">
                  TypeScript ensures robust, error-free code across the entire
                  stack
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold lg:text-3xl mb-6">Meet the Team</h2>
        <div className="space-y-2 text-lg">
          <p><span className="font-semibold">Bhargav Pattanayak</span> – Webapp Development</p>
          <p><span className="font-semibold">Chitresh Sharma</span> – GNS3 Development</p>
          <p><span className="font-semibold">Karthikeya Nissankala</span> – Zabbix Development</p>
          <p><span className="font-semibold">Rahul Munagala</span> – GNS3 Configuration</p>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-muted-foreground">
          <span className="font-medium">Try WatchWing AI</span> – an intelligent
          assistant that sees your screen and answers all your questions in real time.{" "}
          <a
            href="https://watchwing.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Launch WatchWing AI →
          </a>
        </p>
      </div>
    </div>
  );
};

export default About;