import { p88LegacyData } from '../../MongoDB/dbConnectionController.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Enhanced flexible header mapping system
const createFlexibleMapping = () => {
  return {
    // Group variations
    groupNumber: [
      'Group #', 'Group Number', 'GroupNumber', 'Group ID', 'Group'
    ],
    
    // Inspection variations
    inspectionNumbers: [
      'Inspection #', 'Inspection Number', 'InspectionNumber', 'Inspection ID'
    ],
    
    // Supplier variations
    supplier: [
      'Supplier', 'Supplier Name', 'Supplier Code'
    ],
    
    // PO variations
    poNumbers: [
      'PO #', 'PO Number', 'PONumber', 'Purchase Order', 'PO'
    ],
    
    // SKU variations
    skuNumbers: [
      'SKU #', 'SKU Number', 'SKUNumber', 'SKU', 'SKU Code'
    ],
    
    // Style variations
    style: [
      'Style', 'Style Number', 'Style Code', 'Style #'
    ],
    
    // Color variations
    colors: [
      'Color', 'Colors', 'Colour', 'Colours'
    ],
    
    // Size variations
    sizes: [
      'Size', 'Sizes', 'Size Code'
    ],
    
    // Brand variations
    brand: [
      'Brand', 'Brand Name'
    ],
    
    // Buyer variations
    buyer: [
      'Buyer', 'Buyer Name'
    ],
    
    // Client variations
    client: [
      'Client', 'Client Name', 'Customer'
    ],
    
    // Material variations
    material: [
      'Material', 'Materials', 'Fabric'
    ],
    
    // Origin variations
    origin: [
      'Origin', 'Country of Origin', 'Manufacturing Origin'
    ],
    
    // Port variations
    portOfLoading: [
      'Port of Loading', 'Loading Port', 'POL'
    ],
    
    portOfArrival: [
      'Port of Arrival', 'Arrival Port', 'POA', 'Destination Port'
    ],
    
    // Destination variations
    destination: [
      'Destination', 'Final Destination'
    ],
    
    // Description variations
    description: [
      'Description', 'Product Description', 'Item Description'
    ],
    
    // SKU Name variations
    skuName: [
      'SKU Name', 'Product Name', 'Item Name'
    ],
    
    // Packing variations
    packingType: [
      'Packing Type', 'Packaging Type', 'Pack Type'
    ],
    
    // Quantity variations
    masterCartonPackedQty: [
      'Master Carton / Packed Qty', 'Master Carton Qty', 'Carton Qty'
    ],
    
    innerPackQty: [
      'Inner Pack Qty', 'Inner Pack Quantity', 'Pack Qty'
    ],
    
    totalPoItemsQty: [
      'Total PO Items Qty', 'Total PO Qty', 'PO Quantity'
    ],
    
    qtyToInspect: [
      'Qty to Inspect', 'Quantity to Inspect', 'Inspect Qty'
    ],
    
    qtyInspected: [
      'Qty Inspected', 'Quantity Inspected', 'Inspected Qty'
    ],
    
    // Price variations
    retailPrice: [
      'Retail Price', 'Price', 'Unit Price'
    ],
    
    // Date variations
    orderDate: [
      'Order Date', 'PO Date', 'Purchase Date'
    ],
    
    etd: [
      'ETD', 'Estimated Time of Departure', 'Departure Date'
    ],
    
    eta: [
      'ETA', 'Estimated Time of Arrival', 'Arrival Date'
    ],
    
    scheduledInspectionDate: [
      'Scheduled Inspection Date', 'Inspection Schedule', 'Planned Inspection Date'
    ],
    
    submittedInspectionDate: [
      'Submitted Inspection Date', 'Inspection Submitted Date'
    ],
    
    decisionDate: [
      'Decision Date', 'Final Decision Date'
    ],
    
    lastModifiedDate: [
      'Last Modified Date', 'Modified Date', 'Updated Date'
    ],
    
    // Terms variations
    terms: [
      'Terms', 'Payment Terms', 'Trade Terms'
    ],
    
    // Inspection result variations
    inspectionResult: [
      'Inspection Result', 'Result', 'Final Result'
    ],
    
    // Approval variations
    approvalStatus: [
      'Approval Status', 'Status', 'Approval'
    ],
    
    // Report variations
    reportType: [
      'Report Type', 'Type of Report'
    ],
    
    // Inspector variations
    inspector: [
      'Inspector', 'Inspector Name', 'QC Inspector'
    ],
    
    // Project variations
    project: [
      'Project', 'Project Name', 'Project Code'
    ],
    
    // Sample variations
    sampleSize: [
      'Sample Size', 'Sample Qty', 'Sample Quantity'
    ],
    
    sampleInspected: [
      'Sample Inspected', 'Inspected Sample', 'Sample Checked'
    ],
    
    // Inspector decision variations
    inspectorDecision: [
      'Inspector Decision', 'QC Decision', 'Final Decision'
    ],
    
    // Location variations
    inspectionLocation: [
      'Inspection Location', 'Location', 'Facility'
    ],
    
    // Defect rate variations
    defectRate: [
      'Defect Rate', 'Defect %', 'Defect Percentage'
    ],
    
    // Defect count variations
    totalNumberOfDefects: [
      'Total Number of Defects', 'Total Defects', 'Defect Count'
    ],
    
    totalDefectiveUnits: [
      'Total Defective Units', 'Defective Units', 'Bad Units'
    ],
    
    totalGoodUnits: [
      'Total Good Units', 'Good Units', 'Acceptable Units'
    ],
    
    // Comments variations
    allComments: [
      'All Comments', 'Comments', 'Notes', 'Remarks'
    ],
    
    // PoLine variations
    poLineCustomerPO: [
      'PoLine:Customer PO#', 'PoLine Customer PO#', 'Customer PO#', 'PoLine\nPO#'
    ],
    
    poLineMainPO: [
      'PoLine:Main PO#', 'PoLine Main PO#', 'Main PO#', 'PoLine PO#'
    ]
  };
};

