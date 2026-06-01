"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Shield,
  MessageSquare,
  Bell,
  BarChart3,
  Users,
  Target,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";

const marqueeItems = [
  {
    text: "Hawi Dandi Boru",
    icon: <GraduationCap className="w-5 h-5 text-brand-primary" />,
  },
  {
    text: "Digital Communication",
    icon: <Users className="w-5 h-5 text-brand-primary" />,
  },
  {
    text: "Secure Portal",
    icon: <Shield className="w-5 h-5 text-brand-primary" />,
  },
  {
    text: "Real-time Alerts",
    icon: <Bell className="w-5 h-5 text-brand-primary" />,
  },
  {
    text: "Academic Progress",
    icon: <BarChart3 className="w-5 h-5 text-brand-primary" />,
  },
  {
    text: "Direct Messaging",
    icon: <MessageSquare className="w-5 h-5 text-brand-primary" />,
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header and active section (ScrollSpy)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Check if we reached the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;
      if (isAtBottom) {
        setActiveSection("contact");
        return;
      }

      const sections = ["home", "about-us", "features", "workflow", "contact"];

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the section is above 150px and the bottom is below 150px, it's active
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    // Run once on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMenuOpen(false);
    setActiveSection(id);
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about-us", label: "About Us" },
    { id: "features", label: "Features" },
    { id: "workflow", label: "Workflow" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-primary/10">
      {/* HEADER */}
      <header className="fixed w-full z-50 bg-brand-primary shadow-lg py-3">
        <div className="container mx-auto px-4 flex justify-between items-center h-10">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded-full border border-white/20 w-10 h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="GuardianGate Logo"
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-white">
              GuardianGate
            </span>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-xs font-bold uppercase tracking-widest transition-colors hover:text-brand-accent ${activeSection === item.id
                    ? "text-brand-accent"
                    : "text-white/80"
                  }`}
              >
                {item.label}
              </button>
            ))}

            <Link href="/auth/login">
              <Button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 text-white font-black px-6 py-2 shadow-lg shadow-black/10 hover:bg-white/20 transition-all">
                <User className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-brand-100 p-6 flex flex-col gap-4 animate-fadeIn">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-left py-3 text-lg font-bold text-brand-heading hover:text-brand-primary border-b border-brand-50"
              >
                {item.label}
              </button>
            ))}
            <Link href="/auth/login" className="w-full">
              <Button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-brand-primary to-brand-accent text-white font-black py-4 hover:opacity-90 transition-all shadow-lg shadow-brand-primary/10">
                <User className="w-5 h-5 text-white" />
                Login
              </Button>
            </Link>
            <div className="pt-4 text-center">
              <span className="text-brand-text/60">New user? </span>
              <Link
                href="/auth/register"
                className="font-bold text-brand-primary"
              >
                Register here
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="home"
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
      >
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-accent/15 blur-[120px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-brand-primary/8 blur-[100px] rounded-full -ml-20 -mb-20" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text Content */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center bg-brand-primary/5 border border-brand-primary/10 px-6 py-3 rounded-full mb-6 max-w-[340px] sm:max-w-sm overflow-hidden animate-slide-in-right shadow-xs">
                <div className="overflow-hidden relative w-full h-5 flex items-center">
                  <div className="flex w-max animate-marquee-ltr">
                    <div className="flex space-x-8 pr-8">
                      <span className="text-brand-primary text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                        Welcome to Hawi Dandi Boru
                      </span>
                    </div>
                    <div className="flex space-x-8 pr-8">
                      <span className="text-brand-primary text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap">
                        Welcome to Hawi Dandi Boru
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-brand-heading mb-6 tracking-tighter leading-tight">
                Digital Parent-School <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-primary to-brand-accent">
                  Communication
                </span>
              </h2>

              <p className="text-lg md:text-xl text-brand-text mb-8 max-w-xl font-medium leading-relaxed">
                A secure, role-controlled, and structured platform enabling
                seamless interaction between guardians, teachers, and school
                administrators.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => scrollToSection("about-us")}
                  className="w-full sm:w-auto px-10 py-4 text-lg bg-linear-to-r from-brand-primary to-brand-accent hover:opacity-95 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-primary/20 transform hover:scale-[1.02] cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column: Image with Stunning Visual Effects */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center">
              {/* Glow Behind Image */}
              <div className="absolute -inset-4 bg-linear-to-tr from-brand-primary to-brand-accent rounded-[3rem] opacity-25 blur-2xl -z-10" />

              {/* Decorative dotted pattern or geometric accent */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[radial-gradient(#A4C639_2px,transparent_2px)] [background-size:12px_12px] opacity-40 -z-10 hidden sm:block" />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[radial-gradient(#2E5A33_2px,transparent_2px)] [background-size:12px_12px] opacity-40 -z-10 hidden sm:block" />

              {/* The Image Container */}
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl shadow-brand-primary/20 transition-all duration-500 hover:scale-[1.01] hover:shadow-brand-primary/30 max-w-full">
                <img
                  src="/parent-teacher-meeting.png"
                  alt="Parent-Teacher Meeting"
                  className="w-full h-auto object-cover max-h-[420px] md:max-h-[480px]"
                />

                {/* Soft gradient overlay on image */}
                <div className="absolute inset-0 bg-linear-to-t from-brand-heading/20 to-transparent pointer-events-none" />
              </div>

              {/* Floating Stat/Feature Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md border border-brand-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float max-w-[200px]">
                <div className="bg-brand-primary/10 p-2.5 rounded-xl text-brand-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-brand-heading uppercase tracking-wider">
                    100% Secure
                  </p>
                  <p className="text-[10px] text-brand-text font-bold leading-none mt-1">
                    Role-controlled portal
                  </p>
                </div>
              </div>

              <div
                className="absolute -top-6 -right-6 bg-white/95 backdrop-blur-md border border-brand-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float max-w-[200px]"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="bg-brand-accent/10 p-2.5 rounded-xl text-brand-accent">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-brand-heading uppercase tracking-wider">
                    Instant Alerts
                  </p>
                  <p className="text-[10px] text-brand-text font-bold leading-none mt-1">
                    SMS & email updates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ABOUT US SECTION */}
      <section id="about-us" className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-brand-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              About Our System
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-brand-heading tracking-tighter mb-6">
              Our Vision & Mission
            </h3>
            <p className="text-lg text-brand-text max-w-3xl mx-auto font-medium">
              The Hawi Dandi Boru School Communication System is a secure,
              web-based platform designed to strengthen the connection between
              parents and the school while ensuring accountability and
              transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column: Image with beautiful overlays */}
            <div className="lg:col-span-6 relative flex justify-center">
              {/* Soft glow behind the image */}
              <div className="absolute -inset-4 bg-linear-to-tr from-brand-accent to-brand-primary rounded-[3rem] opacity-20 blur-2xl -z-10 animate-pulse" />

              {/* Decorative graphic patterns */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-[radial-gradient(#2E5A33_2px,transparent_2px)] [background-size:12px_12px] opacity-30 -z-10 hidden sm:block" />
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[radial-gradient(#A4C639_2px,transparent_2px)] [background-size:12px_12px] opacity-30 -z-10 hidden sm:block" />

              {/* Image frame */}
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl shadow-brand-primary/10 transition-all duration-500 hover:scale-[1.01] hover:shadow-brand-primary/20 w-full max-w-[480px] lg:max-w-full">
                <img
                  src="/teacher-parent-student.png"
                  alt="Teacher collaborating with parent and student"
                  className="w-full h-[320px] sm:h-[380px] md:h-[420px] object-cover"
                />

                {/* Visual overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-brand-primary/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating badge for About section */}
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md border border-brand-100 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float">
                <div className="bg-brand-success/15 p-2 rounded-xl text-brand-success">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-brand-heading uppercase tracking-wider">
                    Active Engagement
                  </p>
                  <p className="text-[9px] text-brand-text font-bold leading-none mt-1">
                    Strengthened partnerships
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Vision and Mission Cards stacked */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Vision Card */}
              <div className="bg-brand-bg rounded-[2.5rem] p-8 border border-brand-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-brand-primary/5 group-hover:text-brand-primary/10 transition-colors">
                  <Target size={100} />
                </div>
                <div className="flex gap-6 items-start">
                  <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                    <Target className="text-brand-primary w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-brand-heading mb-2">
                      Our Vision
                    </h4>
                    <p className="text-brand-text text-base leading-relaxed font-medium">
                      To enhance parental involvement and streamline school
                      communications, ensuring every child’s educational
                      progress is effectively monitored and supported.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mission Card */}
              <div className="bg-brand-bg rounded-[2.5rem] p-8 border border-brand-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-brand-primary/5 group-hover:text-brand-primary/10 transition-colors">
                  <Rocket size={100} />
                </div>
                <div className="flex gap-6 items-start">
                  <div className="bg-brand-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                    <Rocket className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-brand-heading mb-3">
                      Our Mission
                    </h4>
                    <ul className="space-y-2 text-brand-text text-base font-medium">
                      <li className="flex items-start">
                        <span className="text-brand-primary mr-2 font-bold">
                          1.
                        </span>
                        Provide a secure and user-friendly system for guardians
                        to access academic updates.
                      </li>
                      <li className="flex items-start">
                        <span className="text-brand-primary mr-2 font-bold">
                          2.
                        </span>
                        Empower teachers to communicate efficiently and manage
                        classroom interactions.
                      </li>
                      <li className="flex items-start">
                        <span className="text-brand-primary mr-2 font-bold">
                          3.
                        </span>
                        Enable administrators to oversee school-wide operations
                        and announcements.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="py-24 bg-brand-bg relative overflow-hidden"
      >
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-brand-primary/5 blur-[120px] rounded-full -ml-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-brand-accent/5 blur-[120px] rounded-full -mr-20 -mb-20 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-brand-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              System Features
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-brand-heading tracking-tighter">
              Everything You Need
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {/* Guardian Access */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-primary/5 hover:shadow-2xl transition-all hover:-translate-y-2 border border-brand-50">
              <div className="bg-brand-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-brand-primary w-7 h-7" />
              </div>
              <h4 className="text-xl font-black text-brand-heading mb-3">
                Guardian Access
              </h4>
              <p className="text-brand-text font-medium">
                View student homework, report cards, messages, and approve
                pickup requests with one click.
              </p>
            </div>

            {/* Teacher Tools */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-primary/5 hover:shadow-2xl transition-all hover:-translate-y-2 border border-brand-50">
              <div className="bg-brand-accent/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="text-brand-accent w-7 h-7" />
              </div>
              <h4 className="text-xl font-black text-brand-heading mb-3">
                Teacher Tools
              </h4>
              <p className="text-brand-text font-medium">
                Post assignments, send instant messages to guardians, and manage
                classroom data securely.
              </p>
            </div>

            {/* Admin Control */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-primary/5 hover:shadow-2xl transition-all hover:-translate-y-2 border border-brand-50">
              <div className="bg-brand-heading/5 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="text-brand-heading w-7 h-7" />
              </div>
              <h4 className="text-xl font-black text-brand-heading mb-3">
                Admin Control
              </h4>
              <p className="text-brand-text font-medium">
                Approve accounts, publish announcements, and manage school
                events with full accountability.
              </p>
            </div>
          </div>

          {/* Secondary Feature Grid */}
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto border-t border-brand-100 pt-16">
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <MessageSquare className="text-brand-primary w-5 h-5" />
              </div>
              <h5 className="font-black text-brand-heading mb-2 uppercase text-sm tracking-widest">
                Secure Messaging
              </h5>
              <p className="text-sm text-brand-text font-medium">
                Direct communication with teachers and staff.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Bell className="text-brand-accent w-5 h-5" />
              </div>
              <h5 className="font-black text-brand-heading mb-2 uppercase text-sm tracking-widest">
                Real-time Updates
              </h5>
              <p className="text-sm text-brand-text font-medium">
                Instant notifications for homework and events.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <BarChart3 className="text-brand-heading w-5 h-5" />
              </div>
              <h5 className="font-black text-brand-heading mb-2 uppercase text-sm tracking-widest">
                Academic Progress
              </h5>
              <p className="text-sm text-brand-text font-medium">
                Digital report cards and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DIGITAL ECOSYSTEM SECTION */}
      <section className="py-24 bg-white relative overflow-hidden border-t border-brand-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Column: Text Copy */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <h2 className="text-brand-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
                  Unified Access
                </h2>
                <h3 className="text-4xl md:text-5xl font-black text-brand-heading tracking-tighter leading-none mb-6">
                  One Platform, <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-primary to-brand-accent">
                    Any Device
                  </span>
                </h3>
                <p className="text-lg text-brand-text font-medium leading-relaxed">
                  Whether you are a parent tracking progress on a phone, a
                  teacher posting assignments on a tablet, or an administrator
                  managing classrooms on a desktop, our ecosystem provides
                  seamless synchronization.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="bg-brand-primary/10 p-2.5 rounded-xl text-brand-primary shrink-0 h-10 w-10 flex items-center justify-center">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-heading text-lg">
                      Instant Synchronization
                    </h4>
                    <p className="text-brand-text text-sm font-medium mt-1">
                      Updates propagate immediately, keeping everyone on the
                      same page.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-brand-accent/15 p-2.5 rounded-xl text-brand-accent shrink-0 h-10 w-10 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-heading text-lg">
                      Connected Stakeholders
                    </h4>
                    <p className="text-brand-text text-sm font-medium mt-1">
                      Direct channels linking guardians, instructors, and
                      registrars securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image with Stunning Visual Effects */}
            <div className="lg:col-span-6 relative flex justify-center mt-8 lg:mt-0">
              {/* Soft glow behind the image */}
              <div className="absolute -inset-4 bg-linear-to-tr from-brand-primary to-brand-accent rounded-[3rem] opacity-20 blur-3xl -z-10 animate-pulse" />

              {/* Decorative graphic patterns */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-[radial-gradient(#2E5A33_2px,transparent_2px)] [background-size:12px_12px] opacity-30 -z-10 hidden sm:block" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[radial-gradient(#A4C639_2px,transparent_2px)] [background-size:12px_12px] opacity-30 -z-10 hidden sm:block" />

              {/* Image frame */}
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl shadow-brand-primary/15 transition-all duration-500 hover:scale-[1.01] hover:shadow-brand-primary/25 w-full max-w-[480px] lg:max-w-full">
                <img
                  src="/digital-connections.png"
                  alt="Multi-device connected school system network"
                  className="w-full h-[320px] sm:h-[380px] md:h-[420px] object-cover"
                />

                {/* Visual overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-brand-heading/20 to-transparent pointer-events-none" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md border border-brand-100 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float">
                <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-brand-heading uppercase tracking-wider">
                    Sync Active
                  </p>
                  <p className="text-[9px] text-brand-text font-bold leading-none mt-1">
                    Multi-device connection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-brand-primary text-sm font-black uppercase tracking-[0.3em] mb-4">
              How It Works
            </h2>
            <h3 className="text-4xl font-black text-brand-heading tracking-tighter">
              Your Journey in 5 Steps
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-2">
            {[
              {
                step: "01",
                text: "Users select their role (Admin, Teacher, or Guardian) on the login page.",
              },
              {
                step: "02",
                text: "Admins and teachers with valid accounts log in directly.",
              },
              {
                step: "03",
                text: "Guardians submit a registration request for verification.",
              },
              {
                step: "04",
                text: "The registrar reviews and approves legitimate guardian requests.",
              },
              {
                step: "05",
                text: "Approved guardians log in and access their personal dashboard.",
              },
            ].map((item, index, array) => (
              <div
                key={index}
                className="flex flex-col lg:flex-row items-center flex-1"
              >
                <div className="flex-1 w-full p-6 bg-brand-bg rounded-[2rem] border border-brand-100 hover:border-brand-primary transition-all group text-center flex flex-col items-center justify-center min-h-[180px]">
                  <span className="text-2xl font-black text-brand-primary/20 group-hover:text-brand-primary transition-colors mb-2">
                    {item.step}
                  </span>
                  <p className="text-xs text-brand-heading font-bold leading-tight">
                    {item.text}
                  </p>
                </div>
                {index < array.length - 1 && (
                  <div className="py-2 lg:py-0 lg:px-2 flex items-center justify-center">
                    <ArrowRight className="text-brand-primary/30 w-6 h-6 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section
        id="contact"
        className="py-24 bg-white relative overflow-hidden border-t border-brand-100"
      >
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] text-brand-primary">
          <GraduationCap size={300} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-brand-heading">
            Contact & Support
          </h3>
          <p className="text-brand-primary font-black uppercase tracking-[0.2em] mb-12">
            Get In Touch With Us
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-8 bg-brand-bg rounded-3xl border border-brand-100">
              <h5 className="text-brand-primary font-black uppercase tracking-widest mb-3">
                Location
              </h5>
              <p className="text-lg font-bold text-brand-heading">
                Hawi Dandi Boru School
              </p>
            </div>
            <div className="p-8 bg-brand-bg rounded-3xl border border-brand-100">
              <h5 className="text-brand-primary font-black uppercase tracking-widest mb-3">
                Phone
              </h5>
              <p className="text-lg font-bold text-brand-heading">
                +251 919785587
              </p>
            </div>
            <div className="p-8 bg-brand-bg rounded-3xl border border-brand-100">
              <h5 className="text-brand-primary font-black uppercase tracking-widest mb-3">
                Email
              </h5>
              <p className="text-lg font-bold text-brand-heading">
                hawischool@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brand-bg py-16 border-t border-brand-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white p-1 rounded-full shadow-md border border-brand-100 w-12 h-12 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="GuardianGate Logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase text-brand-heading">
                GuardianGate
              </span>
            </div>

            <p className="text-brand-text/60 text-sm font-medium mb-2">
              Strengthening the bond between parents and education.
            </p>

            <p className="text-brand-heading/40 text-[10px] font-black uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} Hawi Dandi Boru School. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
