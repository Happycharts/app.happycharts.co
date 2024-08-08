"use client"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SignUp } from "@clerk/nextjs"
import { cn } from "@/app/utils/utils"
import Logo from "@/public/happybase.svg"
import { Shield, Zap, TrendingUp } from "lucide-react"
import { ReactNode } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next'

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

interface FeatureItemProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function AuthenticationPage() {
  return (
    <div className="bg-black h-screen w-screen overflow-hidden flex items-stretch">
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-muted p-10 text-white relative">
        <div className="absolute inset-0 bg-white">
          <Image
            src="/auth-background.jpg"
            alt="Authentication background"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="opacity-50"
          />
        </div>
        <div className="relative z-20 flex items-center text-black text-lg font-bold">
          <Logo className="h-8 mr-2 w-auto" />
          Happybase
        </div>
        <div className="relative z-20 mt-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Empower Your Business with Happybase</h2>
          <div className="grid gap-6">
            <FeatureItem 
              icon={<Shield className="h-8 w-8" />}
              title="Secure JWT Authentication"
              description="Your data is protected with a secure JSON Web Token (JWT) that is generated on sign-in."
            />
            <FeatureItem 
              icon={<Zap className="h-8 w-8" />}
              title="Fast & Reliable"
              description="Our platform is built with the latest technologies and is designed to be fast and reliable."
            />
            <FeatureItem 
              icon={<TrendingUp className="h-8 w-8" />}
              title="Scalable Solutions"
              description="From startups to enterprises, our platform grows seamlessly with your business needs."
            />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <SignUp forceRedirectUrl="/auth/create-organization" />
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 p-2 bg-primary text-black rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-lg text-black font-semibold mb-1">{title}</h3>
        <p className="text-sm text-black">{description}</p>
      </div>
    </div>
  )
}