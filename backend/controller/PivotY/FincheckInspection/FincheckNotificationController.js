import webpush from "web-push";
import { FincheckPushSubscription } from "../../MongoDB/dbConnectionController.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// 1. Get Public Key (Frontend needs this)
export const getVapidPublicKey = (req, res) => {
  res
    .status(200)
    .json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

// 2. Subscribe User
export const subscribeUser = async (req, res) => {
  try {
    const { empId, subscription, userAgent } = req.body;

    if (!empId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // Upsert the subscription (Update if exists, Insert if new)
    await FincheckPushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        empId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent,
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Helper Function to Send Notification (Called internally)
export const sendPushToUser = async (empId, payload) => {
  try {
    // Find all devices subscribed by this user
    const subscriptions = await FincheckPushSubscription.find({ empId });

    if (!subscriptions || subscriptions.length === 0) return;

    // Send to all devices in parallel
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        // 410 Gone means the subscription is no longer valid (user cleared cache/unsubscribed)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await FincheckPushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error("Error sending push:", error);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Global Push Error:", error);
  }
};

// 4. Verify Subscription Exists in Database
export const verifySubscription = async (req, res) => {
  try {
    const { empId, endpoint } = req.body;

    if (!empId || !endpoint) {
      return res.status(400).json({
        success: false,
        exists: false,
        message: "empId and endpoint required",
      });
    }

    const subscription = await FincheckPushSubscription.findOne({
      empId: empId,
      endpoint: endpoint,
    });

    return res.status(200).json({
      success: true,
      exists: !!subscription,
    });
  } catch (error) {
    console.error("Verify subscription error:", error);
    return res.status(500).json({
      success: false,
      exists: false,
      error: error.message,
    });
  }
};
