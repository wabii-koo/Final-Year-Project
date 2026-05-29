"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  CreditCard,
  Users,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  GraduationCap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface FormData {
  fullName: string;
  email: string;
  phoneNo: string;
  password: string;
  confirmPassword: string;
  nationalId: string;
  studentName: string;
  relationshipType: "parent" | "legal_guardian" | "";
}

interface Documents {
  certificate: File | null;
  idFront: File | null;
  idBack: File | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempId, setTempId] = useState("");
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNo: "",
    password: "",
    confirmPassword: "",
    nationalId: "",
    studentName: "",
    relationshipType: "",
  });

  const [documents, setDocuments] = useState<Documents>({
    certificate: null,
    idFront: null,
    idBack: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Documents,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/registration/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setTempId(data.data.tempId);
        setStudentName(data.data.studentName);
        setSuccessMessage(data.message || "");
        setStep(2);
      } else {
        setError(data.error?.message || "Validation failed");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/registration/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        setError(data.error?.message || "Invalid OTP");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/registration/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message || "");
        alert(data.message || "OTP resent successfully!");
      } else {
        setError(data.error?.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError("Failed to resend OTP");
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!documents.certificate || !documents.idFront || !documents.idBack) {
      setError("Please upload all required documents");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("tempId", tempId);
    formDataToSend.append("certificate", documents.certificate);
    formDataToSend.append("idFront", documents.idFront);
    formDataToSend.append("idBack", documents.idBack);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/registration/complete`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationId(data.data.registrationId);
        setSuccess(true);
        setStep(4);
      } else {
        setError(data.error?.message || "Failed to complete registration");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-4">
      <Input
        label="Full Name *"
        icon={User}
        name="fullName"
        value={formData.fullName}
        onChange={handleInputChange}
        placeholder="Enter your full name"
        required
      />

      <Input
        label="Email Address *"
        icon={Mail}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="your.email@example.com"
        required
      />

      <Input
        label="Phone Number *"
        icon={Phone}
        type="tel"
        name="phoneNo"
        value={formData.phoneNo}
        onChange={handleInputChange}
        placeholder="+251 911 234 567"
        pattern="^\+?[0-9\s\-]{9,15}$"
        title="Please enter a valid phone number (e.g. +251 911 234 567)"
        maxLength={15}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Password *"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Min 8 characters"
          minLength={8}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowPassword(!showPassword)}
          required
        />
        <Input
          label="Confirm Password *"
          icon={Lock}
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm password"
          rightIcon={showConfirmPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
          required
        />
      </div>

      <Input
        label="National ID / Kebele ID *"
        icon={CreditCard}
        name="nationalId"
        value={formData.nationalId}
        onChange={handleInputChange}
        placeholder="Enter your National ID number"
        required
      />

      <div>
        <Input
          label="Child's Full Name *"
          icon={User}
          name="studentName"
          value={formData.studentName}
          onChange={handleInputChange}
          placeholder="Enter your child's full name"
          required
        />
        <p className="text-xs text-brand-text mt-1 font-medium italic">
          Please provide the child's legal name for school records
        </p>
      </div>

      <div>
        <label
          htmlFor="relationshipType"
          className="block text-sm font-bold text-brand-heading mb-1 ml-1 uppercase text-[10px] tracking-widest"
        >
          Relationship to Student *
        </label>
        <select
          id="relationshipType"
          name="relationshipType"
          value={formData.relationshipType}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-brand-bg border border-brand-100 rounded-2xl focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all text-sm font-bold text-brand-heading"
          required
        >
          <option value="">Select relationship...</option>
          <option value="parent">Parent</option>
          <option value="legal_guardian">Legal Guardian</option>
        </select>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black shadow-xl shadow-brand-primary/20"
      >
        {loading ? (
          "Validating..."
        ) : (
          <>
            Continue <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-brand-primary font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleStep2Submit} className="space-y-6">
      <div className="text-center">
        <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100">
          <Shield className="h-8 w-8 text-brand-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Verify Your Email
        </h3>
        <p className="text-gray-600 mt-2 text-sm">
          A 6-digit verification code has been generated for
          <br />
          <strong className="text-gray-900">{formData.email}</strong>
        </p>
        {studentName && (
          <div className="mt-4 p-2 bg-brand-50 text-brand-primary rounded-lg text-sm border border-brand-100 font-bold">
            Registering for student:{" "}
            <span className="text-brand-primary uppercase tracking-tighter">
              {studentName}
            </span>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold whitespace-pre-line text-center leading-relaxed">
            {successMessage}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
          Enter OTP *
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-3 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
          placeholder="000000"
          maxLength={6}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black shadow-xl shadow-brand-primary/20"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOTP}
          className="text-brand-primary hover:underline text-sm font-medium"
        >
          Resend Code
        </button>
      </div>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Go Back
      </button>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-6">
      <div className="text-center">
        <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100">
          <Upload className="h-8 w-8 text-brand-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Upload Documents
        </h3>
        <p className="text-gray-600 mt-2 text-sm">
          Please upload the required documents for verification
        </p>
        {studentName && (
          <div className="mt-2 text-sm text-brand-700 font-medium italic">
            Student: {studentName}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {[
          {
            id: "certificate",
            label: "Birth Certificate or Legal Guardian Certificate",
            field: "certificate",
          },
          {
            id: "idFront",
            label: "National ID / Kebele ID - Front Side",
            field: "idFront",
          },
          {
            id: "idBack",
            label: "National ID / Kebele ID - Back Side",
            field: "idBack",
          },
        ].map((doc) => (
          <div
            key={doc.id}
            className="border-2 border-dashed border-brand-100 rounded-2xl p-4 hover:border-brand-primary hover:bg-brand-50/50 transition-all cursor-pointer group"
          >
            <label className="block cursor-pointer">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl transition-colors ${documents[doc.field as keyof Documents] ? "bg-brand-success/10 text-brand-success" : "bg-brand-100 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"}`}
                >
                  <Upload className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${documents[doc.field as keyof Documents] ? "text-brand-success" : "text-brand-heading"}`}
                  >
                    {documents[doc.field as keyof Documents]
                      ? (documents[doc.field as keyof Documents] as File).name
                      : doc.label}
                  </p>
                  <p className="text-xs text-brand-text">
                    PDF, JPG, or PNG (max 5MB)
                  </p>
                </div>
                {documents[doc.field as keyof Documents] && (
                  <CheckCircle className="h-5 w-5 text-brand-success" />
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange(e, doc.field as keyof Documents)
                }
                className="hidden"
                required
              />
            </label>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-yellow-800 leading-relaxed">
          Documents will be reviewed by the school registrar. Ensure all
          information is clear and legible to avoid delays.
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black shadow-xl shadow-brand-primary/20"
      >
        {loading ? "Submitting..." : "Submit Registration"}
      </Button>
    </form>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="bg-brand-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm border border-brand-success/20">
        <CheckCircle className="h-10 w-10 text-brand-success" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Registration Submitted!
        </h3>
        <p className="text-gray-600 mt-2 text-sm">
          Your registration request has been received and is pending review.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 text-left border border-gray-100 space-y-3">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Registration ID
          </span>
          <span className="text-sm font-bold text-gray-900">
            #{registrationId}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Email
          </span>
          <span className="text-sm text-gray-700">{formData.email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Status
          </span>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
            Pending Review
          </span>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-left relative overflow-hidden">
        <GraduationCap className="absolute -bottom-4 -right-4 w-16 h-16 text-brand-accent/10 -rotate-12" />
        <h4 className="font-black text-brand-primary mb-3 flex items-center gap-2 uppercase text-xs tracking-widest">
          <Shield className="h-4 w-4" /> What happens next?
        </h4>
        <ul className="text-sm text-brand-text space-y-2 relative z-10 font-medium">
          <li className="flex gap-2 items-start">
            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-1.5" />{" "}
            The registrar will review your documents (1-2 business days)
          </li>
          <li className="flex gap-2 items-start">
            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-1.5" />{" "}
            You will receive an email notification once approved
          </li>
          <li className="flex gap-2 items-start">
            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-1.5" />{" "}
            You can then log in to access your child's information
          </li>
        </ul>
      </div>

      <Button
        onClick={() => router.push("/auth/login")}
        className="w-full py-4 rounded-2xl bg-linear-to-r from-brand-primary to-brand-accent text-white font-black shadow-xl shadow-brand-primary/20"
      >
        Go to Login
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Top Header Bar - Consistent Green Header */}
      <header className="w-full bg-brand-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-full border border-white/20 w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="GuardianGate Logo" className="object-contain w-full h-full" />
            </div>
            <span className="text-white font-black text-xl tracking-tighter uppercase">
              GuardianGate
            </span>
          </div>
          <GraduationCap className="text-white/40 w-5 h-5 hidden md:block" />
        </div>
      </header>

      <main className="flex-1 flex justify-center p-4 py-12 md:p-8 overflow-y-auto">
        <div className="w-full max-w-lg my-auto">
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-10 px-4 relative">
            <GraduationCap className="absolute -left-12 -top-8 w-12 h-12 text-brand-accent/20 -rotate-45" />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${
                    step >= s
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110"
                      : "bg-white text-brand-text border-2 border-brand-100"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-6 w-6" /> : s}
                </div>
                {s < 4 && (
                  <div className="flex-1 mx-2 h-1 bg-brand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-brand-primary to-brand-accent transition-all duration-500"
                      style={{ width: step > s ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-brand-white rounded-[3rem] shadow-2xl shadow-brand-primary/5 p-8 md:p-10 border border-brand-100 relative overflow-hidden">
            <GraduationCap className="absolute -top-6 -right-6 w-20 h-20 text-brand-accent/5 rotate-90" />
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-black text-brand-heading tracking-tight uppercase">
                Registration
              </h2>
              <p className="text-brand-text mt-2 text-sm font-bold">
                {step === 1 && "Create your secure guardian account"}
                {step === 2 && "Verify your mobile phone number"}
                {step === 3 && "Upload necessary school documents"}
                {step === 4 && "Your application is being processed"}
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm font-medium">
                  {error}
                </span>
              </div>
            )}

            <div className="transition-all duration-300">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs font-medium">
              &copy; 2024 GuardianGate Portal. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
