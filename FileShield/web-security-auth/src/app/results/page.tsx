"use client"
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useAnalysis } from '../../context/AnalysisContext';
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Pagination from 'react-js-pagination';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
ChartJS.defaults.color = "white";

const Results = () => {
  const { data } = useAnalysis();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;
  const tableRefs = useRef([]);

  useEffect(() => {
    if (data) {
      console.log('Datos procesados ESTOY EN RESULTS:', data);
    } else {
      console.log('NO HAY NADA AQUI');
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1); // Reset page to 1 whenever search term changes
  }, [searchTerm]);

  const filesData = data || [];

  const filteredData = filesData.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const positives = currentData.map((file) => {
    if (file.last_analysis_result) {
      return Object.values(file.last_analysis_result).filter(
        (result) => result.category === "malicious"
      ).length;
    }
    return 0;
  });

  const negatives = currentData.map((file, idx) => {
    return file.last_analysis_result
      ? Object.keys(file.last_analysis_result).length - positives[idx]
      : 0;
  });

  const maliciousVerdicts = currentData.map((file) => {
    if (file.sandbox_verdicts) {
      return Object.values(file.sandbox_verdicts).filter(
        (verdict) => verdict.category === "malicious"
      ).length;
    }
    return 0;
  });

  const undetectedVerdicts = currentData.map((file) => {
    if (file.sandbox_verdicts) {
      return Object.values(file.sandbox_verdicts).filter(
        (verdict) => verdict.category === "undetected"
      ).length;
    }
    return 0;
  });

  const sortedFilesData = currentData
    .map((file, idx) => ({
      ...file,
      positives: positives[idx],
      negatives: negatives[idx],
      malicious: maliciousVerdicts[idx],
      undetected: undetectedVerdicts[idx],
    }))
    .sort((a, b) => {
      if (a.malicious > 0 && b.malicious === 0) {
        return -1;
      } else if (a.malicious === 0 && b.malicious > 0) {
        return 1;
      } else {
        return b.positives - a.positives;
      }
    });

  const labels = sortedFilesData.map((file) => file.name.length > 2 ? `${file.name.substring(0, 2)}...` : file.name);

  const barData = {
    labels,
    datasets: [
      {
        label: "Positivos",
        data: sortedFilesData.map((file) => file.positives),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Negativos",
        data: sortedFilesData.map((file) => file.negatives),
        backgroundColor: "rgba(22, 198, 64, 0.5)",
        borderColor: "rgba(54, 137, 74, 0.8)",
        borderWidth: 1,
      },
      {
        label: "Positivos Verdicts Sandbox",
        data: sortedFilesData.map((file) => file.malicious),
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
      },
      {
        label: "Negativos Verdicts Sandbox",
        data: sortedFilesData.map((file) => file.undetected),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y', // Cambiar la orientación a horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Resultados de Análisis de Archivos",
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            return sortedFilesData[index].name;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          autoSkip: false,
        },
      },
    },
    onClick: (e, element) => {
      if (element.length > 0) {
        const index = element[0].index;
        const ref = tableRefs.current[index];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
  };

  const copyToClipboard = (text, event) => {
    navigator.clipboard.writeText(text).then(() => {
      setTooltip({ visible: true, x: event.clientX, y: event.clientY });
      setTimeout(() => {
        setTooltip({ visible: false, x: 0, y: 0 });
      }, 2000);
    }, (err) => {
      console.error('Error al copiar el texto: ', err);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-black to-[#E95420] bg-cover bg-center flex flex-col items-center justify-center py-10">
      {tooltip.visible && (
        <div
          style={{ top: tooltip.y, left: tooltip.x }}
          className="fixed z-50 p-2 bg-gray-800 text-white rounded"
        >
          Se ha copiado el texto en el portapapeles
        </div>
      )}
      {data ? (
        <div className="w-full max-w-7xl mt-8 space-y-8 ">
          <input
            type="text"
            placeholder="Buscar archivos"
            
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 mb-4 rounded z-50 relative bg-[#2C001E] font-bold text-white"
            style={{ zIndex: 50, position: 'relative' }} // Asegurar que el input esté en la parte superior
          />
          <div className="flex flex-col md:flex-row w-full space-y-8 md:space-y-0 md:space-x-8">
            <div className="w-full md:w-1/2 sticky top-10 h-[70vh]">
              <div className="relative w-full h-full">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
            <div className="w-full md:w-1/2 overflow-auto max-h-[70vh] px-4 relative">
              {sortedFilesData.map((file, idx) => (
                <div key={idx} ref={el => tableRefs.current[idx] = el} className="my-4 p-4 bg-[#2C001E] rounded shadow-md">
                  <h3
                    className={`cursor-pointer text-lg ${
                      file.positives > 5
                        ? "text-[#ff0000]"
                        : file.positives > 0
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                    title={file.name}
                  >
                    {file.name.length > 40 ? `${file.name.substring(0, 40)}...` : file.name}
                  </h3>
                  <div className="mt-4">
                    <details>
                      <summary className="cursor-pointer text-white">Detalles del Análisis Antivirus</summary>
                      <div className="mt-4 max-h-60 overflow-y-auto">
                        <table className="w-full divide-y divide-x divide-white">
                          <thead className="bg-[#2C001E] text-white  divide-y divide-x divide-white">
                            <tr>
                              <th className="px-2 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                                Motor de Búsqueda
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Veredicto
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                                Método
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Resultado
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-[#2C001E] text-white divide-y divide-white">
                            {Object.entries(file.last_analysis_result || {}).sort(
                              ([, a], [, b]) => {
                                if (a.category === "malicious" && b.category !== "malicious") {
                                  return -1;
                                } else if (a.category !== "malicious" && b.category === "malicious") {
                                  return 1;
                                } else {
                                  return 0;
                                }
                              }
                            ).map(
                              ([engine, { category, engine_name, method, result }], scanIdx) => (
                                <tr key={scanIdx}>
                                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-white">
                                    {engine_name}
                                  </td>
                                  <td
                                    className={`px-2 py-4 whitespace-nowrap text-sm ${
                                      category === "malicious"
                                        ? "text-[#ff0000]"
                                        : "text-green-500"
                                    }`}
                                  >
                                    {category === "malicious" ? "Malicioso" : "Limpio"}
                                  </td>
                                  <td className="px-2 py-4 whitespace-nowrap text-sm">
                                    {method}
                                  </td>
                                  <td
                                    className="px-2 py-4 whitespace-nowrap text-sm cursor-pointer"
                                    onClick={(event) => copyToClipboard(result ?? "Undetected", event)}
                                  >
                                    {result ?? "Undetected"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                  <div className="mt-4">
                    <details>
                      <summary className="cursor-pointer text-white">Detalles del Análisis Sandbox</summary>
                      <div className="mt-4 max-h-60 overflow-y-auto">
                      <table className="w-full divide-y divide-x divide-white">
                      <thead className="bg-[#2C001E] text-white">
                            <tr>
                              <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Sandbox
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                                Veredicto
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                Clasificación de Malware
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-[#2C001E] text-white divide-y divide-white">
                            {Object.entries(file.sandbox_verdicts || {}).sort(
                              ([, a], [, b]) => {
                                if (a.category === "malicious" && b.category !== "malicious") {
                                  return -1;
                                } else if (a.category !== "malicious" && b.category === "malicious") {
                                  return 1;
                                } else {
                                  return 0;
                                }
                              }
                            ).map(
                              ([sandbox, { category, malware_classification }], sandboxIdx) => (
                                <tr key={sandboxIdx}>
                                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-white">
                                    {sandbox}
                                  </td>
                                  <td
                                    className={`px-2 py-4 whitespace-nowrap text-sm ${
                                      category === "malicious"
                                        ? "text-[#ff0000]"
                                        : "text-green-500"
                                    }`}
                                  >
                                    {category === "malicious" ? "Malicioso" : "Limpio"}
                                  </td>
                                  <td
                                    className="px-2 py-4 whitespace-nowrap text-sm cursor-pointer"
                                    onClick={(event) => copyToClipboard(malware_classification ?? "Undetected", event)}
                                  >
                                    {malware_classification ?? "Undetected"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
              
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Pagination
              activePage={currentPage}
              itemsCountPerPage={itemsPerPage}
              totalItemsCount={filteredData.length}
              pageRangeDisplayed={10}
              onChange={(pageNumber) => setCurrentPage(pageNumber)}
              itemClass="px-3 py-1 border rounded-md text-white bg-[#2C001E] hover:bg-gray-200"
              linkClass="page-link"
              activeClass=" text-white"
              activeLinkClass=" text-white"
              innerClass="pagination flex flex-wrap gap-2 justify-center mt-4"
              itemClassPrev="px-3 py-1 border rounded-md text-white bg-[#2C001E] hover:bg-gray-200"
              itemClassNext="px-3 py-1 border rounded-md ttext-white bg-[#2C001E] hover:bg-gray-200"
              linkClassPrev="page-link-prev"
              linkClassNext="page-link-next"
            />
          </div>
        </div>
      ) : (
        <div className=" justify-center items-center">
          <h1 className=" text-[#2C001E] text-center ">No hay ningun dato a processar</h1>
          <Link href="/">
            <img
              src="/image/logo41.png"
              width="400px"
            />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Results;
