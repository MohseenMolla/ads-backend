import VisitorLog from "../models/VisitorLog.js";

// @desc    Track page view / session entry
// @route   POST /api/analytics/track
export const trackPageView = async (req, res) => {
  try {
    const { sessionId, page, referrer, device, browser } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "";

    const log = await VisitorLog.create({
      sessionId,
      userId: req.user?._id || null,
      ip,
      page: page || "/",
      referrer: referrer || "",
      userAgent: req.headers["user-agent"] || "",
      device: device || "desktop",
      browser: browser || "Browser",
      durationSeconds: 15,
      lastHeartbeat: new Date(),
    });

    res.status(201).json({ success: true, logId: log._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record session heartbeat / time spent update
// @route   POST /api/analytics/heartbeat
export const heartbeat = async (req, res) => {
  try {
    const { logId, sessionId, durationIncrement } = req.body;

    if (logId) {
      await VisitorLog.findByIdAndUpdate(logId, {
        lastHeartbeat: new Date(),
        $inc: { durationSeconds: Number(durationIncrement) || 15 },
      });
    } else if (sessionId) {
      // Fallback: update most recent log for this session
      await VisitorLog.findOneAndUpdate(
        { sessionId },
        {
          lastHeartbeat: new Date(),
          $inc: { durationSeconds: Number(durationIncrement) || 15 },
        },
        { sort: { createdAt: -1 } }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comprehensive analytics overview (Google Analytics / Search Console style)
// @route   GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res) => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Real-time active visitors (heartbeat in last 2 minutes)
    const realtimeActiveSessions = await VisitorLog.distinct("sessionId", {
      lastHeartbeat: { $gte: twoMinutesAgo },
    });

    // 2. Real-time pages being viewed right now
    const realtimePages = await VisitorLog.aggregate([
      { $match: { lastHeartbeat: { $gte: twoMinutesAgo } } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 3. Total Pageviews & Total Unique Visitors all-time
    const totalPageviews = await VisitorLog.countDocuments();
    const totalUniqueVisitors = (await VisitorLog.distinct("sessionId")).length;

    // 4. Today's stats
    const todayPageviews = await VisitorLog.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const todayUniqueVisitors = (
      await VisitorLog.distinct("sessionId", { createdAt: { $gte: startOfToday } })
    ).length;

    // 5. Average Duration / Time Spent
    const durationStats = await VisitorLog.aggregate([
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$durationSeconds" },
          totalDuration: { $sum: "$durationSeconds" },
        },
      },
    ]);
    const avgDurationSeconds = Math.round(durationStats[0]?.avgDuration || 0);

    // 6. Top Pages & Google Search Console style impact
    const topPages = await VisitorLog.aggregate([
      {
        $group: {
          _id: "$page",
          views: { $sum: 1 },
          avgTime: { $avg: "$durationSeconds" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          page: "$_id",
          views: 1,
          avgTimeSeconds: { $round: ["$avgTime", 0] },
          _id: 0,
        },
      },
    ]);

    // 7. Device breakdown
    const devices = await VisitorLog.aggregate([
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 },
        },
      },
    ]);

    // 8. 7-Day Trend
    const dailyTrend = await VisitorLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          views: { $sum: 1 },
          sessions: { $addToSet: "$sessionId" },
        },
      },
      {
        $project: {
          date: "$_id",
          views: 1,
          uniqueVisitors: { $size: "$sessions" },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        realtime: {
          activeVisitors: realtimeActiveSessions.length,
          pages: realtimePages.map((p) => ({ page: p._id, activeCount: p.count })),
        },
        totals: {
          pageviews: totalPageviews,
          uniqueVisitors: totalUniqueVisitors,
          todayViews: todayPageviews,
          todayVisitors: todayUniqueVisitors,
          avgDurationSeconds,
        },
        topPages,
        devices: devices.map((d) => ({ name: d._id || "desktop", count: d.count })),
        dailyTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
