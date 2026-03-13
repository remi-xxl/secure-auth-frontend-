import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Secure Auth",
  description: "Secure authentication system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              borderRadius: "8px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#f9fafb" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#f9fafb" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}