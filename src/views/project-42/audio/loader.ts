 
/**
 * Project 42 - Tone.js Dynamic Loader
 * Dynamically injects script at runtime to avoid global bloat or browser blockage.
 */

export async function loadTone(): Promise<void> {
  return new Promise((resolve) => {
    // Check if Tone is already loaded
    if (typeof (window as unknown as { Tone: unknown }).Tone !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}
