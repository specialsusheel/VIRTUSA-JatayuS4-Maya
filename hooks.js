import * as React from "react";

// --- useIsMobile ---
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}

// --- useToast (simple version) ---
// For demonstration, a minimal custom hook for toasts (replace with your preferred library in real app)
function useToast() {
  // This is a placeholder. In a real app, use a library like 'sonner' or 'react-hot-toast'.
  const show = (msg) => alert(msg);
  return { show };
}

export { useIsMobile, useToast }; 