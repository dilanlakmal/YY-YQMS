import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  MapPin,
  Loader,
  Search,
  Check,
  AlertCircle,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare,
  Camera,
  Upload,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  User,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

const YPivotQATemplatesDefectLocationSelection = ({
  forcedProductTypeId = null,
  forcedStyle = null,
  onSelectionChange = null,
  initialSelections = [],
  availableStatuses = ["Minor", "Major", "Critical"],
  defaultStatus = "Major",
  availableQCs = [],
  defaultQC = null,
}) => {
  // --- State ---
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // View State: 'Front' or 'Back'
  const [activeView, setActiveView] = useState("Front");

  // Selected Locations State
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Image Editor State
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorMode, setImageEditorMode] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingPcsNo, setEditingPcsNo] = useState(null);
  const [isAdditionalImage, setIsAdditionalImage] = useState(false);

  // Expanded cards state
  const [expandedCards, setExpandedCards] = useState({});
  // Expanded "More" section for each piece
  const [expandedMoreSections, setExpandedMoreSections] = useState({});

  // Comment Modal State
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [editingComment, setEditingComment] = useState({
    locationId: null,
    pcsNo: null,
    comment: "",
  });

  const hasInitializedRef = useRef(false);

  // --- Initialization ---
  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Handle Forced Product Type
  useEffect(() => {
    if (!forcedProductTypeId) return;

    if (forcedStyle) {
      // Use style-specific API (falls back to Common on backend if no style match)
      fetchStyleSpecificConfig(forcedStyle, forcedProductTypeId);
    } else if (configurations.length > 0) {
      // No style provided — fall back to Common config from loaded list
      const match = configurations.find(
        (c) =>
          c.productTypeId._id === forcedProductTypeId ||
          c.productTypeId === forcedProductTypeId,
      );
      if (match) {
        setSelectedConfigId(match._id);
        setCurrentConfig(match);
      }
    }
  }, [forcedProductTypeId, forcedStyle, configurations]);

  // Handle Initial Selections
  useEffect(() => {
    if (!hasInitializedRef.current) {
      if (initialSelections && initialSelections.length > 0) {
        const transformedSelections = initialSelections.map((sel) => ({
          ...sel,
          qty: sel.qty || 1,
          positions: sel.positions || [
            {
              pcsNo: 1,
              position: sel.position || "Outside",
              comment: "",
              status: sel.status || defaultStatus,
              qcUser: sel.qcUser || defaultQC,
              additionalRemark: "",
              additionalImages: [],
            },
          ],
          images: sel.images || [],
        }));
        setSelectedLocations(transformedSelections);
      }
      hasInitializedRef.current = true;
    }
  }, []);

  // Notify Parent on Change
  useEffect(() => {
    if (hasInitializedRef.current && onSelectionChange) {
      onSelectionChange(selectedLocations);
    }
  }, [selectedLocations]);

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location`,
      );
      if (response.data.success) {
        setConfigurations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStyleSpecificConfig = async (style, productTypeId) => {
    setLoadingConfig(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location/style/${style}/type/${productTypeId}`,
      );
      if (response.data.success) {
        setCurrentConfig(response.data.data);
        setSelectedConfigId(response.data.data._id);
      }
    } catch (error) {
      console.error("Error fetching style-specific config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // --- Handlers ---

  const handleConfigChange = async (e) => {
    const configId = e.target.value;
    setSelectedConfigId(configId);
    setSelectedLocations([]);
    setActiveView("Front");

    if (!configId) {
      setCurrentConfig(null);
      return;
    }

    setLoadingConfig(true);
    try {
      const config = configurations.find((c) => c._id === configId);
      setCurrentConfig(config);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleLocationSelection = (location, viewType) => {
    const uniqueId = `${viewType}_${location._id || location.tempId}`;
    const exists = selectedLocations.find((item) => item.uniqueId === uniqueId);

    if (exists) {
      setSelectedLocations((prev) =>
        prev.filter((item) => item.uniqueId !== uniqueId),
      );
    } else {
      setSelectedLocations((prev) => [
        ...prev,
        {
          uniqueId,
          locationId: location._id || location.tempId,
          locationNo: location.LocationNo,
          locationName: location.LocationName,
          view: viewType,
          qty: 1,
          positions: [
            {
              pcsNo: 1,
              position: "Outside",
              comment: "",
              status: defaultStatus,
              qcUser: defaultQC,
              requiredImage: null, // <-- ADD THIS (single required image per piece)
              additionalRemark: "",
              additionalImages: [],
            },
          ],
          // Remove 'images: []' - no longer needed at location level
        },
      ]);
      setExpandedCards((prev) => ({ ...prev, [uniqueId]: true }));
    }
  };

  // Update Qty for a location
  const updateLocationQty = (uniqueId, newQty) => {
    const qty = Math.max(1, Math.min(99, newQty));
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          let newPositions = [...(item.positions || [])];

          if (qty > newPositions.length) {
            for (let i = newPositions.length; i < qty; i++) {
              newPositions.push({
                pcsNo: i + 1,
                position: "Outside",
                comment: "",
                status: defaultStatus,
                qcUser: defaultQC,
                requiredImage: null, // <-- ADD THIS
                additionalRemark: "",
                additionalImages: [],
              });
            }
          } else if (qty < newPositions.length) {
            newPositions = newPositions.slice(0, qty);
          }

          return { ...item, qty, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Update position for a specific piece
  const updatePiecePosition = (uniqueId, pcsNo, newPosition) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === pcsNo ? { ...pos, position: newPosition } : pos,
          );
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Update status for a specific piece
  const updatePieceStatus = (uniqueId, pcsNo, newStatus) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === pcsNo ? { ...pos, status: newStatus } : pos,
          );
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Update QC for a specific piece
  const updatePieceQC = (uniqueId, pcsNo, qcUser) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === pcsNo ? { ...pos, qcUser } : pos,
          );
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Update additional remark for a specific piece
  const updatePieceAdditionalRemark = (uniqueId, pcsNo, remark) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === pcsNo ? { ...pos, additionalRemark: remark } : pos,
          );
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Toggle More section for a piece
  const toggleMoreSection = (uniqueId, pcsNo) => {
    const key = `${uniqueId}_${pcsNo}`;
    setExpandedMoreSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Open comment modal for a specific piece
  const openCommentModal = (uniqueId, pcsNo) => {
    const location = selectedLocations.find(
      (item) => item.uniqueId === uniqueId,
    );
    const piece = location?.positions?.find((pos) => pos.pcsNo === pcsNo);

    setEditingComment({
      locationId: uniqueId,
      pcsNo: pcsNo,
      comment: piece?.comment || "",
    });
    setShowCommentModal(true);
  };

  // Save comment
  const saveComment = () => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === editingComment.locationId) {
          const newPositions = item.positions.map((pos) =>
            pos.pcsNo === editingComment.pcsNo
              ? { ...pos, comment: editingComment.comment }
              : pos,
          );
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
    setShowCommentModal(false);
    setEditingComment({ locationId: null, pcsNo: null, comment: "" });
  };

  const cancelCommentModal = () => {
    setShowCommentModal(false);
    setEditingComment({ locationId: null, pcsNo: null, comment: "" });
  };

  // Open image editor for additional images (per piece)
  const openAdditionalImageEditor = (uniqueId, pcsNo, mode) => {
    setEditingLocationId(uniqueId);
    setEditingPcsNo(pcsNo);
    setImageEditorMode(mode);
    setIsAdditionalImage(true);
    setShowImageEditor(true);
  };

  // Handle images from editor
  const handleImageEditorSave = (savedImages) => {
    if (!editingLocationId) return;

    if (editingPcsNo !== null) {
      // Saving image for a specific piece
      setSelectedLocations((prev) =>
        prev.map((item) => {
          if (item.uniqueId === editingLocationId) {
            const newPositions = item.positions.map((pos) => {
              if (pos.pcsNo === editingPcsNo) {
                if (isAdditionalImage) {
                  // Save to additional images
                  const existingImages = pos.additionalImages || [];
                  const newImages = savedImages.map((img) => ({
                    id: img.id,
                    imgSrc: img.imgSrc,
                    editedImgSrc: img.editedImgSrc,
                    history: img.history,
                  }));
                  return {
                    ...pos,
                    additionalImages: [...existingImages, ...newImages].slice(
                      0,
                      5,
                    ),
                  };
                } else {
                  // Save to required image (only first image)
                  const newImage = savedImages[0]
                    ? {
                        id: savedImages[0].id,
                        imgSrc: savedImages[0].imgSrc,
                        editedImgSrc: savedImages[0].editedImgSrc,
                        history: savedImages[0].history,
                      }
                    : null;
                  return { ...pos, requiredImage: newImage };
                }
              }
              return pos;
            });
            return { ...item, positions: newPositions };
          }
          return item;
        }),
      );
    }

    setShowImageEditor(false);
    setEditingLocationId(null);
    setEditingPcsNo(null);
    setImageEditorMode(null);
    setIsAdditionalImage(false);
  };

  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setEditingLocationId(null);
    setEditingPcsNo(null);
    setImageEditorMode(null);
    setIsAdditionalImage(false);
  };

  // Remove additional image from piece
  const removeAdditionalImage = (uniqueId, pcsNo, imageId) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) => {
            if (pos.pcsNo === pcsNo) {
              return {
                ...pos,
                additionalImages: (pos.additionalImages || []).filter(
                  (img) => img.id !== imageId,
                ),
              };
            }
            return pos;
          });
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  // Open image editor for required image (per piece)
  const openRequiredImageEditor = (uniqueId, pcsNo, mode) => {
    setEditingLocationId(uniqueId);
    setEditingPcsNo(pcsNo);
    setImageEditorMode(mode);
    setIsAdditionalImage(false); // This is for required image
    setShowImageEditor(true);
  };

  // Remove required image from piece
  const removeRequiredImage = (uniqueId, pcsNo) => {
    setSelectedLocations((prev) =>
      prev.map((item) => {
        if (item.uniqueId === uniqueId) {
          const newPositions = item.positions.map((pos) => {
            if (pos.pcsNo === pcsNo) {
              return { ...pos, requiredImage: null };
            }
            return pos;
          });
          return { ...item, positions: newPositions };
        }
        return item;
      }),
    );
  };

  const removeSelection = (uniqueId) => {
    setSelectedLocations((prev) =>
      prev.filter((item) => item.uniqueId !== uniqueId),
    );
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all selected locations?")) {
      setSelectedLocations([]);
    }
  };

  const toggleCardExpand = (uniqueId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [uniqueId]: !prev[uniqueId],
    }));
  };

  // Calculate if images are missing
  const getImageWarning = (item) => {
    const missingCount = (item.positions || []).filter(
      (pos) => !pos.requiredImage,
    ).length;

    if (missingCount > 0) {
      return `${missingCount} image${missingCount > 1 ? "s" : ""} required`;
    }
    return null;
  };

  // Get status color classes
  const getStatusColorClasses = (status, isSelected) => {
    if (!isSelected)
      return "border-gray-200 bg-white text-gray-500 hover:border-gray-400";

    switch (status) {
      case "Critical":
        return "border-red-500 bg-red-50 text-red-700";
      case "Major":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "Minor":
        return "border-green-500 bg-green-50 text-green-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  // Get status badge classes
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Major":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Minor":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // --- Render Helpers ---

  const renderMarkers = (locations, viewType) => {
    return locations.map((loc) => {
      const uniqueId = `${viewType}_${loc._id || loc.tempId}`;
      const isSelected = selectedLocations.some(
        (item) => item.uniqueId === uniqueId,
      );

      const baseColorClass =
        viewType === "Front" ? "bg-red-500" : "bg-blue-500";
      const selectedClass = isSelected
        ? "ring-4 ring-green-400 scale-125 z-10 shadow-xl"
        : "opacity-80 hover:opacity-100 hover:scale-110";

      return (
        <button
          key={uniqueId}
          onClick={() => toggleLocationSelection(loc, viewType)}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 border-2 border-white ${baseColorClass} ${selectedClass}`}
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          title={loc.LocationName}
        >
          {isSelected && (
            <Check className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 rounded-full text-white p-0.5" />
          )}
          {loc.LocationNo}
        </button>
      );
    });
  };

  const renderImageView = (viewData, viewType) => {
    if (!viewData || !viewData.imagePath) return null;

    const imageUrl = `${PUBLIC_ASSET_URL}/api/qa-sections-product-location/image/${viewData.imagePath
      .split("/")
      .pop()}`;

    return (
      <div className="flex flex-col h-full animate-fadeIn">
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-[400px] overflow-hidden shadow-inner">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={`${viewType} View`}
              className="max-h-[400px] sm:max-h-[500px] w-auto max-w-full object-contain block"
            />
            {renderMarkers(viewData.locations, viewType)}
          </div>
        </div>
      </div>
    );
  };

  // Render Piece Card
  const renderPieceCard = (item, pos) => {
    const hasComment = pos.comment && pos.comment.trim() !== "";
    const moreKey = `${item.uniqueId}_${pos.pcsNo}`;
    const isMoreExpanded = expandedMoreSections[moreKey];
    const hasAdditionalData =
      (pos.additionalImages && pos.additionalImages.length > 0) ||
      (pos.additionalRemark && pos.additionalRemark.trim() !== "");

    return (
      <div
        key={pos.pcsNo}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Piece Header */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Pcs #{pos.pcsNo}
            </span>

            {/* Status Badge */}
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(
                pos.status,
              )}`}
            >
              {pos.status}
            </span>
          </div>
        </div>

        {/* Piece Content */}
        <div className="p-2 space-y-2">
          {/* Status Selection */}
          <div className="flex gap-1 flex-wrap">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() =>
                  updatePieceStatus(item.uniqueId, pos.pcsNo, status)
                }
                className={`flex-1 min-w-[60px] py-1.5 rounded-md font-bold border-2 transition-all text-[10px] ${getStatusColorClasses(
                  status,
                  pos.status === status,
                )}`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* QC Selection */}
          {availableQCs.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {availableQCs.map((qc) => {
                const isSelected = pos.qcUser?.emp_id === qc.emp_id;
                return (
                  <div
                    key={qc.emp_id}
                    onClick={() => updatePieceQC(item.uniqueId, pos.pcsNo, qc)}
                    className={`flex flex-col items-center p-1.5 rounded-lg border-2 cursor-pointer transition-all min-w-[50px] ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`text-[8px] font-bold ${
                        isSelected ? "text-indigo-600" : "text-gray-400"
                      }`}
                    >
                      {qc.emp_id}
                    </span>
                    {qc.face_photo ? (
                      <img
                        src={qc.face_photo}
                        alt="qc"
                        className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected
                            ? "bg-indigo-200 text-indigo-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <User className="w-3 h-3" />
                      </div>
                    )}
                    <span
                      className={`text-[7px] font-medium truncate w-full text-center ${
                        isSelected ? "text-indigo-800" : "text-gray-600"
                      }`}
                    >
                      {qc.eng_name?.split(" ")[0]}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-indigo-600 absolute -top-1 -right-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Position & Comment Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Comment Button */}
            <button
              onClick={() => openCommentModal(item.uniqueId, pos.pcsNo)}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors relative ${
                hasComment
                  ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              title={hasComment ? "Edit Comment" : "Add Comment"}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {hasComment && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              )}
            </button>

            {/* Position Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-1 justify-end">
              <button
                onClick={() =>
                  updatePiecePosition(item.uniqueId, pos.pcsNo, "Outside")
                }
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                  pos.position === "Outside"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Outside
              </button>
              <button
                onClick={() =>
                  updatePiecePosition(item.uniqueId, pos.pcsNo, "Inside")
                }
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                  pos.position === "Inside"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Inside
              </button>
            </div>

            {/* Required Image Section */}
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Required Image
                </label>
                {pos.requiredImage ? (
                  <span className="text-[8px] text-green-500 font-medium flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Added
                  </span>
                ) : (
                  <span className="text-[8px] text-amber-500 font-medium">
                    Required
                  </span>
                )}
              </div>

              {pos.requiredImage ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 group">
                  <img
                    src={
                      pos.requiredImage.editedImgSrc || pos.requiredImage.imgSrc
                    }
                    alt="Required"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() =>
                      removeRequiredImage(item.uniqueId, pos.pcsNo)
                    }
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[7px] text-center py-0.5">
                    Pcs {pos.pcsNo}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-1 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openRequiredImageEditor(
                          item.uniqueId,
                          pos.pcsNo,
                          "camera",
                        )
                      }
                      className="p-1.5 rounded bg-white border border-gray-200 hover:border-indigo-300 shadow-sm"
                      title="Camera"
                    >
                      <Camera className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() =>
                        openRequiredImageEditor(
                          item.uniqueId,
                          pos.pcsNo,
                          "upload",
                        )
                      }
                      className="p-1.5 rounded bg-white border border-gray-200 hover:border-indigo-300 shadow-sm"
                      title="Upload"
                    >
                      <Upload className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-[7px] text-amber-600 font-medium">
                    Add Image
                  </span>
                </div>
              )}
            </div>

            {/* More Button */}
            <button
              onClick={() => toggleMoreSection(item.uniqueId, pos.pcsNo)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${
                isMoreExpanded
                  ? "bg-indigo-100 text-indigo-600"
                  : hasAdditionalData
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <MoreHorizontal className="w-3 h-3" />
              More
              {hasAdditionalData && !isMoreExpanded && (
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Expanded More Section */}
          {isMoreExpanded && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-3 animate-fadeIn">
              {/* Additional Remark */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Additional Remark
                  </label>
                  <span
                    className={`text-[8px] ${
                      (pos.additionalRemark?.length || 0) >= 200
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {pos.additionalRemark?.length || 0}/200
                  </span>
                </div>
                <textarea
                  value={pos.additionalRemark || ""}
                  onChange={(e) =>
                    updatePieceAdditionalRemark(
                      item.uniqueId,
                      pos.pcsNo,
                      e.target.value.slice(0, 200),
                    )
                  }
                  placeholder="Add remark for this piece..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-2 py-1.5 text-[10px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Additional Images */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Additional Images
                  </label>
                  <span className="text-[8px] text-gray-400">
                    {pos.additionalImages?.length || 0}/5
                  </span>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {/* Existing Additional Images */}
                  {(pos.additionalImages || []).map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group"
                    >
                      <img
                        src={img.editedImgSrc || img.imgSrc}
                        alt={`Img ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          removeAdditionalImage(
                            item.uniqueId,
                            pos.pcsNo,
                            img.id,
                          )
                        }
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {(pos.additionalImages?.length || 0) < 5 && (
                    <div className="w-12 h-12 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                      <div className="flex gap-0.5">
                        <button
                          onClick={() =>
                            openAdditionalImageEditor(
                              item.uniqueId,
                              pos.pcsNo,
                              "camera",
                            )
                          }
                          className="p-1 rounded bg-white border border-gray-200 hover:border-indigo-300"
                          title="Camera"
                        >
                          <Camera className="w-2.5 h-2.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() =>
                            openAdditionalImageEditor(
                              item.uniqueId,
                              pos.pcsNo,
                              "upload",
                            )
                          }
                          className="p-1 rounded bg-white border border-gray-200 hover:border-indigo-300"
                          title="Upload"
                        >
                          <Upload className="w-2.5 h-2.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Location Card
  const renderLocationCard = (item) => {
    const isExpanded = expandedCards[item.uniqueId] !== false;
    const imageWarning = getImageWarning(item);

    return (
      <div
        key={item.uniqueId}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-fadeIn bg-white dark:bg-gray-800 shadow-sm"
      >
        {/* Card Header */}
        <div
          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
            imageWarning
              ? "bg-amber-50 dark:bg-amber-900/20"
              : "bg-gray-50 dark:bg-gray-750 hover:bg-gray-100"
          }`}
          onClick={() => toggleCardExpand(item.uniqueId)}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${
                item.view === "Front" ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {item.locationNo}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {item.locationName}
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-[9px] text-gray-500 uppercase">
                  {item.view}
                </p>
                {imageWarning && (
                  <span className="text-[9px] text-amber-600 font-medium flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {imageWarning}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Qty: {item.qty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSelection(item.uniqueId);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Card Content */}
        {isExpanded && (
          <div className="p-2.5 space-y-3 border-t border-gray-100 dark:border-gray-700">
            {/* Qty Control */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
              <span className="text-[10px] font-semibold text-gray-600 uppercase">
                Quantity
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateLocationQty(item.uniqueId, item.qty - 1)}
                  disabled={item.qty <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-bold text-gray-800 text-sm">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateLocationQty(item.uniqueId, item.qty + 1)}
                  disabled={item.qty >= 99}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Pieces List */}
            <div className="space-y-2">
              {item.positions.map((pos) => renderPieceCard(item, pos))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20">
      {/* Header - Hide if forcedProductTypeId */}
      {!forcedProductTypeId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-row items-end gap-3 w-full">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Select Product
              </label>
              <select
                value={selectedConfigId}
                onChange={handleConfigChange}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Choose --</option>
                {configurations.map((config) => (
                  <option key={config._id} value={config._id}>
                    {config.productTypeName}
                  </option>
                ))}
              </select>
            </div>

            {selectedLocations.length > 0 && (
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg shadow">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span className="font-bold text-lg">
                      {selectedLocations.length}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/30"></div>
                  <button
                    onClick={handleClearAll}
                    className="hover:text-red-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Image Viewer */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-gray-200 dark:bg-gray-700/50 p-1 rounded-lg flex">
              <button
                onClick={() => setActiveView("Front")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
                  activeView === "Front"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Front" ? "bg-red-500" : "bg-gray-400"
                  }`}
                ></div>
                Front
              </button>
              <button
                onClick={() => setActiveView("Back")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
                  activeView === "Back"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeView === "Back" ? "bg-blue-500" : "bg-gray-400"
                  }`}
                ></div>
                Back
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeView === "Front"
                ? renderImageView(currentConfig.frontView, "Front")
                : renderImageView(currentConfig.backView, "Back")}
            </div>
          </div>

          {/* Right: Selection List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 py-2.5 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-white font-bold text-xs flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Selected Locations
                </h3>
                <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {selectedLocations.length}
                </span>
              </div>

              <div className="p-2.5">
                {selectedLocations.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No locations selected.</p>
                    <p className="text-[10px] mt-1">Click markers to add.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLocations.map((item) => renderLocationCard(item))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        !forcedProductTypeId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
              Select a Product Type
            </h3>
            <p className="text-gray-500 text-sm">
              Choose from the dropdown above.
            </p>
          </div>
        )
      )}

      {forcedProductTypeId && !currentConfig && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="text-sm">No location diagram for this product.</p>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/60 z-[9998] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                    Add Comment
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Pcs#{editingComment.pcsNo}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelCommentModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-gray-600">
                  Comment
                </label>
                <span
                  className={`text-[9px] ${
                    (editingComment.comment?.length || 0) >= 500
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {editingComment.comment?.length || 0}/500
                </span>
              </div>
              <textarea
                value={editingComment.comment}
                onChange={(e) =>
                  setEditingComment((prev) => ({
                    ...prev,
                    comment: e.target.value.slice(0, 500),
                  }))
                }
                placeholder="Enter comment..."
                maxLength={500}
                rows={3}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={cancelCommentModal}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveComment}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={imageEditorMode}
          existingData={null}
          maxImages={isAdditionalImage ? 5 : 1}
          onSave={handleImageEditorSave}
          onCancel={handleImageEditorCancel}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesDefectLocationSelection;
