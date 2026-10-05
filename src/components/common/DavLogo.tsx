import React from "react";

interface DavLogoProps {
  className?: string;
  imgClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark" | "full-color";
}

export const DavLogo: React.FC<DavLogoProps> = ({
  className = "",
  imgClassName = "",
  size = "md",
  showText = true,
  variant = "full-color",
}) => {
  const sizeMap = {
    sm: {
      width: 26,
      height: 36,
      imgClass: "h-9 w-auto",
      textTitle: "text-sm",
      textSub: "text-[9px]",
    },
    md: {
      width: 34,
      height: 48,
      imgClass: "h-12 w-auto",
      textTitle: "text-base",
      textSub: "text-[11px]",
    },
    lg: {
      width: 46,
      height: 64,
      imgClass: "h-16 w-auto",
      textTitle: "text-xl",
      textSub: "text-xs",
    },
    xl: {
      width: 60,
      height: 84,
      imgClass: "h-20 w-auto",
      textTitle: "text-2xl",
      textSub: "text-sm",
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Complete DAV University Crest */}
      <div
        className={`flex-shrink-0 transition-transform duration-300 hover:scale-105 ${
          variant === "dark" ? "rounded-xl shadow-xs bg-white/95 p-0.5" : ""
        }`}
      >
        <img
          src="/dav-logo.png"
          alt="DAV University Official Emblem"
          width={currentSize.width}
          height={currentSize.height}
          className={`object-contain drop-shadow-xs ${currentSize.imgClass} ${imgClassName}`}
        />
      </div>

      {/* University Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight uppercase ${currentSize.textTitle} ${
                variant === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              DAV <span className="text-davu-red-600">University</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-davu-red-700 bg-davu-red-50 border border-davu-red-200 rounded">
              JALANDHAR
            </span>
          </div>
          <span
            className={`font-medium tracking-normal text-slate-500 ${currentSize.textSub}`}
          >
            Medical Leave Application Portal
          </span>
        </div>
      )}
    </div>
  );
};
