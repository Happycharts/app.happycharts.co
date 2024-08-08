"use client"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SignIn } from "@clerk/nextjs"
import { cn } from "@/app/utils/utils"
import Logo from "@/public/happybase.svg"
import { Shield, Zap, TrendingUp } from "lucide-react"
import { ReactNode } from 'react';
import Intercom from '@intercom/messenger-js-sdk';

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
  Intercom({
    app_id: 'kz8t3t7h',
  });
  return (
    <div className="container bg-black relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
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
              icon={<Shield className="h-10 w-10" />}
              title="Secure JWT Authentication"
              description="Your data is protected with a secure JSON Web Token (JWT) that is generated on sign-in."
            />
            <FeatureItem 
              icon={<Zap className="h-10 w-10" />}
              title="Fast & Reliable"
              description="Our platform is built with the latest technologies and is designed to be fast and reliable."
            />
            <FeatureItem 
              icon={<TrendingUp className="h-10 w-10" />}
              title="Scalable Solutions"
              description="From startups to enterprises, our platform grows seamlessly with your business needs."
            />
          </div>
        </div>
      </div>
      <div className="bg-black lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <SignIn />
          <p className="px-8 text-center text-sm text-white">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
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
        <h3 className="text-xl text-black font-semibold mb-2">{title}</h3>
        <p className="text-black">{description}</p>
      </div>
    </div>
  )
}