// Function to find matching headers in CSV
const findMatchingHeader = (csvHeaders, fieldMappings) => {
  const headerMap = {};
  const usedHeaders = new Set();
  
  // First pass - exact matches
  Object.keys(fieldMappings).forEach(schemaField => {
    const possibleHeaders = fieldMappings[schemaField];
    
    for (const header of possibleHeaders) {
      if (csvHeaders.includes(header) && !usedHeaders.has(header)) {
        headerMap[header] = schemaField;
        usedHeaders.add(header);
        break; // Use first exact match found
      }
    }
  });
  
  // Second pass - case insensitive matches for unmapped headers
  Object.keys(fieldMappings).forEach(schemaField => {
    if (Object.values(headerMap).includes(schemaField)) {
      return; // Already mapped
    }
    
    const possibleHeaders = fieldMappings[schemaField];
    
    for (const header of possibleHeaders) {
      const matchingCsvHeader = csvHeaders.find(csvHeader => 
        csvHeader.toLowerCase().trim() === header.toLowerCase().trim() && 
        !usedHeaders.has(csvHeader)
      );
      
      if (matchingCsvHeader) {
        headerMap[matchingCsvHeader] = schemaField;
        usedHeaders.add(matchingCsvHeader);
        break;
      }
    }
  });
  
  return headerMap;
};

// Enhanced defect column detection
const isDefectColumn = (columnName, mappedHeaders) => {
  // If already mapped as standard field, not a defect
  if (Object.keys(mappedHeaders).includes(columnName)) {
    return false;
  }
  
  // Known defect summary columns (not individual defects)
  const defectSummaryColumns = [
    'Defect Category', 'Defect Code', 'Defect', 'Defect Description',
    'Qty Critical Defects', 'Qty Major Defects', 'Qty Minor Defects',
    'Critical Defects', 'Major Defects', 'Minor Defects'
  ];
  
  if (defectSummaryColumns.some(col => 
    columnName.toLowerCase().includes(col.toLowerCase())
  )) {
    return false;
  }
  
  // Standard column patterns that should not be treated as defects
  const standardPatterns = [
    'group', 'inspection', 'supplier', 'po', 'sku', 'style', 'color', 'size',
    'brand', 'buyer', 'client', 'material', 'origin', 'port', 'destination',
    'description', 'packing', 'carton', 'pack', 'retail', 'price', 'order',
    'date', 'terms', 'total', 'qty', 'quantity', 'etd', 'eta', 'scheduled', 
    'submitted', 'decision', 'modified', 'result', 'approval', 'status', 
    'report', 'type', 'inspector', 'project', 'sample', 'location', 'rate', 
    'number', 'defective', 'good', 'units', 'critical', 'major', 'minor', 
    'comments', 'poline', 'remarks', 'notes'
  ];
  
  // Check if column name contains standard field patterns
  const isStandardField = standardPatterns.some(pattern => 
    columnName.toLowerCase().includes(pattern.toLowerCase())
  );
  
  return !isStandardField;
};

