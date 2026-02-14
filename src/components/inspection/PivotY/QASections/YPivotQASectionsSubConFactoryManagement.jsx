import axios from "axios";
import {
  Edit,
  Factory,
  ListChecks,
  Plus,
  PlusCircle,
  Save,
  Trash2,
  X,
  XCircle,
  Users,
  Building2,
  Search
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// --- SUB-COMPONENT: Add Factory Form ---
const AddFactoryForm = ({ maxNo, onSave, onCancel }) => {
  const initialData = {
    no: maxNo + 1,
    factory: "",
    factory_second_name: "",
    lineList: []
  };
  const [data, setData] = useState(initialData);

  const handleInputChange = (e) =>
    setData({ ...data, [e.target.name]: e.target.value });

  const handleLinesChange = (e) => {
    const numLines = Math.max(0, parseInt(e.target.value, 10) || 0);
    const newLineList = Array.from(
      { length: numLines },
      (_, i) => (data.lineList || [])[i] || ""
    );
    setData({ ...data, lineList: newLineList });
  };

  const handleLineValueChange = (index, value) => {
    const newLineList = [...(data.lineList || [])];
    newLineList[index] = value;
    setData({ ...data, lineList: newLineList });
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-700 mb-6">
      <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">
        Add New Sub-Con Factory
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Factory Name
          </label>
          <input
            name="factory"
            value={data.factory}
            onChange={handleInputChange}
            className="w-full p-2 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Factory A"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Factory Second Name
          </label>
          <input
            name="factory_second_name"
            value={data.factory_second_name}
            onChange={handleInputChange}
            className="w-full p-2 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No of Lines
          </label>
          <input
            type="number"
            value={(data.lineList || []).length}
            onChange={handleLinesChange}
            className="w-full p-2 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            min="0"
          />
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Line Nos
        </label>
        <div className="flex flex-wrap gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 min-h-[50px]">
          {(data.lineList || []).map((line, index) => (
            <input
              key={index}
              value={line}
              onChange={(e) => handleLineValueChange(index, e.target.value)}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded w-20 text-center text-sm"
              placeholder={`L${index + 1}`}
            />
          ))}
          {data.lineList.length === 0 && (
            <span className="text-gray-400 text-sm">No lines added yet.</span>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <X size={16} /> Cancel
        </button>
        <button
          onClick={() => onSave(data)}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Save size={16} /> Save Factory
        </button>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Edit Factory Row ---
const EditFactoryRow = ({ factoryData, onSave, onCancel }) => {
  const [data, setData] = useState(factoryData);
  const lineInputRefs = useRef([]);

  const handleInputChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleLineValueChange = (index, value) => {
    const newLineList = [...(data.lineList || [])];
    newLineList[index] = value;
    setData({ ...data, lineList: newLineList });
  };

  const addLine = () =>
    setData({ ...data, lineList: [...(data.lineList || []), ""] });

  const removeLine = (index) =>
    setData({
      ...data,
      lineList: (data.lineList || []).filter((_, i) => i !== index)
    });

  return (
    <tr className="bg-indigo-50 dark:bg-indigo-900/20">
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 font-mono text-sm">
        {data.no}
      </td>
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <input
          name="factory"
          value={data.factory}
          onChange={handleInputChange}
          className="w-full p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </td>
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <input
          name="factory_second_name"
          value={data.factory_second_name}
          onChange={handleInputChange}
          className="w-full p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </td>
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center font-bold text-indigo-600">
        {(data.lineList || []).length}
      </td>
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          {(data.lineList || []).map((line, index) => (
            <div key={index} className="relative group">
              <input
                ref={(el) => (lineInputRefs.current[index] = el)}
                value={line}
                onChange={(e) => handleLineValueChange(index, e.target.value)}
                className="p-1 border rounded w-16 text-center text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => removeLine(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-3 w-3 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                X
              </button>
            </div>
          ))}
          <button
            onClick={addLine}
            className="bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center hover:bg-green-600"
          >
            <Plus size={12} />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onSave(data)}
            className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <XCircle size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- MAIN COMPONENT ---
const YPivotQASectionsSubConFactoryManagement = () => {
  // State for Factories
  const [factories, setFactories] = useState([]);
  const [isFactoryLoading, setIsFactoryLoading] = useState(true);
  const [isAddingFactory, setIsAddingFactory] = useState(false);
  const [editingFactoryId, setEditingFactoryId] = useState(null);
  const [factoryFilter, setFactoryFilter] = useState(null); // { value: id, label: name }

  // State for QCs
  const [allQcs, setAllQcs] = useState([]);
  const [isQcLoading, setIsQcLoading] = useState(true);

  // QC Form State
  const [selectedFactoryForQc, setSelectedFactoryForQc] = useState(null);
  const [qcIdInput, setQcIdInput] = useState("");
  const [qcNameInput, setQcNameInput] = useState("");
  const [isEditQcModalOpen, setIsEditQcModalOpen] = useState(false);
  const [editingQc, setEditingQc] = useState(null);
  const [qcFilterFactory, setQcFilterFactory] = useState(null);
  const [qcFilterId, setQcFilterId] = useState("");

  // Styles for React Select
  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "#e5e7eb",
      borderRadius: "0.5rem",
      padding: "2px"
    }),
    singleValue: (base) => ({ ...base, color: "#374151" }),
    input: (base) => ({ ...base, color: "#374151" }),
    menu: (base) => ({ ...base, zIndex: 50 })
  };

  // --- Initial Data Fetch ---
  const fetchFactories = useCallback(async () => {
    setIsFactoryLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage`
      );
      setFactories(res.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
      Swal.fire("Error", "Could not fetch factory data.", "error");
    } finally {
      setIsFactoryLoading(false);
    }
  }, []);

  const fetchQcs = useCallback(async () => {
    setIsQcLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/all`
      );
      setAllQcs(res.data);
    } catch (error) {
      console.error("Error fetching QCs:", error);
    } finally {
      setIsQcLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactories();
    fetchQcs();
  }, [fetchFactories, fetchQcs]);

  // --- Handlers: Factories ---
  const filteredFactories = useMemo(() => {
    if (!factoryFilter) return factories;
    return factories.filter((f) => f._id === factoryFilter.value);
  }, [factories, factoryFilter]);

  const handleSaveFactory = async (factoryData) => {
    if (
      !factoryData.factory ||
      (factoryData.lineList || []).some((line) => !line.trim())
    ) {
      Swal.fire(
        "Validation Error",
        "Factory name and all Line Nos are required.",
        "warning"
      );
      return;
    }

    try {
      if (factoryData._id) {
        await axios.put(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage/${factoryData._id}`,
          factoryData
        );
        Swal.fire("Success", "Factory updated successfully!", "success");
        setEditingFactoryId(null);
      } else {
        await axios.post(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage`,
          factoryData
        );
        Swal.fire("Success", "Factory added successfully!", "success");
        setIsAddingFactory(false);
      }
      fetchFactories();
      // Also refetch QCs as factory list might change
      fetchQcs();
    } catch (error) {
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "Error occurred.",
        "error"
      );
    }
  };

  const handleDeleteFactory = async (factoryId, factoryName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${factoryName}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/subcon-sewing-factories-manage/${factoryId}`
        );
        Swal.fire("Deleted!", "Factory deleted.", "success");
        fetchFactories();
        fetchQcs();
      } catch (error) {
        Swal.fire("Error", "Failed to delete factory.", "error");
      }
    }
  };

  // --- Handlers: QCs ---
  const filteredQcs = useMemo(() => {
    return allQcs.filter((qc) => {
      const factoryMatch =
        !qcFilterFactory || qc.factoryName === qcFilterFactory.label;
      const qcIdMatch =
        !qcFilterId || qc.qcID.toLowerCase().includes(qcFilterId.toLowerCase());
      return factoryMatch && qcIdMatch;
    });
  }, [allQcs, qcFilterFactory, qcFilterId]);

  const handleSaveQc = async (e) => {
    e.preventDefault();
    if (!selectedFactoryForQc || !qcIdInput || !qcNameInput) {
      Swal.fire("Incomplete", "Please fill all fields.", "warning");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage/${selectedFactoryForQc.value}/qcs`,
        { qcID: qcIdInput, qcName: qcNameInput }
      );
      Swal.fire("Success", "New QC added!", "success");
      setSelectedFactoryForQc(null);
      setQcIdInput("");
      setQcNameInput("");
      fetchQcs();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to add QC.",
        "error"
      );
    }
  };

  const handleUpdateQc = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/${editingQc.qcMongoId}`,
        { qcID: editingQc.qcID, qcName: editingQc.qcName }
      );
      Swal.fire("Success", "QC updated successfully!", "success");
      setIsEditQcModalOpen(false);
      setEditingQc(null);
      fetchQcs();
    } catch (error) {
      Swal.fire("Error", "Failed to update QC.", "error");
    }
  };

  const handleDeleteQc = (qc) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete QC ${qc.qcName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/subcon-sewing-factories-manage/qcs/${qc.qcMongoId}`
          );
          Swal.fire("Deleted!", "QC deleted.", "success");
          fetchQcs();
        } catch (error) {
          Swal.fire("Error", "Failed to delete QC.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ================= SECTION 1: FACTORY MANAGEMENT ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Factory size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manage Factories</h2>
              <p className="text-blue-100 text-xs">
                {factories.length} Factories Configured
              </p>
            </div>
          </div>
          {!isAddingFactory && (
            <button
              onClick={() => setIsAddingFactory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-all"
            >
              <PlusCircle size={18} /> Add Factory
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Add Form */}
          {isAddingFactory && (
            <AddFactoryForm
              maxNo={Math.max(0, ...factories.map((f) => f.no))}
              onSave={handleSaveFactory}
              onCancel={() => setIsAddingFactory(false)}
            />
          )}

          {/* Filter */}
          <div className="mb-6 max-w-sm">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
              Filter Factories
            </label>
            <Select
              options={factories.map((f) => ({
                value: f._id,
                label: f.factory
              }))}
              value={factoryFilter}
              onChange={setFactoryFilter}
              isClearable
              placeholder="Search by name..."
              styles={reactSelectStyles}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Factory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Second Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Lines Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Line List
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-32">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isFactoryLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Loading factories...
                    </td>
                  </tr>
                ) : filteredFactories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No factories found.
                    </td>
                  </tr>
                ) : (
                  filteredFactories.map((factory) =>
                    editingFactoryId === factory._id ? (
                      <EditFactoryRow
                        key={factory._id}
                        factoryData={factory}
                        onSave={handleSaveFactory}
                        onCancel={() => setEditingFactoryId(null)}
                      />
                    ) : (
                      <tr
                        key={factory._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">
                          {factory.no}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">
                          {factory.factory}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {factory.factory_second_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                            {(factory.lineList || []).length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(factory.lineList || []).map((line, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-300"
                              >
                                {line}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setEditingFactoryId(factory._id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteFactory(
                                  factory._id,
                                  factory.factory
                                )
                              }
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: QC MANAGEMENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add QC Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle size={20} /> Add New QC
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Factory
                </label>
                <Select
                  options={factories.map((f) => ({
                    value: f._id,
                    label: f.factory
                  }))}
                  value={selectedFactoryForQc}
                  onChange={setSelectedFactoryForQc}
                  styles={reactSelectStyles}
                  placeholder="Choose..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  QC ID
                </label>
                <input
                  type="text"
                  value={qcIdInput}
                  onChange={(e) => setQcIdInput(e.target.value)}
                  className="w-full p-2 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-lg bg-emerald-50/30 dark:bg-gray-700 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="e.g. QC001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  QC Name
                </label>
                <input
                  type="text"
                  value={qcNameInput}
                  onChange={(e) => setQcNameInput(e.target.value)}
                  className="w-full p-2 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-lg bg-emerald-50/30 dark:bg-gray-700 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="Name..."
                />
              </div>
              <button
                onClick={handleSaveQc}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all mt-2 flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save QC
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Manage QC List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ListChecks size={20} className="text-emerald-600" /> QC List
              </h2>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">
                {filteredQcs.length} QCs
              </span>
            </div>

            {/* Filters */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: f.factory
                }))}
                value={qcFilterFactory}
                onChange={setQcFilterFactory}
                styles={reactSelectStyles}
                placeholder="Filter by Factory..."
                isClearable
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={qcFilterId}
                  onChange={(e) => setQcFilterId(e.target.value)}
                  className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Search by QC ID..."
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      Factory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      QC ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isQcLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        Loading QCs...
                      </td>
                    </tr>
                  ) : filteredQcs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-8 text-gray-500"
                      >
                        No QCs found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQcs.map((qc) => (
                      <tr
                        key={qc.qcMongoId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                          {qc.factoryName}
                        </td>
                        <td className="px-6 py-3 text-sm font-mono text-emerald-600 dark:text-emerald-400">
                          {qc.qcID}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {qc.qcName}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingQc(qc);
                              setIsEditQcModalOpen(true);
                            }}
                            className="text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteQc(qc)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* QC Edit Modal */}
      {isEditQcModalOpen && editingQc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Edit className="text-indigo-500" /> Edit QC Details
            </h3>
            <form onSubmit={handleUpdateQc} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  QC ID
                </label>
                <input
                  type="text"
                  value={editingQc.qcID}
                  onChange={(e) =>
                    setEditingQc({ ...editingQc, qcID: e.target.value })
                  }
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  QC Name
                </label>
                <input
                  type="text"
                  value={editingQc.qcName}
                  onChange={(e) =>
                    setEditingQc({ ...editingQc, qcName: e.target.value })
                  }
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditQcModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md transition-transform active:scale-95"
                >
                  Update QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQASectionsSubConFactoryManagement;
