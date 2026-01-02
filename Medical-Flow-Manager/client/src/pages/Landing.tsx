import { Button } from "@/components/ui/button";
import React from "react";
import { Stethoscope, ShieldCheck, UploadCloud } from "lucide-react";

export default function Landing() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message || 'Login failed');
        return;
      }
      // Load the app
      window.location.href = '/';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* Logo/Icon */}
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/20">
          <Stethoscope className="w-10 h-10" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-slate-900">
            Medical Tourism Management
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure patient file management, document scanning, and case tracking for healthcare providers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md bg-white/70 backdrop-blur p-6 rounded-xl border shadow-sm">
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-muted-foreground">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-muted-foreground">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border p-2" />
          </div>
          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          <div className="flex justify-center">
            <Button type="submit" size="lg" className="w-full">Sign in</Button>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white/60 backdrop-blur p-6 rounded-xl border shadow-sm">
             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg mb-2">Secure Records</h3>
             <p className="text-sm text-muted-foreground">Encrypted patient data with role-based access control and file locking.</p>
          </div>
          <div className="bg-white/60 backdrop-blur p-6 rounded-xl border shadow-sm">
             <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
               <UploadCloud className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg mb-2">Digital Documents</h3>
             <p className="text-sm text-muted-foreground">Instant scan uploading for passports, medical reports, and invoices.</p>
          </div>
          <div className="bg-white/60 backdrop-blur p-6 rounded-xl border shadow-sm">
             <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
               <Stethoscope className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-lg mb-2">Case Tracking</h3>
             <p className="text-sm text-muted-foreground">End-to-end workflow management from initial inquiry to payment.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
