import mongoose from "mongoose";

const createFincheckAIChatModel = (connection) => {
  // Enhanced Message Schema with metadata
  const MessageSchema = new mongoose.Schema(
    {
      role: {
        type: String,
        enum: ["user", "model", "system"],
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },

      // Message Metadata
      metadata: {
        // For AI responses
        isError: { type: Boolean, default: false },
        errorType: { type: String, default: null }, // 'api_error', 'db_error', 'parse_error'

        modelUsed: {
          type: String,
          enum: ["gemini", "groq", null],
          default: null,
        },

        // Query/Function tracking
        queryExecuted: { type: mongoose.Schema.Types.Mixed, default: null }, // Stores the query that was run
        functionCalled: { type: String, default: null }, // e.g., 'calculateAQL'
        dataFetched: { type: Boolean, default: false }, // Whether data was fetched from DB

        // Response quality
        tokensUsed: { type: Number, default: null },
        responseTime: { type: Number, default: null }, // in ms

        // Content flags
        hasAQLResult: { type: Boolean, default: false },
        hasDefectData: { type: Boolean, default: false },
        hasMeasurementData: { type: Boolean, default: false },
        hasTable: { type: Boolean, default: false },
      },

      // User Feedback
      feedback: {
        rating: { type: String, enum: ["up", "down", null], default: null },
        comment: { type: String, default: null },
        feedbackAt: { type: Date, default: null },
      },

      // Related Report IDs (for quick reference)
      relatedReportIds: [{ type: Number }],
    },
    { _id: true }, // Enable _id for individual message tracking
  );

  // Chat Context Schema - stores contextual information
  const ChatContextSchema = new mongoose.Schema(
    {
      // Frequently accessed data (cached for context)
      lastMentionedReportId: { type: Number, default: null },
      lastMentionedBuyer: { type: String, default: null },
      lastMentionedFactory: { type: String, default: null },
      lastMentionedOrderNos: [{ type: String }],

      // Conversation topics/tags
      topics: [
        {
          type: String,
          enum: [
            "aql",
            "defects",
            "measurements",
            "reports",
            "buyers",
            "factories",
            "inspectors",
            "statistics",
            "general",
          ],
        },
      ],

      // User preferences detected
      preferredBuyers: [{ type: String }],
      preferredFactories: [{ type: String }],
    },
    { _id: false },
  );

  // Main Chat Schema
  const FincheckAIChatSchema = new mongoose.Schema(
    {
      // User Reference
      empId: {
        type: String,
        required: true,
        index: true,
      },
      empName: { type: String, default: null },

      // Chat Metadata
      title: { type: String, default: "New Conversation" },
      summary: { type: String, default: null }, // AI-generated summary

      // Messages Array
      messages: [MessageSchema],

      // Chat Context
      context: {
        type: ChatContextSchema,
        default: () => ({}),
      },

      // Status Flags
      isDeleted: { type: Boolean, default: false, index: true },
      isPinned: { type: Boolean, default: false },
      isArchived: { type: Boolean, default: false },

      // Statistics
      stats: {
        messageCount: { type: Number, default: 0 },
        userMessageCount: { type: Number, default: 0 },
        aiMessageCount: { type: Number, default: 0 },
        totalTokensUsed: { type: Number, default: 0 },
        queriesExecuted: { type: Number, default: 0 },
        positiveRatings: { type: Number, default: 0 },
        negativeRatings: { type: Number, default: 0 },
      },

      // Tags for organization
      tags: [{ type: String }],

      // Color/Icon customization
      customization: {
        color: { type: String, default: null }, // hex color
        icon: { type: String, default: null }, // icon name
      },

      // Last Activity
      lastActivityAt: { type: Date, default: Date.now },

      // Share Settings (future feature)
      sharing: {
        isShared: { type: Boolean, default: false },
        sharedWith: [{ type: String }], // empIds
        shareLink: { type: String, default: null },
      },
    },
    {
      timestamps: true,
      collection: "fincheck_ai_chats",
    },
  );

  // Indexes for better query performance
  FincheckAIChatSchema.index({ empId: 1, isDeleted: 1, updatedAt: -1 });
  FincheckAIChatSchema.index({ empId: 1, isPinned: 1 });
  FincheckAIChatSchema.index({ empId: 1, tags: 1 });
  FincheckAIChatSchema.index({ "context.lastMentionedBuyer": 1 });
  FincheckAIChatSchema.index({ lastActivityAt: -1 });

  // Pre-save middleware to update stats
  FincheckAIChatSchema.pre("save", function (next) {
    if (this.isModified("messages")) {
      const messages = this.messages || [];
      this.stats.messageCount = messages.length;
      this.stats.userMessageCount = messages.filter(
        (m) => m.role === "user",
      ).length;
      this.stats.aiMessageCount = messages.filter(
        (m) => m.role === "model",
      ).length;
      this.stats.positiveRatings = messages.filter(
        (m) => m.feedback?.rating === "up",
      ).length;
      this.stats.negativeRatings = messages.filter(
        (m) => m.feedback?.rating === "down",
      ).length;

      // Sum tokens if available
      this.stats.totalTokensUsed = messages.reduce(
        (sum, m) => sum + (m.metadata?.tokensUsed || 0),
        0,
      );

      // Count queries executed
      this.stats.queriesExecuted = messages.filter(
        (m) => m.metadata?.dataFetched,
      ).length;
    }

    this.lastActivityAt = new Date();
    next();
  });

  // Instance Methods
  FincheckAIChatSchema.methods.addMessage = function (
    role,
    content,
    metadata = {},
  ) {
    this.messages.push({
      role,
      content,
      timestamp: new Date(),
      metadata,
    });
    return this.save();
  };

  FincheckAIChatSchema.methods.addFeedback = function (
    messageId,
    rating,
    comment = null,
  ) {
    const message = this.messages.id(messageId);
    if (message) {
      message.feedback = {
        rating,
        comment,
        feedbackAt: new Date(),
      };
      return this.save();
    }
    return Promise.resolve(null);
  };

  FincheckAIChatSchema.methods.updateContext = function (updates) {
    Object.assign(this.context, updates);
    return this.save();
  };

  FincheckAIChatSchema.methods.softDelete = function () {
    this.isDeleted = true;
    return this.save();
  };

  FincheckAIChatSchema.methods.togglePin = function () {
    this.isPinned = !this.isPinned;
    return this.save();
  };

  FincheckAIChatSchema.methods.archive = function () {
    this.isArchived = true;
    return this.save();
  };

  // Static Methods
  FincheckAIChatSchema.statics.findByEmployee = function (
    empId,
    includeDeleted = false,
  ) {
    const query = { empId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return this.find(query).sort({ isPinned: -1, lastActivityAt: -1 });
  };

  FincheckAIChatSchema.statics.findPinned = function (empId) {
    return this.find({ empId, isPinned: true, isDeleted: false }).sort({
      lastActivityAt: -1,
    });
  };

  FincheckAIChatSchema.statics.findArchived = function (empId) {
    return this.find({ empId, isArchived: true, isDeleted: false }).sort({
      lastActivityAt: -1,
    });
  };

  FincheckAIChatSchema.statics.searchChats = function (empId, searchTerm) {
    return this.find({
      empId,
      isDeleted: false,
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { "messages.content": { $regex: searchTerm, $options: "i" } },
        { tags: { $regex: searchTerm, $options: "i" } },
      ],
    }).sort({ lastActivityAt: -1 });
  };

  FincheckAIChatSchema.statics.getStats = async function (empId) {
    const result = await this.aggregate([
      { $match: { empId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalMessages: { $sum: "$stats.messageCount" },
          totalQueries: { $sum: "$stats.queriesExecuted" },
          totalPositive: { $sum: "$stats.positiveRatings" },
          totalNegative: { $sum: "$stats.negativeRatings" },
        },
      },
    ]);

    return (
      result[0] || {
        totalChats: 0,
        totalMessages: 0,
        totalQueries: 0,
        totalPositive: 0,
        totalNegative: 0,
      }
    );
  };

  return connection.model("FincheckAIChat", FincheckAIChatSchema);
};

export default createFincheckAIChatModel;
