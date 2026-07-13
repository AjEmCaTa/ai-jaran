import Background from "../components/Background";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import ChatDemo from "../components/ChatDemo";
import Benefits from "../components/Benefits";

export default function Home() {
  return (
    <>
      <Background />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <ChatDemo />
    </>
  );
}