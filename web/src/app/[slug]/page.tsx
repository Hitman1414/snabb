import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Logo } from '@/components/Logo';

interface PageContent {
  title: string;
  description: string;
  sections: {
    heading: string;
    content: string | React.ReactNode;
  }[];
}

const pageContents: Record<string, PageContent> = {
  "how-it-works": {
    title: "How Snabb Works",
    description: "Your complete guide to requesting help and offering your skills.",
    sections: [
      { heading: "1. Create an Ask", content: "Post what you need help with in seconds. Describe your task, set your location, and specify the amount you are willing to pay." },
      { heading: "2. Get Instant Offers", content: "Local professionals and trusted helpers will receive your request and can accept it immediately." },
      { heading: "3. Connect & Complete", content: "Chat securely with your helper, get the job done right, and leave a review to help the community." }
    ]
  },
  "pro": {
    title: "Become a Snabb Pro",
    description: "Turn your valuable skills into a reliable stream of income.",
    sections: [
      { heading: "Why join as a Pro?", content: "Access exclusive high-paying asks, benefit from lower platform fees, and get a verified badge that builds trust with clients." },
      { heading: "How to Apply", content: "Navigate to your profile settings and click 'Join Pro'. You will need to fill out necessary verification details and pass a quick background check." }
    ]
  },
  "pricing": {
    title: "Pricing & Fees",
    description: "Transparent pricing designed for everyone.",
    sections: [
      { heading: "For Askers", content: "Creating an ask is completely free. You only pay the amount you agree upon with your helper." },
      { heading: "For Helpers", content: "We charge a simple, flat 10% service fee on completed jobs to keep the platform running securely and efficiently." }
    ]
  },
  "download": {
    title: "Download the App",
    description: "Get the Snabb app for iOS and Android.",
    sections: [
      { heading: "iOS App Store", content: "Search for 'Snabb' in the Apple App Store to download our highly-rated iOS app and start connecting today." },
      { heading: "Google Play Store", content: "Find us on the Google Play Store to download the Android version for instant access to local help." }
    ]
  },
  "about": {
    title: "About Snabb",
    description: "Our mission to connect communities through immediate help.",
    sections: [
      { heading: "Our Story", content: "Snabb was built with a simple vision: making local help accessible, instantaneous, and reliable. We believe in empowering local economies by connecting neighbors." },
      { heading: "Our Team", content: "We are a passionate group of developers, designers, and community builders dedicated to changing how people get things done." }
    ]
  },
  "blog": {
    title: "Snabb Blog",
    description: "Latest updates, inspiring stories, and pro tips.",
    sections: [
      { heading: "Welcome to Our Blog", content: "We're currently writing amazing content for our community. Check back soon for articles on how to maximize your earnings, get tasks done efficiently, and community spotlights." }
    ]
  },
  "careers": {
    title: "Careers at Snabb",
    description: "Join our fast-growing team and help build the future of local work.",
    sections: [
      { heading: "Open Positions", content: "We are actively looking for talented Full-Stack Engineers, Mobile Developers, and Community Managers. Send your resume to careers@snabb.app." }
    ]
  },
  "press": {
    title: "Press Kit",
    description: "Media resources, brand guidelines, and company information.",
    sections: [
      { heading: "Brand Assets", content: "You can download our high-resolution logos, app screenshots, and complete brand guidelines by contacting press@snabb.app." },
      { heading: "Media Inquiries", content: "For interviews, quotes, or media partnerships, please reach out directly to media@snabb.app." }
    ]
  },
  "contact": {
    title: "Contact Us",
    description: "We're here to help you succeed.",
    sections: [
      { heading: "Get in Touch", content: "Email us anytime at support@snabb.app for inquiries, partnerships, or support requests. We aim to respond within 24 hours." }
    ]
  },
  "help": {
    title: "Help Center",
    description: "Find answers to all your questions.",
    sections: [
      { heading: "Account Issues", content: "Having trouble logging in? You can easily reset your password from the login screen. For persistent issues, contact support." },
      { heading: "Payment Questions", content: "All payments are processed securely via Stripe. If you have a dispute or question about a charge, please use the 'Report an Issue' feature." }
    ]
  },
  "safety": {
    title: "Safety Guidelines",
    description: "Keeping our community safe and secure.",
    sections: [
      { heading: "Meeting in Person", content: "Always arrange to meet in public, well-lit areas. Trust your instincts, inform a friend of your location, and report any suspicious behavior immediately." },
      { heading: "Platform Moderation", content: "We actively monitor requests and messages to ensure our community guidelines are strictly followed. Zero tolerance for harassment." }
    ]
  },
  "report": {
    title: "Report an Issue",
    description: "Let us know if something isn't right.",
    sections: [
      { heading: "How to Report", content: "You can report specific asks or users directly from within the app. For critical safety issues, email safety@snabb.app immediately." }
    ]
  },
  "privacy": {
    title: "Privacy Policy",
    description: "How we protect and manage your data.",
    sections: [
      { heading: "Information Collection", content: "We only collect basic profile information, location data when active, and necessary technical data required to make the app function." },
      { heading: "Data Security", content: "We use industry-standard encryption to protect your data and pledge to never sell your personal information to third parties." }
    ]
  },
  "terms": {
    title: "Terms of Service",
    description: "The rules you agree to when using the Snabb platform.",
    sections: [
      { heading: "User Obligations", content: "You must be 18 or older to use Snabb. You agree to provide accurate information and interact respectfully with all other members." },
      { heading: "Service Limitations", content: "Snabb acts purely as a marketplace connecting users. We do not guarantee the quality of work provided by independent helpers." }
    ]
  },
  "cookies": {
    title: "Cookie Policy",
    description: "How we use cookies to improve your experience.",
    sections: [
      { heading: "Essential Cookies", content: "We use essential cookies to keep you logged in securely and remember your basic account preferences." },
      { heading: "Analytics", content: "We use basic analytics cookies to understand how people navigate our site, helping us continually improve the user experience." }
    ]
  }
};

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const content = pageContents[slug] || {
    title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: "We are currently updating this section.",
    sections: [
      { heading: "Coming Soon", content: "Detailed workflows, guidelines, and information will be available here shortly." }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-7xl w-full mx-auto border-b border-border/40">
        <div className="flex items-center">
          <Link href="/">
            <Logo className="h-12 w-auto" />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-text-secondary hover:text-primary transition-colors font-medium">Features</Link>
          <Link href="/how-it-works" className="text-text-secondary hover:text-primary transition-colors font-medium">How it Works</Link>
          <Link href="/pro" className="text-text-secondary hover:text-primary transition-colors font-medium">Become a Pro</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md"
          >
            Open Web App
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 md:p-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">
          Information & Guidelines
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-foreground">{content.title}</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          {content.description}
        </p>
        
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl mt-12 text-left space-y-8">
          {content.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
              <p className="text-text-secondary leading-relaxed text-lg">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-12">
          <Link href="/" className="text-primary hover:text-primary-dark font-bold text-lg flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
