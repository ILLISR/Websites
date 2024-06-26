import type { Metadata } from "next";
import { Roboto,IBM_Plex_Sans,Advent_Pro} from "next/font/google";
import "./globals.css";
import Nav from "@/Components/Nav";
import { Providers } from "./Providers";
import { AnalysisProvider } from "@/context/AnalysisContext";


const ibm_Plex_Sans = Advent_Pro({
  subsets: ["latin"],
  weight: "400"
}
);

export const metadata: Metadata = {
  title: "Check My file",
  description: "Get Check ur file",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"  >
      <body className={ibm_Plex_Sans.className} >
        <Providers>
        <AnalysisProvider>     
        <Nav/>
        {children}
        </AnalysisProvider> 
        </Providers>
      </body>
    </html>
  );
}
