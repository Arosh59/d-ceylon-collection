"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function RevealOnView({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10%" },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`home-reveal ${className}`} data-visible={visible} ref={element}>
      {children}
    </div>
  );
}
