import { 
  p88FailedReport,
  UserMain
} from '../../MongoDB/dbConnectionController.js';

export const getAuthUserIdentifier = async (req) => {
  try {
    if (!req.userId) return "Unknown";
    
    // Fetch user details from database
    const user = await UserMain.findById(req.userId);
    if (!user) return "Unknown";
    
    // Return the emp_id (or whatever identifier you use)
    return user.emp_id || user.eng_name || user.name || "Unknown";
  } catch (error) {
    console.error('Error fetching auth user:', error);
    return "Unknown";
  }
};

// Save a failure (Called within the download loop catch block)
export const logFailedReport = async (legacyId, inspNo, groupId, reason, empId) => {
    try {
        // Date with time set to 0
        const now = new Date();
        const dateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        await p88FailedReport.findOneAndUpdate(
            { legacyDataId: legacyId },
            { 
                $set: { 
                    inspectionNumber: inspNo,
                    groupId: groupId,
                    failReason: reason,
                    failedAt: dateOnly,
                    status: 'Pending'
                },
                // Add the specific user who just failed to the list of impacted users
                $addToSet: { 
                    emp_ids: empId 
                }
            },
            { upsert: true, new: true }
        );
    } catch (e) {
        console.error("Error logging failed report:", e.message);
    }
};

// Get all failed reports
export const getFailedReports = async (req, res) => {
    try {
        const reports = await p88FailedReport.find()
            .sort({ failedAt: -1 });

        res.json({ success: true, data: reports });
    } catch (error) {
        console.error("Error fetching failed reports:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update status to Downloaded (Called when user clicks manual link)
export const markAsDownloaded = async (req, res) => {
    try {
        const { reportId } = req.body;

        await p88FailedReport.findByIdAndUpdate(reportId, {
            status: 'Downloaded',
            lastDownloadedAt: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking as downloaded:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get filter options for failed reports
export const getFailedReportsFilterOptions = async (req, res) => {
    try {
        
        // Get unique values for each filter field
        const [users, inspectionNumbers, groupIds] = await Promise.all([
            p88FailedReport.distinct('emp_ids'),
            p88FailedReport.distinct('inspectionNumber'),
            p88FailedReport.distinct('groupId')
        ]);

        // Filter out null/empty values and sort
        const filteredUsers = users
            .filter(user => user && user.trim() !== '')
            .sort();
            
        const filteredInspectionNumbers = inspectionNumbers
            .filter(inspNo => inspNo && inspNo.trim() !== '')
            .sort();
            
        const filteredGroupIds = groupIds
            .filter(groupId => groupId && groupId.trim() !== '')
            .sort();

        res.json({
            success: true,
            users: filteredUsers,
            inspectionNumbers: filteredInspectionNumbers,
            groupIds: filteredGroupIds
        });

    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get filtered failed reports
export const getFilteredFailedReports = async (req, res) => {
    try {
        const { 
            userId, 
            inspectionNumber, 
            groupId, 
            status, 
            startDate, 
            endDate 
        } = req.query;

        // Build query object
        let query = {};

        if (userId && userId.trim() !== '') {
            query.emp_ids = userId;
        }

        if (inspectionNumber && inspectionNumber.trim() !== '') {
            query.inspectionNumber = inspectionNumber;
        }

        if (groupId && groupId.trim() !== '') {
            query.groupId = groupId;
        }

        if (status && status.trim() !== '') {
            query.status = status;
        }

        // Date range filter
        if (startDate && endDate) {
            query.failedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z')
            };
        } else if (startDate) {
            query.failedAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.failedAt = { $lte: new Date(endDate + 'T23:59:59.999Z') };
        }

        const reports = await p88FailedReport.find(query)
            .sort({ failedAt: -1 });

        res.json({ 
            success: true, 
            data: reports,
            totalCount: reports.length,
            filters: req.query
        });

    } catch (error) {
        console.error("Error fetching filtered failed reports:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Generate report link for copying
export const generateReportLink = async (req, res) => {
    try {
        const { reportId } = req.body;
        
        if (!reportId) {
            return res.status(400).json({
                success: false,
                error: 'Report ID is required'
            });
        }

        // Find the failed report
        const report = await p88FailedReport.findById(reportId);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Generate the Pivot88 report URL
        const reportUrl = `https://yw.pivot88.com/inspectionreport/show/${report.inspectionNumber}`;
        
        res.json({
            success: true,
            reportUrl: reportUrl,
            inspectionNumber: report.inspectionNumber,
            message: `Report link generated for inspection ${report.inspectionNumber}`
        });

    } catch (error) {
        console.error('Error generating report link:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Alternative: Generate link directly from inspection number
export const generateReportLinkByInspection = async (req, res) => {
    try {
        const { inspectionNumber } = req.body;
        
        if (!inspectionNumber) {
            return res.status(400).json({
                success: false,
                error: 'Inspection number is required'
            });
        }

        // Generate the Pivot88 report URL
        const reportUrl = `https://yw.pivot88.com/inspectionreport/show/${inspectionNumber}`;
        
        res.json({
            success: true,
            reportUrl: reportUrl,
            inspectionNumber: inspectionNumber,
            message: `Report link generated for inspection ${inspectionNumber}`
        });

    } catch (error) {
        console.error('Error generating report link:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
