import { DtOrder } from "../../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// Get DT Order by Order Number
export const getDtOrderByOrderNo = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { suggest } = req.query; // New query parameter for suggestions

    if (!orderNo) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
      });
    }

    // If suggest=true, return suggestions instead of exact match
    if (suggest === "true") {
      if (orderNo.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Query must be at least 2 characters long for suggestions",
        });
      }

      // Search for orders that match the query (case-insensitive)
      const suggestions = await DtOrder.find({
        $or: [
          { Order_No: { $regex: orderNo, $options: "i" } },
          { Style: { $regex: orderNo, $options: "i" } },
          { CustStyle: { $regex: orderNo, $options: "i" } },
        ],
      })
        .select("Order_No Style CustStyle ShortName TotalQty isModify")
        .limit(10)
        .sort({ Order_No: 1 });

      return res.status(200).json({
        success: true,
        data: suggestions,
        count: suggestions.length,
        type: "suggestions",
      });
    }

    // Original exact match logic
    const order = await DtOrder.findOne({ Order_No: orderNo });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    res.status(200).json({
      success: true,
      data: order,
      type: "exact_match",
    });
  } catch (error) {
    console.error("Error fetching DT order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const calculateTotalOrderQty = (orderData) => {
  try {
    let totalQty = 0;

    // Check if OrderColors exists and is an array
    if (!orderData.OrderColors || !Array.isArray(orderData.OrderColors)) {
      return 0;
    }

    // Loop through each color
    orderData.OrderColors.forEach((color, colorIndex) => {
      let colorTotal = 0;

      // Check if OrderQty exists and is an array
      if (color.OrderQty && Array.isArray(color.OrderQty)) {
        // Loop through each size quantity in this color
        color.OrderQty.forEach((qtyItem, qtyIndex) => {
          // Each qtyItem is an object like { "S": 100, "M": 150, "L": 200 }
          Object.keys(qtyItem).forEach((size) => {
            const qty = parseInt(qtyItem[size]) || 0;
            colorTotal += qty;
          });
        });
      }

      totalQty += colorTotal;
    });

    return totalQty;
  } catch (error) {
    console.error("❌ Error calculating total order quantity:", error);
    return 0;
  }
};

export const updateTotalOrderQty = async (orderId, newTotalQty) => {
  try {
    // Only update TotalQty and updatedAt - no user details
    const updateData = {
      TotalQty: newTotalQty,
      updatedAt: new Date(),
    };

    const updatedOrder = await DtOrder.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: false },
    );

    if (updatedOrder) {
      return updatedOrder;
    } else {
      console.log("❌ Failed to update total quantity - order not found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error updating total order quantity:", error);
    throw error;
  }
};

