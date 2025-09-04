import React, { useState, useEffect } from "react";
import { Users, Download, FileText } from "lucide-react";
import { API_BASE_URL } from "../apis";
import { useAuth } from "../context/AuthProvider";

const AcceptedStudentsContent = (props) => {
  const [acceptedStudents, setAcceptedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hostelName, setHostelName] = useState("");

  const { token, isAuthenticated, logout } = useAuth();

  const fetchAcceptedStudents = async () => {
    if (!token || !isAuthenticated || !props.hostelName) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/mess-change/accepted-students/${props.hostelName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (response.status === 401) {
        logout("Session has expired");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAcceptedStudents(data.data || []);
      setHostelName(props.hostelName);
    } catch (error) {
      console.error("Error fetching accepted students:", error);
      setAcceptedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // Create PDF content
    const currentDate = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    // Create table HTML
    let tableHTML = `
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Sl. No</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">From</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">To</th>
          </tr>
        </thead>
        <tbody>
    `;

    acceptedStudents.forEach((student, index) => {
      tableHTML += `
        <tr>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${
            student.userName
          }</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${
            student.fromHostel
          }</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${
            student.toHostel
          }</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    // Create full HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${hostelName} - Accepted Students</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .month-year { color: #6b7280; font-size: 18px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${hostelName}</h1>
            <div class="month-year">${month}, ${year}</div>
          </div>
          ${tableHTML}
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hostelName}_Accepted_Students_${month}_${year}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (props.hostelName && token && isAuthenticated) {
      fetchAcceptedStudents();
    }
  }, [props.hostelName, token, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">
          Please log in to view accepted students
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Accepted Students
        </h2>
        <p className="text-gray-600">
          Students who will be joining {hostelName} mess
        </p>
      </div>

      {acceptedStudents.length > 0 && (
        <div className="flex justify-center mb-6">
          <button
            onClick={downloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            Download List
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading accepted students...</p>
        </div>
      )}

      {!loading && acceptedStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No accepted students found for this hostel
          </p>
        </div>
      ) : (
        !loading && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sl. No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {acceptedStudents.map((student, index) => (
                  <tr
                    key={student._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.fromHostel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.toHostel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        student.updatedAt || student.createdAt
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default AcceptedStudentsContent;