// Helper functions for data processing
const parseDate = (dateString) => {
  if (!dateString || dateString.trim() === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const parseDateArray = (dateString) => {
  if (!dateString || dateString.trim() === '') return [];
  const dates = dateString.split(',').map(d => parseDate(d.trim())).filter(d => d !== null);
  return dates;
};

const parseNumber = (numberString) => {
  if (!numberString || numberString.trim() === '') return 0;
  const cleaned = numberString.toString().replace(/[,$%]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// FIXED: Enhanced array parsing with proper bracket handling
const parseArray = (arrayString) => {
  if (!arrayString || arrayString.trim() === '') return [];
  
  // Handle special case for colors with quantities in brackets
  if (arrayString.includes('[QTY')) {
    return parseColorArray(arrayString);
  }
  
  // Regular array parsing for other fields
  return arrayString.split(',').map(item => item.trim()).filter(item => item !== '');
};

// NEW: Special function to handle color arrays with quantities
const parseColorArray = (colorString) => {
  if (!colorString || colorString.trim() === '') return [];
  
  const colors = [];
  let currentColor = '';
  let bracketCount = 0;
  let i = 0;
  
  while (i < colorString.length) {
    const char = colorString[i];
    
    if (char === '[') {
      bracketCount++;
      currentColor += char;
    } else if (char === ']') {
      bracketCount--;
      currentColor += char;
      
      // If we've closed all brackets, this color entry is complete
      if (bracketCount === 0) {
        const trimmedColor = currentColor.trim();
        if (trimmedColor) {
          colors.push(trimmedColor);
        }
        currentColor = '';
        
        // Skip any following comma and whitespace
        i++;
        while (i < colorString.length && (colorString[i] === ',' || colorString[i] === ' ')) {
          i++;
        }
        continue;
      }
    } else if (char === ',' && bracketCount === 0) {
      // Only split on comma if we're not inside brackets
      const trimmedColor = currentColor.trim();
      if (trimmedColor) {
        colors.push(trimmedColor);
      }
      currentColor = '';
    } else {
      currentColor += char;
    }
    
    i++;
  }
  
  // Add any remaining color
  const trimmedColor = currentColor.trim();
  if (trimmedColor) {
    colors.push(trimmedColor);
  }
  
  return colors.filter(color => color !== '');
};

// Enhanced field value processing
const processFieldValue = (schemaField, value) => {
  if (!value && value !== 0) return getDefaultValue(schemaField);
  
  // Handle array fields
  if (['poNumbers', 'skuNumbers', 'sizes', 'inspectionNumbers', 'poLineCustomerPO', 'poLineMainPO'].includes(schemaField)) {
    return parseArray(value);
  }
  // Handle colors specially
  else if (schemaField === 'colors') {
    return parseColorArray(value);
  }
  // Handle date array fields (ETD, ETA)
  else if (['etd', 'eta'].includes(schemaField)) {
    return parseDateArray(value);
  }
  // Handle other date fields
  else if (schemaField.includes('Date')) {
    return parseDate(value);
  }
  // Handle number fields
  else if (['masterCartonPackedQty', 'innerPackQty', 'retailPrice', 'totalPoItemsQty',
            'qtyToInspect', 'qtyInspected', 'sampleSize', 'sampleInspected',
            'defectRate', 'totalNumberOfDefects', 'totalDefectiveUnits', 'totalGoodUnits'].includes(schemaField)) {
    return parseNumber(value);
  }
  // Handle enum fields
  else if (schemaField === 'inspectionResult') {
    const validResults = ['Pass', 'Fail', 'Pending', 'Hold'];
    const normalizedValue = value ? value.trim() : '';
    return validResults.includes(normalizedValue) ? normalizedValue : '';
  }
  // Handle string fields
  else {
    return value.toString().trim();
  }
};

// Get default values for different field types
const getDefaultValue = (schemaField) => {
  if (['poNumbers', 'skuNumbers', 'colors', 'sizes', 'inspectionNumbers', 'poLineCustomerPO', 'poLineMainPO', 'etd', 'eta'].includes(schemaField)) {
    return [];
  }
  else if (['masterCartonPackedQty', 'innerPackQty', 'retailPrice', 'totalPoItemsQty',
            'qtyToInspect', 'qtyInspected', 'sampleSize', 'sampleInspected',
            'defectRate', 'totalNumberOfDefects', 'totalDefectiveUnits', 'totalGoodUnits'].includes(schemaField)) {
    return 0;
  }
  else if (schemaField.includes('Date')) {
    return null;
  }
  else {
    return '';
  }
};

// Generate unique key from inspection numbers array
const generateInspectionNumbersKey = (inspectionNumbers) => {
  if (!inspectionNumbers || inspectionNumbers.length === 0) {
    return null;
  }
  
  const cleanNumbers = inspectionNumbers
    .filter(num => num && num.toString().trim() !== '')
    .map(num => num.toString().trim())
    .sort();
  
  if (cleanNumbers.length === 0) {
    return null;
  }
  
  return cleanNumbers.join('-');
};

// Generate unique key for records without inspection numbers
const generateFallbackKey = (mappedData, rowIndex) => {
  const keyParts = [
    mappedData.groupNumber || '',
    mappedData.supplier || '',
    mappedData.style || '',
    (mappedData.poNumbers || []).join(','),
    rowIndex.toString()
  ].filter(part => part !== '');
  
  return keyParts.length > 0 ? keyParts.join('|') : `row_${rowIndex}`;
};

// Generate upload batch ID
const generateUploadBatch = () => {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced CSV to schema mapping function
const mapCsvToSchema = (csvRow, uploadBatch, rowIndex) => {
  const csvHeaders = Object.keys(csvRow);
  const fieldMappings = createFlexibleMapping();
  const headerMap = findMatchingHeader(csvHeaders, fieldMappings);
  const mappedData = {};
  const defects = [];
  const defectCategories = [];
  const defectCodes = [];
  const defectDescriptions = [];
  let qtyCriticalDefects = 0;
  let qtyMajorDefects = 0;
  let qtyMinorDefects = 0;
  
  // Initialize all schema fields with default values
  Object.keys(fieldMappings).forEach(schemaField => {
    mappedData[schemaField] = getDefaultValue(schemaField);
  });
  
  // Process each CSV column
  csvHeaders.forEach(csvHeader => {
    const value = csvRow[csvHeader];
    
    if (headerMap[csvHeader]) {
      // This is a standard field
      const schemaField = headerMap[csvHeader];
      mappedData[schemaField] = processFieldValue(schemaField, value);
    }
    // Handle special defect summary fields
    else if (csvHeader === 'Defect Category') {
      const category = value ? value.toString().trim() : '';
      if (category) {
        defectCategories.push(category);
      }
    }
    else if (csvHeader === 'Defect Code') {
      const code = value ? value.toString().trim() : '';
      if (code) {
        defectCodes.push(code);
      }
    }
    else if (csvHeader === 'Defect' || csvHeader === 'Defect Description') {
      const description = value ? value.toString().trim() : '';
      if (description) {
        defectDescriptions.push(description);
      }
    }
    else if (csvHeader === 'Qty Critical Defects' || csvHeader === 'Critical Defects') {
      qtyCriticalDefects += parseNumber(value);
    }
    else if (csvHeader === 'Qty Major Defects' || csvHeader === 'Major Defects') {
      qtyMajorDefects += parseNumber(value);
    }
    else if (csvHeader === 'Qty Minor Defects' || csvHeader === 'Minor Defects') {
      qtyMinorDefects += parseNumber(value);
    }
    // Handle dynamic defect columns
    else if (isDefectColumn(csvHeader, headerMap)) {
      const count = parseNumber(value);
      if (count > 0) {
        defects.push({
          defectName: csvHeader,
          count: count
        });
      }
    }
    else {
      console.log(`     ⚠️ UNMAPPED: "${csvHeader}"`);
    }
  });
  
  // Set defect summary data
  mappedData.defects = defects;
  mappedData.defectCategories = [...new Set(defectCategories)];
  mappedData.defectCodes = [...new Set(defectCodes)];
  mappedData.defectDescriptions = [...new Set(defectDescriptions)];
  mappedData.qtyCriticalDefects = qtyCriticalDefects;
  mappedData.qtyMajorDefects = qtyMajorDefects;
  mappedData.qtyMinorDefects = qtyMinorDefects;
  
  // Add upload batch
  mappedData.uploadBatch = uploadBatch;
  
  // Generate unique key
  mappedData.inspectionNumbersKey = generateInspectionNumbersKey(mappedData.inspectionNumbers);
  
  // If no inspection numbers, create fallback unique key
  if (!mappedData.inspectionNumbersKey) {
    mappedData.inspectionNumbersKey = generateFallbackKey(mappedData, rowIndex);
  }
  
  return mappedData;
};

// Enhanced controller function to handle CSV upload
export const uploadP88Data = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const csvData = [];
    const stream = Readable.from(req.file.buffer.toString());

    // Parse CSV
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          skipEmptyLines: true,
          trim: true
        }))
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or invalid'
      });
    }

    // Generate upload batch ID
    const uploadBatch = generateUploadBatch();
    
    // Analyze CSV headers
    const headers = Object.keys(csvData[0]);

    // Test mapping on headers
    const fieldMappings = createFlexibleMapping();
    const testHeaderMap = findMatchingHeader(headers, fieldMappings);
    
    const unmappedHeaders = headers.filter(h => !Object.keys(testHeaderMap).includes(h));
    
    // Identify potential defect columns
    const potentialDefects = unmappedHeaders.filter(h => isDefectColumn(h, testHeaderMap));

    const savedRecords = [];
    const updatedRecords = [];
    const errors = [];

    // Process each row individually
    for (let i = 0; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        const mappedData = mapCsvToSchema(row, uploadBatch, i);
        
        try {
          // Try to create new record first
          const p88Record = new p88LegacyData(mappedData);
          const savedRecord = await p88Record.save();
          
          savedRecords.push(savedRecord);
          
        } catch (saveError) {
          // Handle duplicate key error for inspectionNumbersKey
          if (saveError.code === 11000 && saveError.keyPattern?.inspectionNumbersKey) {
            
            try {
              const updatedRecord = await p88LegacyData.findOneAndUpdate(
                { inspectionNumbersKey: mappedData.inspectionNumbersKey },
                { 
                  ...mappedData,
                  lastModifiedDate: new Date(),
                  updatedAt: new Date()
                },
                { 
                  new: true, 
                  runValidators: true 
                }
              );
              
              if (updatedRecord) {
                updatedRecords.push({
                  rowNumber: i + 1,
                  recordId: updatedRecord._id,
                  inspectionNumbersKey: mappedData.inspectionNumbersKey
                });
              } else {
                throw new Error('Failed to update existing record');
              }
              
            } catch (updateError) {
              console.error(`❌ Update error for row ${i + 1}:`, updateError.message);
              errors.push({
                rowNumber: i + 1,
                error: `Update failed: ${updateError.message}`,
                field: 'inspectionNumbersKey'
              });
            }
            
          } else {
            throw saveError;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
        errors.push({
          rowNumber: i + 1,
          error: error.message,
          field: 'general'
        });
      }
    }

    // Return enhanced response
    res.status(200).json({
      success: true,
      message: `Successfully processed ${csvData.length} rows`,
      results: {
        totalRows: csvData.length,
        newRecords: savedRecords.length,
        updatedRecords: updatedRecords.length,
        errors: errors.length,
        errorDetails: errors,
        updateDetails: updatedRecords,
        uploadBatch: uploadBatch,
        headerAnalysis: {
          totalHeaders: headers.length,
          mappedHeaders: Object.keys(testHeaderMap).length,
          unmappedHeaders: unmappedHeaders.length,
          potentialDefectColumns: potentialDefects.length,
          unmappedHeadersList: unmappedHeaders,
          potentialDefectsList: potentialDefects
        }
      }
    });

  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};

// Export multer middleware
export const uploadMiddleware = upload.single('file');
