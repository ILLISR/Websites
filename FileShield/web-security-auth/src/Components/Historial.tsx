import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import Pagination from 'react-js-pagination';

const Historial = () => {
  const { data: session } = useSession();
  const [historial, setHistorial] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!session || !session.user || !session.user.id) {
        console.error("User is not authenticated");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/historial", {
          headers: {
            'user-id': session.user.id,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data); // Verifica aquí

        if (Array.isArray(data)) {
          // Ordenar el historial por fecha en orden descendente
          const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setHistorial(sortedData);
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error fetching historial:', error);
      }
    };

    fetchHistorial();
  }, [session]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page to 1 whenever search term changes
  };

  const filteredHistorial = historial.filter(item =>
    item.hash_value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredHistorial.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h2 className="  text-3xl text-center font-bold text-[#E95420] mb-6">Historial de Búsquedas</h2>
      <input
        type="text"
        placeholder="Buscar por hash"
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full px-4 py-2 mb-4 bg-[#E95420] text-white  placeholder-white font-semi-bold rounded"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#E95420] border border-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b border-white bg-[#E95420] text-left text-xs leading-4 font-semi-bold text-white uppercase tracking-wider">
                Hash del archivo
              </th>
              <th className="px-6 py-3 border-b border-white bg-[#E95420] text-left text-xs leading-4 font-semi-bold text-white uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 border-b border-white bg-[#E95420] text-left text-xs leading-4 font-semi-bold text-white uppercase tracking-wider">
                Tipo de archivo
              </th>
              <th className="px-6 py-3 border-b border-white bg-[#E95420] text-left text-xs leading-4 font-semi-bold text-white uppercase tracking-wider">
                Veredicto
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(currentData) && currentData.map((item, index) => {
              const positives = Object.values(item.analysis_result.last_analysis_result || {}).filter(
                (result: any) => result.category === "malicious"
              ).length;

              let veredicto = "Limpio";
              let veredictoColor = "text-green-500 font-bold";
              if (positives > 5) {
                veredicto = "Positivo";
                veredictoColor = "text-[#800080] font-bold";
              } else if (positives > 0) {
                veredicto = "Dudoso";
                veredictoColor = "text-[#8B00FF] font-bold";
              }

              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-white">
                    <div className="leading-5 font-semi-bold text-white">{item.hash_value}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-white">
                    <div className="leading-5 font-semi-bold text-white">{new Date(item.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-white">
                    <div className="leading-5 font-semi-bold text-white">{item.file_type}</div>
                  </td>
                  <td className={`px-6 py-4 whitespace-no-wrap border-b border-white ${veredictoColor}`}>
                    <div className="leading-5 font-semi-bold">{veredicto}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4">
        <Pagination
          activePage={currentPage}
          itemsCountPerPage={itemsPerPage}
          totalItemsCount={filteredHistorial.length}
          pageRangeDisplayed={5}
          onChange={(pageNumber) => setCurrentPage(pageNumber)}
          itemClass="px-3 py-1 border rounded-md text-white bg-[#E95420] hover:bg-green-500"
          linkClass="page-link"
          activeClass=" font-semi-bold text-white"
          activeLinkClass=" font-semi-bold text-white"
          innerClass="pagination flex flex-wrap gap-2 justify-center mt-4"
          itemClassPrev="px-3 py-1 border rounded-md  font-semi-bold text-white bg-[#E95420] hover:bg-green-500"
          itemClassNext="px-3 py-1 border rounded-md  font-semi-bold text-white bg-[#E95420] hover:bg-green-500"
          linkClassPrev="page-link-prev"
          linkClassNext="page-link-next"
        />
      </div>
    </div>
  );
};

export default Historial;
