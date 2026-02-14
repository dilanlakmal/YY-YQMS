import React, { useState } from "react";
import Scanner from "../../../components/forms/Scanner";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const EmpQRCodeScanner = ({ onUserDataFetched, onClose }) => {
  const [scannedData, setScannedData] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleScanSuccess = async (decodedText) => {
    setScannedData(decodedText);

    try {
      // Fetch user data based on emp_id (decodedText)
      const response = await axios.get(`${API_BASE_URL}/api/user-by-emp-id`, {
        params: { emp_id: decodedText }
      });

      const user = response.data;
      setUserData(user);
      onUserDataFetched(user); // Pass the user data to the parent component
    } catch (error) {
      console.error("Error fetching user data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch user data."
      });
    }
  };

  const handleScanError = (error) => {
    console.error("Scan error:", error);
    Swal.fire({
      icon: "error",
      title: "Scan Error",
      text: error
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Scan Employee QR Code</h2>
        <Scanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
        {scannedData && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Scanned Emp ID: {scannedData}
            </p>
          </div>
        )}
        {userData && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-medium">User Details</h3>
            <p>
              <strong>Emp ID:</strong> {userData.emp_id}
            </p>
            <p>
              <strong>English Name:</strong> {userData.eng_name || "N/A"}
            </p>
            <p>
              <strong>Khmer Name:</strong> {userData.kh_name || "N/A"}
            </p>
            <p>
              <strong>Job Title:</strong> {userData.job_title || "N/A"}
            </p>
            <p>
              <strong>Department:</strong> {userData.dept_name || "N/A"}
            </p>
            <p>
              <strong>Section:</strong> {userData.sect_name || "N/A"}
            </p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmpQRCodeScanner;
