"use client";
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from "../context/AnalysisContext";
import { useSession } from "next-auth/react";

const Dropzone = () => {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const { setData } = useAnalysis();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Arrastra y suelta los archivos o elige los archivos para subir");

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("Enviando solicitud...");

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const headers = {};
    if (session?.user?.id) {
      headers['user-id'] = session.user.id;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(data);
      router.push('/results');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
      setMessage(files.length === 0 ? "Arrastra y suelta los archivos o elige los archivos para subir" : "");
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const newFiles = [];
      for (let i = 0; i < e.target.files.length; i++) {
        newFiles.push(e.target.files[i]);
      }
      setFiles(prevState => {
        const updatedFiles = [...prevState, ...newFiles];
        setMessage(updatedFiles.length === 0 ? "Arrastra y suelta los archivos o elige los archivos para subir" : "");
        return updatedFiles;
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        newFiles.push(e.dataTransfer.files[i]);
      }
      setFiles(prevState => {
        const updatedFiles = [...prevState, ...newFiles];
        setMessage(updatedFiles.length === 0 ? "Arrastra y suelta los archivos o elige los archivos para subir" : "");
        return updatedFiles;
      });
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const removeFile = (idx) => {
    const newArr = [...files];
    newArr.splice(idx, 1);
    setFiles(newArr);
    setMessage(newArr.length === 0 ? "Arrastra y suelta los archivos o elige los archivos para subir" : "");
  };

  const openFileExplorer = () => {
    inputRef.current.value = "";
    inputRef.current.click();
  };

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="bg-black border border-gray-700 rounded-lg shadow-lg w-full max-w-lg">
        <div className="bg-[#2C001E] p-2 rounded-t-lg flex justify-center items-center">
          {isSubmitting ? (
            <span className="text-green-500 font-bold">Enviando solicitud...</span>
          ) : (
            <span className="text-green-500  font-bold">
              {session?.user ? `root@${session.user.name}` : "User"}
            </span>
          )}
        </div>
        <form
          className={`${
            dragActive ? "bg-[#5E2750]" : "bg-[#2C001E]"
          } p-6 w-full text-center flex flex-col items-center justify-center transition-colors duration-300`}
          onDragEnter={handleDragEnter}
          onSubmit={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
        >
          <input
            className="hidden"
            ref={inputRef}
            type="file"
            multiple={true}
            onChange={handleChange}
            accept=".xlsx,.xls,image/*,.doc,.docx,.ppt,.pptx,.txt,.pdf"
          />

          {files.length === 0 && (
            <p className="text-lg font-semibold text-green-500">
              
              {message}
              <span
                className="font-bold text-[#E95420] cursor-pointer underline"
                onClick={openFileExplorer}
              >{" "} 
                elige los archivos
              </span>
              {" "} para subir
            </p>
          )}

          <div className="flex flex-col items-center p-3 w-full">
            {files.map((file, idx) => (
              <div key={idx} className="flex flex-row space-x-5 items-center w-full justify-between text-green-500">
                <span 
                  className="truncate max-w-xs"
                  title={file.name}
                >
         

                  {session?.user ? 
                    (file.name.length > 20 ? 
                      `root@${session.user.name}:/# curl -X GET ${file.name.substring(0, 10)}...` : 
                      `root@${session.user.name}:/# curl -X GET  ${file.name}`) : 
                      (file.name.length > 20 ? 
                        `User@User  curl -X GET:/# ${file.name.substring(0, 10)}...` : 
                        `User@$User curl -X GET:/# ${file.name}`)
                  }
                </span>
                <span
                  className="text-red-500 cursor-pointer"
                  onClick={() => removeFile(idx)}
                >
                  Eliminar
                </span>
              </div>
            ))}
          </div>

          <button
            className="bg-green-500 rounded-lg p-3 mt-4 w-auto text-[#E95420] font-bold hover:bg-gray-700 transition-colors duration-300"
            onClick={handleSubmitFile}
            disabled={isSubmitting}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dropzone;
