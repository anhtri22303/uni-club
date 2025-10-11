"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ClientOnlyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component wrapper để đảm bảo children chỉ render sau khi client hydrated
 * Tránh hydration mismatch giữa server và client
 */
export function ClientOnlyWrapper({ children, fallback }: ClientOnlyWrapperProps): React.ReactElement {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <React.Fragment>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </React.Fragment>
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
}