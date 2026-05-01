"use client";
import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function OnboardingTour() {
  useEffect(() => {
    // Only run on client and if we haven't seen the tour
    if (typeof window === 'undefined') return;
    
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        steps: [
          { 
              popover: { 
                  title: 'Welcome to Snabb!', 
                  description: 'Let us quickly show you around your new dashboard.', 
                  side: "left", 
                  align: 'start' 
              } 
          },
          { 
              element: '#tour-create-ask', 
              popover: { 
                  title: 'Post an Ask', 
                  description: 'Need something done? Create an ask to find help instantly.', 
                  side: "bottom", 
                  align: 'start' 
              } 
          },
          { 
              element: '#tour-search', 
              popover: { 
                  title: 'Search Anything', 
                  description: 'Use the global search overlay to instantly find pros, tasks, or users.', 
                  side: "bottom", 
                  align: 'start' 
              } 
          },
          { 
              element: '#tour-categories', 
              popover: { 
                  title: 'Browse by Category', 
                  description: 'Filter active tasks and services by specific categories.', 
                  side: "top", 
                  align: 'start' 
              } 
          },
          { 
              element: '#tour-opportunities', 
              popover: { 
                  title: 'Active Opportunities', 
                  description: 'Browse tasks posted by others and earn money by completing them.', 
                  side: "right", 
                  align: 'start' 
              } 
          },
          { 
              element: '#tour-pros', 
              popover: { 
                  title: 'Hire a Pro', 
                  description: 'Find verified professionals for high-quality services.', 
                  side: "left", 
                  align: 'start' 
              } 
          }
        ],
        onDestroyStarted: () => {
          localStorage.setItem('hasSeenTour', 'true');
          driverObj.destroy();
        },
      });

      // Small timeout to let UI elements render completely before starting
      setTimeout(() => {
        driverObj.drive();
      }, 1000);
    }
  }, []);

  return null;
}
