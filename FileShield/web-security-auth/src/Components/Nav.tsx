"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const Nav = () => {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="fixed top-0 w-full h-[13vh] z-50  bg-opacity-75">
      <div className="flex items-center justify-between w-4/5 mx-auto h-full py-2">
        <Link href="/">
          <img
            src="/image/logo41.png"
            width="140px"
            className="mt-2"
          />
        </Link>

        {session?.user ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-center mt-2">
              <p className="pr-3 text-white font-bold ">{session.user.name}</p>
              <div
                style={{
                  backgroundImage: `url(${session.user.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
            </div>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2C001E] border border-gray-700 rounded-md shadow-lg z-20">
                <div className="px-4 py-3">
                  <span className="block text-sm font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap">
                    {session.user.email}
                  </span>
                </div>
                <div className="border-t border-gray-600"></div>
                <Link className="block w-full text-left px-4 py-2 text-sm  font-bold text-white hover:bg-gray-700" href="/historial">Historial</Link>
                <div className="border-t border-gray-600"></div>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm font-bold text-white hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex space-x-8">
            <button className="nav-link text-white" onClick={() => signIn()}>
              Iniciar Sesion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Nav;
