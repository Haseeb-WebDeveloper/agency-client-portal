/**
 * Utility function to generate time-based greetings
 * @param name - User's name
 * @returns Greeting message with name
 */
export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return `Good Morning, ${name} 👋`;
  } else if (hour < 17) {
    return `Good Afternoon, ${name} 👋`;
  } else {
    return `Good Evening, ${name} 👋`;
  }
}

/**
 * Get greeting subtitle based on time
 * @returns Subtitle message
 */
export function getGreetingSubtitle(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Here's your latest updates!";
  } else if (hour < 17) {
    return "Here's what's happening today!";
  } else {
    return "Here's your evening summary!";
  }
}
