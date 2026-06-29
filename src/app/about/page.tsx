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
                            <span className={`${pixelFont.className} text-xs ml-2 text-2xl font-bold tracking-tight md:text-xl lg:text-xl`}>NXT</span>
            
          </span>
        </h1>
        <p className="text-lg text-muted-foreground mt-3">
          Real-time Network Monitoring & Packet Analysis Platform
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold lg:text-3xl mb-4">Overview</h2>
        <p className="lg:text-xl text-lg leading-relaxed">
          Maestro NXT is a cutting-edge network monitoring and packet analysis 
          platform designed for modern network administrators and security 
          professionals. It provides real-time visibility into network traffic, 
          device status, and security events through an intuitive dashboard 
          interface.
        </p>
        <p className="lg:text-xl text-lg leading-relaxed mt-4">
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
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-xl font-semibold">1. Packet Capture</h3>
            <p className="lg:text-lg text-base mt-2">
              Network packets are captured from various network interfaces and 
              sources across your infrastructure. The system uses efficient 
              packet sniffing techniques to collect data without impacting 
              network performance.
            </p>
          </div>

          <div className="border-l-4 border-cyan-500 pl-4">
            <h3 className="text-xl font-semibold">2. Real-time Processing</h3>
            <p className="lg:text-lg text-base mt-2">
              Captured packets are processed in real-time using WebSocket 
              connections. The data is analyzed, parsed, and enriched with 
              geographic information, device metadata, and threat intelligence 
              before being sent to the dashboard.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-xl font-semibold">3. Live Dashboard Updates</h3>
            <p className="lg:text-lg text-base mt-2">
              The processed data is pushed to the client-side dashboard using 
              WebSocket connections, ensuring zero-latency updates. The World 
              Map shows real-time geographic distribution, the Alerts Panel 
              displays security events, and the Dashboard Cards show key 
              metrics.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-xl font-semibold">4. Data Visualization</h3>
            <p className="lg:text-lg text-base mt-2">
              All network data is presented through interactive visualizations 
              including:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>World Map with real-time traffic indicators</li>
                <li>Device health and status monitoring</li>
                <li>Security alerts and threat detection</li>
                <li>Packet analysis and traffic patterns</li>
                <li>Network performance metrics</li>
              </ul>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold lg:text-3xl mb-6">
          Technology Stack
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-blue-600">Frontend</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium">Next.js 14:</span>
                <span className="text-muted-foreground">
                  React framework with App Router for server-side rendering and 
                  optimal performance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">TypeScript:</span>
                <span className="text-muted-foreground">
                  Type-safe JavaScript for better code quality and developer 
                  experience
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Tailwind CSS:</span>
                <span className="text-muted-foreground">
                  Utility-first CSS framework for rapid UI development with 
                  consistent styling
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Shadcn/ui:</span>
                <span className="text-muted-foreground">
                  Reusable, accessible UI components built with Radix UI and 
                  Tailwind
                </span>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-cyan-600">Backend & Real-time</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium">Node.js:</span>
                <span className="text-muted-foreground">
                  JavaScript runtime for building scalable network applications
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Pusher (WebSocket):</span>
                <span className="text-muted-foreground">
                  Real-time WebSocket connections for instant data updates and 
                  bidirectional communication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Express.js:</span>
                <span className="text-muted-foreground">
                  Web framework for building REST APIs and handling HTTP requests
                </span>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-purple-600">Data & Visualization</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium">Leaflet.js:</span>
                <span className="text-muted-foreground">
                  Interactive map visualization for geographic network traffic 
                  display
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Chart.js:</span>
                <span className="text-muted-foreground">
                  Beautiful, responsive charts for network metrics and analytics
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Recharts:</span>
                <span className="text-muted-foreground">
                  Composable charting library for React applications
                </span>
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50">
            <h3 className="text-xl font-semibold text-green-600">
              Why This Stack?
            </h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-medium">Real-time Performance:</span>
                <span className="text-muted-foreground">
                  WebSocket (Pusher) enables real-time data streaming with 
                  sub-100ms latency
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Scalability:</span>
                <span className="text-muted-foreground">
                  Next.js and Node.js provide a scalable architecture for 
                  handling large network traffic
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">UX Excellence:</span>
                <span className="text-muted-foreground">
                  Tailwind + Shadcn/ui deliver a polished, responsive user 
                  experience
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Type Safety:</span>
                <span className="text-muted-foreground">
                  TypeScript ensures robust, error-free code across the entire 
                  stack
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default About;