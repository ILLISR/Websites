import React from "react";
import Dropzone from "./Dropzone";

const Hero = () => {
  return (
    <div className="h-[100vh]  bg-[url('/image/fondo2.jpg')] bg-cover bg-center flex flex-col justify-center items-center">
     
      <div className="absolute inset-0 flex flex-col justify-center items-center space-y-0">
      <h1 className="text-6xl text-[#E95420] font-mono">
    File<span className="text-[#2C001E] font-bold ">Shield</span>
  </h1>
        <Dropzone />
      </div>
    </div>
  );
};

export default Hero;
