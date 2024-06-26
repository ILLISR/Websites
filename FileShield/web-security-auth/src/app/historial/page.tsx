"use client";
import React from "react";
import Particle from "@/Components/Particles";
import Historial from "@/Components/Historial";

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#2C001E] to-black bg-cover bg-center flex flex-col items-center justify-center py-10">
      <Particle></Particle>
      <Historial />
    </div>
  );
};

export default page;
