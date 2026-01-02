import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-destructive font-bold text-2xl items-center justify-center">
            <AlertCircle className="w-8 h-8" />
            404 Page Not Found
          </div>
          
          <p className="mt-4 mb-6 text-center text-gray-600">
            The page you requested does not exist or has been moved.
          </p>

          <div className="flex justify-center">
            <Link href="/">
              <Button className="btn-primary w-full">Return Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