// Update DT Order by ID
export const updateDtOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    let userInfo = null;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Get the current order to compare old vs new total
    const currentOrder = await DtOrder.findById(id);
    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const oldTotalQty = currentOrder.TotalQty || 0;

    // Calculate new total quantity
    const newTotalQty = calculateTotalOrderQty(updateData);

    // Update the TotalQty in updateData
    updateData.TotalQty = newTotalQty;

    // Set modification fields with user data (only once here)
    updateData.isModify = true;
    updateData.modifiedAt = new Date();
    updateData.updatedAt = new Date();

    updateData.modifiedBy = userInfo
      ? userInfo.eng_name ||
        userInfo.emp_id ||
        userInfo.email ||
        "Authenticated User"
      : updateData.modifiedBy || "Unknown User";

    // Add to modification history (only once here)
    if (!updateData.modificationHistory) {
      updateData.modificationHistory = [];
    }

    updateData.modificationHistory.push({
      modifiedAt: new Date(),
      modifiedBy: updateData.modifiedBy,
      changes:
        updateData.changes ||
        `Order specifications modified. Total quantity updated from ${oldTotalQty} to ${newTotalQty}`,
      totalQtyChange: {
        oldTotal: oldTotalQty,
        newTotal: newTotalQty,
        difference: newTotalQty - oldTotalQty,
        updatedAt: new Date(),
      },
      userDetails: userInfo
        ? {
            userId: userInfo.emp_id,
            empId: userInfo.emp_id,
            engName: userInfo.eng_name,
            email: userInfo.email,
          }
        : null,
    });

    // Update the order (includes TotalQty and all user details in one operation)
    const updatedOrder = await DtOrder.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: false,
        strict: false,
        upsert: false,
      },
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Order updated successfully. Total quantity updated from ${oldTotalQty} to ${newTotalQty}`,
      data: updatedOrder,
      totalQtyUpdated: true,
      totalQtyChange: {
        oldTotal: oldTotalQty,
        newTotal: newTotalQty,
        difference: newTotalQty - oldTotalQty,
      },
    });
  } catch (error) {
    console.error("❌ Error updating DT order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const recalculateTotalQty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await DtOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const newTotalQty = calculateTotalOrderQty(order.toObject());
    const oldTotalQty = order.TotalQty || 0;

    if (newTotalQty !== oldTotalQty) {
      // Only update TotalQty, no user details for standalone recalculation
      const updatedOrder = await updateTotalOrderQty(id, newTotalQty);

      res.status(200).json({
        success: true,
        message: `Total quantity recalculated and updated from ${oldTotalQty} to ${newTotalQty}`,
        data: updatedOrder,
        oldTotal: oldTotalQty,
        newTotal: newTotalQty,
        difference: newTotalQty - oldTotalQty,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Total quantity is already correct",
        data: order,
        totalQty: newTotalQty,
        noChangeNeeded: true,
      });
    }
  } catch (error) {
    console.error("❌ Error recalculating total quantity:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all DT Orders (optional - for listing/searching)
export const getAllDtOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      factory = "",
      customer = "",
    } = req.query;

    // Build search query
    const query = {};

    if (search) {
      query.$or = [
        { Order_No: { $regex: search, $options: "i" } },
        { Style: { $regex: search, $options: "i" } },
        { CustStyle: { $regex: search, $options: "i" } },
      ];
    }

    if (factory) {
      query.Factory = factory;
    }

    if (customer) {
      query.Cust_Code = customer;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with pagination
    const orders = await DtOrder.find(query)
      .select(
        "Order_No Style CustStyle Factory Cust_Code ShortName TotalQty isModify createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await DtOrder.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching DT orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Validate order data before update (helper function)
export const validateOrderData = (orderData) => {
  const errors = [];

  // Validate SizeSpec structure
  if (orderData.SizeSpec) {
    orderData.SizeSpec.forEach((spec, index) => {
      if (!spec.Seq) {
        errors.push(`SizeSpec[${index}]: Seq is required`);
      }

      if (spec.Specs && !Array.isArray(spec.Specs)) {
        errors.push(`SizeSpec[${index}]: Specs must be an array`);
      }
    });
  }

  // Validate OrderColors structure
  if (orderData.OrderColors) {
    orderData.OrderColors.forEach((color, index) => {
      if (!color.ColorCode) {
        errors.push(`OrderColors[${index}]: ColorCode is required`);
      }

      if (color.OrderQty && !Array.isArray(color.OrderQty)) {
        errors.push(`OrderColors[${index}]: OrderQty must be an array`);
      }

      if (color.CutQty && typeof color.CutQty !== "object") {
        errors.push(`OrderColors[${index}]: CutQty must be an object`);
      }
    });
  }

  // Validate SizeList consistency
  if (orderData.SizeList && orderData.NoOfSize) {
    if (orderData.SizeList.length !== orderData.NoOfSize) {
      errors.push("SizeList length must match NoOfSize");
    }
  }

  return errors;
};

// Backup original order before modification (optional)
export const backupOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await DtOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create backup collection name
    const backupCollectionName = `dt_orders_backup_${new Date().getFullYear()}_${new Date().getMonth() + 1}`;

    // Create backup document
    const backupData = {
      ...order.toObject(),
      originalId: order._id,
      backupDate: new Date(),
      backupReason: "Pre-modification backup",
    };

    // Save to backup collection
    const BackupModel = mongoose.model(
      "DtOrderBackup",
      DtOrder.schema,
      backupCollectionName,
    );
    await BackupModel.create(backupData);

    res.status(200).json({
      success: true,
      message: "Order backed up successfully",
    });
  } catch (error) {
    console.error("Error backing up order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteSizeFromOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { sizeToDelete } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    if (!sizeToDelete || typeof sizeToDelete !== "string") {
      return res.status(400).json({
        success: false,
        message: "Size to delete is required and must be a string",
      });
    }

    const order = await DtOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.SizeList || !order.SizeList.includes(sizeToDelete)) {
      return res.status(400).json({
        success: false,
        message: `Size "${sizeToDelete}" not found in this order`,
      });
    }

    const oldTotalQty = order.TotalQty || 0;
    const updatedData = { ...order.toObject() };

    // Remove size from all relevant places
    updatedData.SizeList = order.SizeList.filter(
      (size) => size !== sizeToDelete,
    );
    updatedData.NoOfSize = updatedData.SizeList.length;

    if (updatedData.SizeSpec && Array.isArray(updatedData.SizeSpec)) {
      updatedData.SizeSpec = updatedData.SizeSpec.map((spec) => ({
        ...spec,
        Specs: spec.Specs.filter(
          (specItem) =>
            !Object.prototype.hasOwnProperty.call(specItem, sizeToDelete),
        ),
      }));
    }

    if (updatedData.OrderColors && Array.isArray(updatedData.OrderColors)) {
      updatedData.OrderColors = updatedData.OrderColors.map((color) => {
        const updatedColor = { ...color };

        if (updatedColor.OrderQty && Array.isArray(updatedColor.OrderQty)) {
          updatedColor.OrderQty = updatedColor.OrderQty.filter(
            (qtyItem) =>
              !Object.prototype.hasOwnProperty.call(qtyItem, sizeToDelete),
          );
        }

        if (updatedColor.CutQty && typeof updatedColor.CutQty === "object") {
          const { [sizeToDelete]: deletedSize, ...remainingCutQty } =
            updatedColor.CutQty;
          updatedColor.CutQty = remainingCutQty;
        }

        return updatedColor;
      });
    }

    if (
      updatedData.OrderColorShip &&
      Array.isArray(updatedData.OrderColorShip)
    ) {
      updatedData.OrderColorShip = updatedData.OrderColorShip.map(
        (colorShip) => ({
          ...colorShip,
          ShipSeqNo: colorShip.ShipSeqNo.map((shipSeq) => ({
            ...shipSeq,
            sizes: shipSeq.sizes.filter(
              (sizeItem) =>
                !Object.prototype.hasOwnProperty.call(sizeItem, sizeToDelete),
            ),
          })),
        }),
      );
    }

    // Recalculate total quantity after size deletion
    const newTotalQty = calculateTotalOrderQty(updatedData);
    updatedData.TotalQty = newTotalQty;

    // Only set basic modification flags, no user details
    updatedData.isModify = true;
    updatedData.updatedAt = new Date();

    console.log(
      `🗑️ Deleting size "${sizeToDelete}" - Total quantity: ${oldTotalQty} → ${newTotalQty}`,
    );

    const updatedOrder = await DtOrder.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Failed to update order after size deletion",
      });
    }

    res.status(200).json({
      success: true,
      message: `Size "${sizeToDelete}" deleted successfully. Total quantity updated from ${oldTotalQty} to ${newTotalQty}`,
      data: updatedOrder,
      deletedSize: sizeToDelete,
      remainingSizes: updatedOrder.SizeList,
      totalQtyChange: {
        oldTotal: oldTotalQty,
        newTotal: newTotalQty,
        difference: newTotalQty - oldTotalQty,
      },
    });
  } catch (error) {
    console.error("❌ Error deleting size from order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
