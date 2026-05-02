"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
    setActiveSection(id);
  };

  return (
    <div className="scroll-smooth">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md fixed w-full z-50 border-b">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold text-blue-700">Digital</h1>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              ["home", "Home"],
              ["about-us", "About Us"],
              ["features", "Features"],
              ["workflow", "Workflow"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <span
                key={id}
                onClick={() => scrollToSection(id)}
                className={`cursor-pointer text-gray-700 hover:text-blue-600 transition text-sm tracking-wider ${
                  activeSection === id ? "text-blue-700 font-semibold" : ""
                }`}
              >
                {label}
              </span>
            ))}

            <Link
              href="auth/login"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              style={{ textDecoration: "none" }}
            >
              Login
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="md:hidden bg-white shadow-md">
            {[
              ["home", "Home"],
              ["about-us", "About Us"],
              ["features", "Features"],
              ["workflow", "Workflow"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50"
              >
                {label}
              </button>
            ))}

            <Link
              href="auth/login"
              className="block px-4 py-2 bg-blue-600 text-white"
            >
              Login
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="pt-28 pb-20 text-center bg-blue-50">
        <h2 className="text-4xl font-extrabold text-blue-700">
          Welcome to Hawi Dandi Boru School System
        </h2>
        <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
          Secure, role-controlled, and structured communication between
          guardians, teachers, and administrators.
        </p>
        <Link
          href="auth/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
          style={{ textDecoration: "none" }}
        >
          Get Started
        </Link>
      </section>

      {/* ABOUT US */}
      <section id="about-us" className="py-24 bg-white scroll-mt-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-blue-700 mb-6">About Us</h2>
          <p className="text-gray-700 max-w-3xl mx-auto mb-12 text-lg">
            Hawi Dandi Boru School Digital Parent-School Communication System is
            a secure, web-based platform that enables structured and traceable
            communication between guardians, teachers, and school
            administrators. Our goal is to strengthen the connection between
            parents and the school while ensuring accountability and
            transparency.
          </p>
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            {/* Vision Card */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700">
                Our Vision
              </h3>
              <p className="text-gray-700 text-lg">
                To enhance parental involvement and streamline school
                communications, ensuring every child’s educational progress is
                effectively monitored and supported.
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-700">
                Our Mission
              </h3>
              <p className="text-gray-700 text-lg">
                1. Provide a secure and user-friendly system for guardians to
                access academic updates.
                <br />
                2. Empower teachers to communicate efficiently and manage
                classroom interactions.
                <br />
                3. Enable administrators to oversee school-wide operations,
                announcements, and events.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-24 bg-blue-50 text-center scroll-mt-20"
      >
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-semibold mb-10 text-blue-700">
            Key Features
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Guardian Access Card */}
            <div className="bg-white rounded-2xl p-6 shadow transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <h4 className="text-xl font-bold mb-2">Guardian Access</h4>
              <p className="text-gray-700">
                View student homework, report cards, messages, and approve
                pickup requests.
              </p>
            </div>

            {/* Teacher Tools Card */}
            <div className="bg-white rounded-2xl p-6 shadow transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <h4 className="text-xl font-bold mb-2">Teacher Tools</h4>
              <p className="text-gray-700">
                Post assignments, send messages to guardians, and manage
                classroom information securely.
              </p>
            </div>

            {/* Admin Control Card */}
            <div className="bg-white rounded-2xl p-6 shadow transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <h4 className="text-xl font-bold mb-2">Admin Control</h4>
              <p className="text-gray-700">
                Approve accounts, publish announcements, and manage school
                events with accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section
        id="workflow"
        className="py-24 bg-white text-center scroll-mt-20"
      >
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-semibold mb-12 text-blue-700">
            How It Works
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 space-y-6 md:space-y-0">
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md flex-1 transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <p className="text-gray-700 text-lg">
                Users select their role (Admin, Teacher, or Guardian) on the
                login page.
              </p>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-3xl text-gray-400 animate-pulse">→</span>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md flex-1 transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <p className="text-gray-700 text-lg">
                Admins and teachers with valid accounts log in directly.
              </p>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-3xl text-gray-400 animate-pulse">→</span>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md flex-1 transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <p className="text-gray-700 text-lg">
                Guardians submit a registration request for verification.
              </p>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-3xl text-gray-400 animate-pulse">→</span>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md flex-1 transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <p className="text-gray-700 text-lg">
                The registrar reviews and approves legitimate guardian requests.
              </p>
            </div>

            <div className="hidden md:flex items-center">
              <span className="text-3xl text-gray-400 animate-pulse">→</span>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 shadow-md flex-1 transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <p className="text-gray-700 text-lg">
                Approved guardians log in and access their role-specific
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-blue-50 text-center">
        <h3 className="text-3xl font-bold text-blue-700 mb-6">
          Contact & Support
        </h3>

        <p>Hawi Dandi Boru School</p>
        <p>+251 XXX XXX XXX</p>
        <p>info@school.edu</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-700 text-blue-200 text-center py-6">
        © {new Date().getFullYear()} All rights reserved
      </footer>
    </div>
  );
}
