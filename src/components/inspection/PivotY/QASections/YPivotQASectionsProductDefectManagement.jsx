// import axios from "axios";
// import {
//   Check,
//   Edit2,
//   Plus,
//   Save,
//   Trash2,
//   X,
//   Filter,
//   Search
// } from "lucide-react";
// import React, { useEffect, useMemo, useState } from "react";
// import Swal from "sweetalert2";
// import { API_BASE_URL } from "../../../../../config";

// // Reusable Remarks Modal Component
// const RemarksModal = ({ isOpen, onClose, remarks, onSave }) => {
//   const [text, setText] = useState(remarks);
//   const MAX_CHARS = 250;

//   if (!isOpen) return null;

//   const handleSave = () => {
//     onSave(text);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
//         <h3 className="text-lg font-bold mb-4">Edit Remarks</h3>
//         <textarea
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           maxLength={MAX_CHARS}
//           className="w-full h-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
//           placeholder="Enter remarks..."
//         />
//         <div className="text-right text-sm text-gray-500 mb-4">
//           {text.length} / {MAX_CHARS}
//         </div>
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
//           >
//             Save Remarks
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const YPivotQASectionsProductDefectManagement = () => {
//   const [defects, setDefects] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAddingNew, setIsAddingNew] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   // Modal State
//   const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
//   const [currentRemarks, setCurrentRemarks] = useState("");
//   const [remarksSaveCallback, setRemarksSaveCallback] = useState(null);

//   // Form states
//   const [newDefect, setNewDefect] = useState({
//     code: "",
//     english: "",
//     khmer: "",
//     chinese: "",
//     defectLetter: "",
//     remarks: "",
//     CategoryCode: "",
//     isCommon: "Yes"
//   });
//   const [editData, setEditData] = useState(null);

//   // Filter State
//   const [filters, setFilters] = useState({
//     code: "",
//     english: "",
//     MainCategoryCode: "",
//     CategoryNameEng: "",
//     isCommon: ""
//   });

//   useEffect(() => {
//     fetchDefects();
//     fetchCategories();
//   }, []);

//   const fetchDefects = async () => {
//     setIsLoading(true);
//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/api/qa-sections-defect-list`
//       );
//       if (response.data.success) {
//         //Implement custom numerical sort before setting the state
//         const sortedData = response.data.data.sort((a, b) => {
//           // Split codes like "1.10" into parts [1, 10]
//           const partsA = a.code.split(".").map(Number);
//           const partsB = b.code.split(".").map(Number);

//           // Compare the main number first (the part before the dot)
//           if (partsA[0] !== partsB[0]) {
//             return partsA[0] - partsB[0];
//           }

//           // If main numbers are equal, compare the sub-number (the part after the dot)
//           return (partsA[1] || 0) - (partsB[1] || 0);
//         });
//         setDefects(sortedData);
//       }
//       //setDefects(response.data.data);
//     } catch (error) {
//       Swal.fire("Error", "Failed to load defects", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/api/qa-sections-defect-category`
//       );
//       setCategories(response.data.data);
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//     }
//   };

//   // Memoized filtered defects for performance
//   const filteredDefects = useMemo(() => {
//     return defects.filter((defect) => {
//       return (
//         (filters.code
//           ? defect.code.toLowerCase().includes(filters.code.toLowerCase())
//           : true) &&
//         (filters.english
//           ? defect.english.toLowerCase().includes(filters.english.toLowerCase())
//           : true) &&
//         (filters.MainCategoryCode
//           ? defect.MainCategoryCode.toString() === filters.MainCategoryCode
//           : true) &&
//         (filters.CategoryNameEng
//           ? defect.CategoryNameEng === filters.CategoryNameEng
//           : true) &&
//         (filters.isCommon ? defect.isCommon === filters.isCommon : true)
//       );
//     });
//   }, [defects, filters]);

//   // === ADD NEW DEFECT HANDLERS ===
//   const handleShowAddNew = () => {
//     setIsAddingNew(true);
//     setNewDefect({
//       code: "",
//       english: "",
//       khmer: "",
//       chinese: "",
//       defectLetter: "",
//       remarks: "",
//       CategoryCode: "",
//       isCommon: "Yes"
//     });
//   };
//   const handleCancelAddNew = () => setIsAddingNew(false);

//   const handleNewCategorySelect = (e) => {
//     const categoryCode = e.target.value;
//     setNewDefect({ ...newDefect, CategoryCode: categoryCode });
//   };

//   const handleSaveNew = async () => {
//     const { code, english, defectLetter, CategoryCode, isCommon } = newDefect;
//     if (
//       !code.trim() ||
//       !english.trim() ||
//       !defectLetter.trim() ||
//       !CategoryCode
//     ) {
//       Swal.fire(
//         "Validation Error",
//         "Defect Code, English Name, Letter, and Category are required.",
//         "warning"
//       );
//       return;
//     }
//     const selectedCategory = categories.find(
//       (c) => c.CategoryCode === CategoryCode
//     );
//     try {
//       await axios.post(`${API_BASE_URL}/api/qa-sections-defect-list`, {
//         ...newDefect,
//         CategoryNameEng: selectedCategory.CategoryNameEng,
//         CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
//         CategoryNameChinese: selectedCategory.CategoryNameChinese
//       });
//       Swal.fire("Created!", "New defect has been created.", "success");
//       fetchDefects();
//       handleCancelAddNew();
//     } catch (error) {
//       Swal.fire(
//         "Error",
//         error.response?.data?.message || "Failed to create defect",
//         "error"
//       );
//     }
//   };

//   // === EDIT DEFECT HANDLERS ===
//   const handleEdit = (defect) => {
//     setEditingId(defect._id);
//     setEditData({ ...defect });
//   };
//   const handleCancelEdit = () => setEditingId(null);

//   const handleEditDataChange = (field, value) => {
//     setEditData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleEditCategoryChange = (e) => {
//     const newCategoryCode = e.target.value;
//     const selectedCategory = categories.find(
//       (c) => c.CategoryCode === newCategoryCode
//     );
//     if (selectedCategory) {
//       setEditData((prev) => ({
//         ...prev,
//         CategoryCode: newCategoryCode,
//         CategoryNameEng: selectedCategory.CategoryNameEng,
//         CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
//         CategoryNameChinese: selectedCategory.CategoryNameChinese
//       }));
//     }
//   };

//   const handleSaveEdit = async (id) => {
//     try {
//       await axios.put(
//         `${API_BASE_URL}/api/qa-sections-defect-list/${id}`,
//         editData
//       );
//       Swal.fire("Updated!", "Defect has been updated.", "success");
//       fetchDefects();
//       handleCancelEdit();
//     } catch (error) {
//       Swal.fire(
//         "Error",
//         error.response?.data?.message || "Failed to update defect",
//         "error"
//       );
//     }
//   };

//   // === DELETE DEFECT HANDLER ===
//   const handleDelete = async (id, name) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: `Delete "${name}"?`,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       confirmButtonText: "Yes, delete it!"
//     });
//     if (result.isConfirmed) {
//       try {
//         await axios.delete(`${API_BASE_URL}/api/qa-sections-defect-list/${id}`);
//         Swal.fire("Deleted!", "Defect has been deleted.", "success");
//         fetchDefects();
//       } catch (error) {
//         Swal.fire("Error", "Failed to delete defect", "error");
//       }
//     }
//   };

//   // === REMARKS MODAL HANDLERS ===
//   const openRemarksModal = (defect) => {
//     setCurrentRemarks(defect.remarks || "");
//     setRemarksSaveCallback(() => (newRemarks) => {
//       handleEditDataChange("remarks", newRemarks);
//     });
//     setIsRemarksModalOpen(true);
//   };

//   const uniqueMainCategories = [...new Set(categories.map((c) => c.no))].sort(
//     (a, b) => a - b
//   );
//   const uniqueCategoryNames = [
//     ...new Set(categories.map((c) => c.CategoryNameEng))
//   ].sort();

//   if (isLoading)
//     return <div className="text-center p-10">Loading defects...</div>;

//   return (
//     <div className="space-y-6">
//       <RemarksModal
//         isOpen={isRemarksModalOpen}
//         onClose={() => setIsRemarksModalOpen(false)}
//         remarks={currentRemarks}
//         onSave={remarksSaveCallback}
//       />

//       {/* Filter Section */}
//       <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
//           <h3 className="col-span-full font-semibold text-lg flex items-center gap-2">
//             <Filter size={18} /> Filter Defects
//           </h3>
//           <div>
//             <label className="text-sm font-medium">Defect Code</label>
//             <input
//               type="text"
//               value={filters.code}
//               onChange={(e) => setFilters({ ...filters, code: e.target.value })}
//               className="w-full p-2 border rounded-md dark:bg-gray-800"
//             />
//           </div>
//           <div>
//             <label className="text-sm font-medium">Defect Name (Eng)</label>
//             <input
//               type="text"
//               value={filters.english}
//               onChange={(e) =>
//                 setFilters({ ...filters, english: e.target.value })
//               }
//               className="w-full p-2 border rounded-md dark:bg-gray-800"
//             />
//           </div>
//           <div>
//             <label className="text-sm font-medium">Main Cat. Code</label>
//             <select
//               value={filters.MainCategoryCode}
//               onChange={(e) =>
//                 setFilters({ ...filters, MainCategoryCode: e.target.value })
//               }
//               className="w-full p-2 border rounded-md dark:bg-gray-800"
//             >
//               <option value="">All</option>
//               {uniqueMainCategories.map((mc) => (
//                 <option key={mc} value={mc}>
//                   {mc}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="text-sm font-medium">Category Name</label>
//             <select
//               value={filters.CategoryNameEng}
//               onChange={(e) =>
//                 setFilters({ ...filters, CategoryNameEng: e.target.value })
//               }
//               className="w-full p-2 border rounded-md dark:bg-gray-800"
//             >
//               <option value="">All</option>
//               {uniqueCategoryNames.map((cn) => (
//                 <option key={cn} value={cn}>
//                   {cn}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="text-sm font-medium">Is Common</label>
//             <select
//               value={filters.isCommon}
//               onChange={(e) =>
//                 setFilters({ ...filters, isCommon: e.target.value })
//               }
//               className="w-full p-2 border rounded-md dark:bg-gray-800"
//             >
//               <option value="">All</option>
//               <option value="Yes">Yes</option>
//               <option value="No">No</option>
//             </select>
//           </div>
//           <button
//             onClick={() =>
//               setFilters({
//                 code: "",
//                 english: "",
//                 MainCategoryCode: "",
//                 CategoryNameEng: "",
//                 isCommon: ""
//               })
//             }
//             className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md"
//           >
//             Clear
//           </button>
//         </div>
//       </div>

//       <div className="flex justify-end">
//         <button
//           onClick={handleShowAddNew}
//           disabled={isAddingNew}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md"
//         >
//           <Plus size={18} /> Add New Defect
//         </button>
//       </div>

//       {/* Main Table */}
//       <div className="overflow-x-auto overflow-y-auto max-h-[60vh] shadow-lg rounded-lg border dark:border-gray-700">
//         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//           <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
//             <tr>
//               <th className="px-4 py-3 text-center text-xs font-bold uppercase">
//                 Main Category
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-bold uppercase">
//                 Defect Code
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-bold uppercase">
//                 Defect Name
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-bold uppercase">
//                 Defect Letter
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-bold uppercase">
//                 Category
//               </th>
//               <th className="px-4 py-3 text-center text-xs font-bold uppercase">
//                 Common
//               </th>
//               <th className="px-4 py-3 text-center text-xs font-bold uppercase">
//                 Remarks
//               </th>
//               <th className="px-4 py-3 text-center text-xs font-bold uppercase">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//             {isAddingNew && (
//               <tr className="bg-indigo-50 dark:bg-indigo-900/20">
//                 <td></td>
//                 <td>
//                   <input
//                     type="text"
//                     value={newDefect.code}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, code: e.target.value })
//                     }
//                     className="w-24 p-1 border rounded"
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     placeholder="English*"
//                     value={newDefect.english}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, english: e.target.value })
//                     }
//                     className="w-full p-1 border rounded mb-1"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Khmer"
//                     value={newDefect.khmer}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, khmer: e.target.value })
//                     }
//                     className="w-full p-1 border rounded mb-1"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Chinese"
//                     value={newDefect.chinese}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, chinese: e.target.value })
//                     }
//                     className="w-full p-1 border rounded"
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={newDefect.defectLetter}
//                     onChange={(e) =>
//                       setNewDefect({
//                         ...newDefect,
//                         defectLetter: e.target.value
//                       })
//                     }
//                     className="w-20 p-1 border rounded"
//                   />
//                 </td>
//                 <td>
//                   <select
//                     value={newDefect.CategoryCode}
//                     onChange={handleNewCategorySelect}
//                     className="w-full p-1 border rounded"
//                   >
//                     <option value="">Select Category*</option>
//                     {categories.map((c) => (
//                       <option key={c._id} value={c.CategoryCode}>
//                         {c.CategoryNameEng}
//                       </option>
//                     ))}
//                   </select>
//                 </td>
//                 <td>
//                   <select
//                     value={newDefect.isCommon}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, isCommon: e.target.value })
//                     }
//                     className="w-full p-1 border rounded"
//                   >
//                     <option value="Yes">Yes</option>
//                     <option value="No">No</option>
//                   </select>
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     value={newDefect.remarks}
//                     onChange={(e) =>
//                       setNewDefect({ ...newDefect, remarks: e.target.value })
//                     }
//                     className="w-full p-1 border rounded"
//                   />
//                 </td>
//                 <td>
//                   <div className="flex justify-center gap-2">
//                     <button onClick={handleSaveNew}>
//                       <Save size={18} className="text-green-600" />
//                     </button>
//                     <button onClick={handleCancelAddNew}>
//                       <X size={18} className="text-gray-500" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             )}

//             {filteredDefects.map((defect) => {
//               const isEditing = editingId === defect._id;
//               return (
//                 <tr key={defect._id}>
//                   <td className="px-4 py-3 text-center font-semibold">
//                     {defect.MainCategoryCode}
//                   </td>
//                   <td className="px-4 py-3">
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={editData.code}
//                         onChange={(e) =>
//                           handleEditDataChange("code", e.target.value)
//                         }
//                         className="w-24 p-1 border rounded"
//                       />
//                     ) : (
//                       defect.code
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     {isEditing ? (
//                       <div className="space-y-1">
//                         <input
//                           type="text"
//                           value={editData.english}
//                           onChange={(e) =>
//                             handleEditDataChange("english", e.target.value)
//                           }
//                           className="w-full p-1 border rounded"
//                         />
//                         <input
//                           type="text"
//                           value={editData.khmer}
//                           onChange={(e) =>
//                             handleEditDataChange("khmer", e.target.value)
//                           }
//                           className="w-full p-1 border rounded"
//                         />
//                         <input
//                           type="text"
//                           value={editData.chinese}
//                           onChange={(e) =>
//                             handleEditDataChange("chinese", e.target.value)
//                           }
//                           className="w-full p-1 border rounded"
//                         />
//                       </div>
//                     ) : (
//                       <div>
//                         <div className="font-semibold">{defect.english}</div>
//                         <div className="text-xs text-gray-500">
//                           {defect.khmer}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {defect.chinese}
//                         </div>
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={editData.defectLetter}
//                         onChange={(e) =>
//                           handleEditDataChange("defectLetter", e.target.value)
//                         }
//                         className="w-20 p-1 border rounded"
//                       />
//                     ) : (
//                       defect.defectLetter
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     {isEditing ? (
//                       <select
//                         value={editData.CategoryCode}
//                         onChange={handleEditCategoryChange}
//                         className="w-full p-1 border rounded"
//                       >
//                         {categories.map((c) => (
//                           <option key={c._id} value={c.CategoryCode}>
//                             {c.CategoryNameEng}
//                           </option>
//                         ))}
//                       </select>
//                     ) : (
//                       <div>
//                         <div className="font-semibold">
//                           {defect.CategoryNameEng} ({defect.CategoryCode})
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {defect.CategoryNameKhmer}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {defect.CategoryNameChinese}
//                         </div>
//                       </div>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-center">
//                     {isEditing ? (
//                       <select
//                         value={editData.isCommon}
//                         onChange={(e) =>
//                           handleEditDataChange("isCommon", e.target.value)
//                         }
//                         className="p-1 border rounded"
//                       >
//                         <option value="Yes">Yes</option>
//                         <option value="No">No</option>
//                       </select>
//                     ) : (
//                       <span
//                         className={`px-2 py-1 text-xs rounded-full ${
//                           defect.isCommon === "Yes"
//                             ? "bg-green-100 text-green-800"
//                             : "bg-red-100 text-red-800"
//                         }`}
//                       >
//                         {defect.isCommon}
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-center">
//                     {isEditing ? (
//                       <button
//                         onClick={() => openRemarksModal(editData)}
//                         className="text-indigo-600 hover:underline text-sm"
//                       >
//                         Edit Remarks
//                       </button>
//                     ) : (
//                       <p
//                         className="text-xs text-gray-600 max-w-xs truncate"
//                         title={defect.remarks}
//                       >
//                         {defect.remarks || "-"}
//                       </p>
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex justify-center gap-2">
//                       {isEditing ? (
//                         <>
//                           <button
//                             onClick={() => handleSaveEdit(defect._id)}
//                             title="Save"
//                           >
//                             <Save size={18} className="text-green-600" />
//                           </button>
//                           <button onClick={handleCancelEdit} title="Cancel">
//                             <X size={18} className="text-gray-500" />
//                           </button>
//                         </>
//                       ) : (
//                         <>
//                           <button
//                             onClick={() => handleEdit(defect)}
//                             title="Edit"
//                           >
//                             <Edit2 size={18} className="text-blue-600" />
//                           </button>
//                           <button
//                             onClick={() =>
//                               handleDelete(defect._id, defect.english)
//                             }
//                             title="Delete"
//                           >
//                             <Trash2 size={18} className="text-red-600" />
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default YPivotQASectionsProductDefectManagement;

import axios from "axios";
import {
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  FileText,
  Grid3x3,
  Tag,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Layers,
  Hash,
  Filter as FilterIcon,
  Loader2,
  Globe,
  Type
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// ============================================
// 🎨 ADD DEFECT MODAL COMPONENT
// ============================================
const AddDefectModal = ({
  isOpen,
  onClose,
  categories,
  onSave,
  existingDefects
}) => {
  const [formData, setFormData] = useState({
    CategoryCode: "",
    code: "",
    english: "",
    khmer: "",
    chinese: "",
    defectLetter: "",
    remarks: "",
    isCommon: "Yes"
  });

  const [autoGeneratedCode, setAutoGeneratedCode] = useState("");

  useEffect(() => {
    if (formData.CategoryCode) {
      const selectedCategory = categories.find(
        (c) => c.CategoryCode === formData.CategoryCode
      );
      if (selectedCategory) {
        const mainCatCode = selectedCategory.no;

        // Find all defects with the same MainCategoryCode
        const sameMainCatDefects = existingDefects.filter(
          (d) => d.MainCategoryCode === mainCatCode
        );

        // Extract the number after the dot and find max
        let maxSubCode = 0;
        sameMainCatDefects.forEach((defect) => {
          const parts = defect.code.split(".");
          if (parts.length === 2) {
            const subCode = parseInt(parts[1], 10);
            if (!isNaN(subCode) && subCode > maxSubCode) {
              maxSubCode = subCode;
            }
          }
        });

        const newCode = `${mainCatCode}.${maxSubCode + 1}`;
        setAutoGeneratedCode(newCode);
        setFormData((prev) => ({ ...prev, code: newCode }));
      }
    }
  }, [formData.CategoryCode, categories, existingDefects]);

  const handleCategoryChange = (e) => {
    setFormData({ ...formData, CategoryCode: e.target.value });
  };

  const handleSubmit = async () => {
    const { code, english, defectLetter, CategoryCode, isCommon } = formData;

    if (!CategoryCode || !code || !english.trim() || !defectLetter.trim()) {
      Swal.fire(
        "Validation Error",
        "Category, Defect Code, English Name, and Letter are required.",
        "warning"
      );
      return;
    }

    const selectedCategory = categories.find(
      (c) => c.CategoryCode === CategoryCode
    );

    const payload = {
      ...formData,
      CategoryNameEng: selectedCategory.CategoryNameEng,
      CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
      CategoryNameChinese: selectedCategory.CategoryNameChinese
    };

    onSave(payload);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      CategoryCode: "",
      code: "",
      english: "",
      khmer: "",
      chinese: "",
      defectLetter: "",
      remarks: "",
      isCommon: "Yes"
    });
    setAutoGeneratedCode("");
    onClose();
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(
    (c) => c.CategoryCode === formData.CategoryCode
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <Plus size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New Defect</h3>
                <p className="text-indigo-100 text-sm">
                  Create a new defect entry in the system
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Category Selection */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
            <label className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-2">
              <Layers
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
              Step 1: Select Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.CategoryCode}
              onChange={handleCategoryChange}
              className="w-full px-4 py-3 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none font-medium"
            >
              <option value="">-- Select a Category First --</option>
              {categories.map((c) => (
                <option key={c._id} value={c.CategoryCode}>
                  [{c.no}] {c.CategoryNameEng} ({c.CategoryCode})
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="mt-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Main Category Code:</strong>{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {selectedCategory.no}
                    </span>
                  </p>
                  <p>
                    <strong>Auto-Generated Defect Code:</strong>{" "}
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {autoGeneratedCode}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Code & Letter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Hash size={14} className="text-blue-500" />
                Defect Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono font-bold cursor-not-allowed"
                placeholder="Auto-generated"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Type size={14} className="text-purple-500" />
                Defect Letter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.defectLetter}
                onChange={(e) =>
                  setFormData({ ...formData, defectLetter: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                placeholder="e.g., A, B, C"
              />
            </div>
          </div>

          {/* Defect Names */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Globe size={14} className="text-green-500" />
              Defect Names (Multi-language)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.english}
                onChange={(e) =>
                  setFormData({ ...formData, english: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 outline-none"
                placeholder="English Name *"
              />
              <input
                type="text"
                value={formData.khmer}
                onChange={(e) =>
                  setFormData({ ...formData, khmer: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 outline-none"
                placeholder="Khmer Name (Optional)"
              />
              <input
                type="text"
                value={formData.chinese}
                onChange={(e) =>
                  setFormData({ ...formData, chinese: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 outline-none"
                placeholder="Chinese Name (Optional)"
              />
            </div>
          </div>

          {/* Is Common */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-orange-500" />
              Is Common Defect? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.isCommon}
              onChange={(e) =>
                setFormData({ ...formData, isCommon: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 outline-none"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-blue-500" />
              Remarks / Additional Notes
            </label>
            <div className="relative">
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                maxLength={250}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none resize-none h-24"
                placeholder="Additional information about this defect..."
              />
              <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                {formData.remarks.length}/250
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 flex items-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Save size={18} />
              Create Defect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 🎨 REMARKS MODAL COMPONENT
// ============================================
const RemarksModal = ({ isOpen, onClose, remarks, onSave }) => {
  const [text, setText] = useState(remarks);
  const MAX_CHARS = 250;

  useEffect(() => {
    if (isOpen) setText(remarks);
  }, [isOpen, remarks]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <MessageSquare size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Edit Remarks</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_CHARS}
              className="w-full h-32 px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none resize-none"
              placeholder="Enter remarks..."
            />
            <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
              {text.length}/{MAX_CHARS}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
            >
              Save Remarks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 🎯 MAIN COMPONENT
// ============================================
const YPivotQASectionsProductDefectManagement = () => {
  const [defects, setDefects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [currentRemarks, setCurrentRemarks] = useState("");
  const [remarksSaveCallback, setRemarksSaveCallback] = useState(null);

  const [editData, setEditData] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    code: "",
    english: "",
    MainCategoryCode: "",
    CategoryNameEng: "",
    isCommon: ""
  });

  useEffect(() => {
    fetchDefects();
    fetchCategories();
  }, []);

  const fetchDefects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-defect-list`
      );
      if (response.data.success) {
        const sortedData = response.data.data.sort((a, b) => {
          const partsA = a.code.split(".").map(Number);
          const partsB = b.code.split(".").map(Number);
          if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
          return (partsA[1] || 0) - (partsB[1] || 0);
        });
        setDefects(sortedData);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to load defects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-defect-category`
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filteredDefects = useMemo(() => {
    return defects.filter((defect) => {
      return (
        (filters.code
          ? defect.code.toLowerCase().includes(filters.code.toLowerCase())
          : true) &&
        (filters.english
          ? defect.english.toLowerCase().includes(filters.english.toLowerCase())
          : true) &&
        (filters.MainCategoryCode
          ? defect.MainCategoryCode.toString() === filters.MainCategoryCode
          : true) &&
        (filters.CategoryNameEng
          ? defect.CategoryNameEng === filters.CategoryNameEng
          : true) &&
        (filters.isCommon ? defect.isCommon === filters.isCommon : true)
      );
    });
  }, [defects, filters]);

  // === ADD NEW DEFECT ===
  const handleSaveNewDefect = async (payload) => {
    try {
      await axios.post(`${API_BASE_URL}/api/qa-sections-defect-list`, payload);
      Swal.fire("Created!", "New defect has been created.", "success");
      fetchDefects();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create defect",
        "error"
      );
    }
  };

  // === EDIT DEFECT ===
  const handleEdit = (defect) => {
    setEditingId(defect._id);
    setEditData({ ...defect });
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleEditDataChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditCategoryChange = (e) => {
    const newCategoryCode = e.target.value;
    const selectedCategory = categories.find(
      (c) => c.CategoryCode === newCategoryCode
    );
    if (selectedCategory) {
      setEditData((prev) => ({
        ...prev,
        CategoryCode: newCategoryCode,
        CategoryNameEng: selectedCategory.CategoryNameEng,
        CategoryNameKhmer: selectedCategory.CategoryNameKhmer,
        CategoryNameChinese: selectedCategory.CategoryNameChinese
      }));
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-list/${id}`,
        editData
      );
      Swal.fire("Updated!", "Defect has been updated.", "success");
      fetchDefects();
      handleCancelEdit();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update defect",
        "error"
      );
    }
  };

  // === DELETE DEFECT ===
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-defect-list/${id}`);
        Swal.fire("Deleted!", "Defect has been deleted.", "success");
        fetchDefects();
      } catch (error) {
        Swal.fire("Error", "Failed to delete defect", "error");
      }
    }
  };

  // === REMARKS MODAL ===
  const openRemarksModal = (defect) => {
    setCurrentRemarks(defect.remarks || "");
    setRemarksSaveCallback(() => (newRemarks) => {
      handleEditDataChange("remarks", newRemarks);
    });
    setIsRemarksModalOpen(true);
  };

  const clearAllFilters = () => {
    setFilters({
      code: "",
      english: "",
      MainCategoryCode: "",
      CategoryNameEng: "",
      isCommon: ""
    });
  };

  const hasActiveFilters =
    filters.code ||
    filters.english ||
    filters.MainCategoryCode ||
    filters.CategoryNameEng ||
    filters.isCommon;

  const uniqueMainCategories = [...new Set(categories.map((c) => c.no))].sort(
    (a, b) => a - b
  );
  const uniqueCategoryNames = [
    ...new Set(categories.map((c) => c.CategoryNameEng))
  ].sort();

  return (
    <div className="space-y-4">
      {/* Modals */}
      <AddDefectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSave={handleSaveNewDefect}
        existingDefects={defects}
      />
      <RemarksModal
        isOpen={isRemarksModalOpen}
        onClose={() => setIsRemarksModalOpen(false)}
        remarks={currentRemarks}
        onSave={remarksSaveCallback}
      />

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Product Defect Management
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {defects.length}
                    </span>{" "}
                    Total Defects
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {filteredDefects.length}
                    </span>{" "}
                    Filtered
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {categories.length}
                    </span>{" "}
                    Categories
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Add New Defect
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-md">
              <FilterIcon size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Filter Defects
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Narrow down defects by various criteria
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors text-sm"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Hash size={14} className="text-indigo-500" />
              Defect Code
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters.code}
                onChange={(e) =>
                  setFilters({ ...filters, code: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
                placeholder="e.g., 1.10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FileText size={14} className="text-purple-500" />
              Defect Name
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters.english}
                onChange={(e) =>
                  setFilters({ ...filters, english: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                placeholder="English name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Grid3x3 size={14} className="text-blue-500" />
              Main Category
            </label>
            <select
              value={filters.MainCategoryCode}
              onChange={(e) =>
                setFilters({ ...filters, MainCategoryCode: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none"
            >
              <option value="">All</option>
              {uniqueMainCategories.map((mc) => (
                <option key={mc} value={mc}>
                  {mc}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Tag size={14} className="text-green-500" />
              Category Name
            </label>
            <select
              value={filters.CategoryNameEng}
              onChange={(e) =>
                setFilters({ ...filters, CategoryNameEng: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 outline-none"
            >
              <option value="">All</option>
              {uniqueCategoryNames.map((cn) => (
                <option key={cn} value={cn}>
                  {cn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-orange-500" />
              Is Common
            </label>
            <select
              value={filters.isCommon}
              onChange={(e) =>
                setFilters({ ...filters, isCommon: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 outline-none"
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <Grid3x3 size={14} className="text-indigo-500" />
                      Main Cat.
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <Hash size={14} className="text-purple-500" />
                      Code
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <FileText size={14} className="text-blue-500" />
                      Defect Name
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <Type size={14} className="text-green-500" />
                      Letter
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <Tag size={14} className="text-orange-500" />
                      Category
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} className="text-teal-500" />
                      Common
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare size={14} className="text-cyan-500" />
                      Remarks
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center p-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Loading defects...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDefects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                          <Search
                            size={28}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          No defects found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((defect) => {
                    const isEditing = editingId === defect._id;
                    return (
                      <tr
                        key={defect._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-lg shadow-sm">
                            {defect.MainCategoryCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.code}
                              onChange={(e) =>
                                handleEditDataChange("code", e.target.value)
                              }
                              className="w-24 px-2 py-1.5 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                              {defect.code}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={editData.english}
                                onChange={(e) =>
                                  handleEditDataChange(
                                    "english",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                                placeholder="English"
                              />
                              <input
                                type="text"
                                value={editData.khmer}
                                onChange={(e) =>
                                  handleEditDataChange("khmer", e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-sm border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                                placeholder="Khmer"
                              />
                              <input
                                type="text"
                                value={editData.chinese}
                                onChange={(e) =>
                                  handleEditDataChange(
                                    "chinese",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                                placeholder="Chinese"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {defect.english}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {defect.khmer}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {defect.chinese}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.defectLetter}
                              onChange={(e) =>
                                handleEditDataChange(
                                  "defectLetter",
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1.5 text-sm border-2 border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                              {defect.defectLetter}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editData.CategoryCode}
                              onChange={handleEditCategoryChange}
                              className="w-full px-2 py-1.5 text-sm border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-200 outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c._id} value={c.CategoryCode}>
                                  {c.CategoryNameEng}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {defect.CategoryNameEng}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {defect.CategoryNameKhmer}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {defect.CategoryNameChinese}
                              </div>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-mono rounded text-gray-700 dark:text-gray-300">
                                {defect.CategoryCode}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select
                              value={editData.isCommon}
                              onChange={(e) =>
                                handleEditDataChange("isCommon", e.target.value)
                              }
                              className="px-2 py-1.5 text-sm border-2 border-teal-300 dark:border-teal-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 transition-all duration-200 outline-none"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                                defect.isCommon === "Yes"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              }`}
                            >
                              {defect.isCommon}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <button
                              onClick={() => openRemarksModal(editData)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            >
                              Edit Remarks
                            </button>
                          ) : (
                            <p
                              className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate"
                              title={defect.remarks}
                            >
                              {defect.remarks || (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                  No remarks
                                </span>
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(defect._id)}
                                  title="Save"
                                  className="p-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  title="Cancel"
                                  className="p-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(defect)}
                                  title="Edit"
                                  className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(defect._id, defect.english)
                                  }
                                  title="Delete"
                                  className="p-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {!isLoading && filteredDefects.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {filteredDefects.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {defects.length}
                </span>{" "}
                defects
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsProductDefectManagement;
