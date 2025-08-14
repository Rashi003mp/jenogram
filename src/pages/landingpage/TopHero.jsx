import React, { useRef, useEffect } from "react";
import heroVdo from "../../assets/video/hero.mp4";

const TopHero = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    }
  }, []);

  return (
    <div className="relative w-full h-[100vh] overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={heroVdo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/fallback-image.jpg"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20 z-10" />

      {/* Text Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20">
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-widest mb-2 text-white">
          MENS
        </h1>

        <p className="text-lg md:text-xl font-light text-white mb-6">
          Fall-Winter 2025
        </p>

        <h3 className="px-6 py-2 md:px-8 md:py-3  text-white uppercase tracking-wider text-sm md:text-base transition-colors duration-300 cursor-pointer">
          Discover the Collection <br />
          UNIQUENESS
        </h3>
      </div>
    </div>
  );
};

export default TopHero;
