"use client";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import AIMatchBanner from "@/components/AIMatchBanner";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Explore from "@/components/Explore";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="section-colored">
        <Stats />
      </div>
      <div className="section-white">
        <AIMatchBanner />
      </div>
        <div className="section-blue">
        <section id="features"><Features /></section>
      </div>
      <div className="section-white">
        <section id="how"><HowItWorks /></section>
      </div>
      <div className="section-green">
        <section id="explore"><Explore /></section>
      </div>
      <div className="section-white">
        <Testimonials />
      </div>
      <div className="section-colored">
        <Footer />
      </div>
    </>
  );
}
