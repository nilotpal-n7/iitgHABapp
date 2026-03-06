const { ScanLogs } = require("./ScanLogsModel.js");
const { getCurrentDate } = require("../../utils/date.js");

//For getting count of people who have eaten breakfast, lunch and dinner
const statsByDate = async (req, res) => {
  try {
    const date = req.params.date;
    const messid = req.query.messId;
    let logs = {};
    if (!messid) {
      logs = await ScanLogs.find({ date: date });
    }
    else {
      logs = await ScanLogs.find({ date: date, messId: messid });
    }
    const stats = { total: 0, breakfast: 0, lunch: 0, dinner: 0, highest: ["",0], lowest: ["",0] };

    //For finding highest and lowest attendance mess
    const messwisestats = {};

    logs.forEach((item) => {
      if(!(item.messId in messwisestats)) messwisestats[item.messId] = [0,0];
      if (item.breakfast){
        ++messwisestats[item.messId][0];
        ++stats.breakfast;
      } 
      if (item.lunch){
        ++messwisestats[item.messId][0];
        ++stats.lunch;
      } 
      if (item.dinner){
        ++messwisestats[item.messId][0];
        ++stats.dinner;
      } 
      ++stats.total;
      ++messwisestats[item.messId][1]
    })

    //looping through the messes to find highest and lowest
    for(const key in messwisestats){
      const attendance = (messwisestats[key][0]/messwisestats[key][1]/3*100).toFixed(1);
      if (!stats.highest[0]){
        stats.lowest[0] = key; stats.lowest[1] = attendance
        stats.highest[0] = key; stats.highest[1] = attendance
      }
      else if (attendance > stats.highest[1]){
        stats.highest[0] = key;
        stats.highest[1] = attendance
      }
      else if (attendance < stats.lowest[1]){
        stats.lowest[0] = key;
        stats.lowest[1] = attendance;
      }
    }
console.log(stats)
    res.status(200).json(stats);
  }
  catch (error) {
    console.error(error);
    console.log("hello")
    return res.status(500).json({ message: "Internal server error" });
  }
}

//temporary function for creating sample logs
const createLogs = async (req, res) => {
  try {
    const logsdata = req.body;
    const insertedlogs = await ScanLogs.insertMany(logsdata);
    res.status(200).json({
      message: "Successfully inserted the data!",
      data: insertedlogs,
    })
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//temporary function for deleting sample logs
const deleteall = async (req, res) => {
  try {
    await ScanLogs.deleteMany();
    res.status(200).json({
      message: "Successfulyy deleted everything!",
    })
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get total count of all scan logs
const getTotalScanLogsCount = async (req, res) => {
  try {
    const totalCount = await ScanLogs.countDocuments({});
    res.status(200).json({ total: totalCount });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Mess-manager (HABit HQ): summary for today's scans for the manager's mess.
// Requires authenticateMessManagerJWT to set req.managerHostel with populated messId.
const getManagerTodaySummary = async (req, res) => {
  try {
    const managerHostel = req.managerHostel;
    if (!managerHostel || !managerHostel.messId) {
      return res
        .status(400)
        .json({ message: "Manager hostel or messId not found" });
    }

    const messId =
      managerHostel.messId._id?.toString() || managerHostel.messId.toString();
    const today = getCurrentDate(); // "YYYY-MM-DD"

    const logs = await ScanLogs.find({
      date: today,
      messId,
    })
      .populate("userId", "name rollNumber")
      .lean();

    const totals = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
    const recent = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    logs.forEach((log) => {
      const user = log.userId || {};
      const base = {
        userId: user._id || user.id || log.userId,
        name: user.name || "",
        rollNumber: user.rollNumber || "",
      };

      if (log.breakfast) {
        totals.breakfast += 1;
        totals.total += 1;
        if (log.breakfastTime) {
          recent.breakfast.push({
            ...base,
            time: log.breakfastTime,
          });
        }
      }
      if (log.lunch) {
        totals.lunch += 1;
        totals.total += 1;
        if (log.lunchTime) {
          recent.lunch.push({
            ...base,
            time: log.lunchTime,
          });
        }
      }
      if (log.dinner) {
        totals.dinner += 1;
        totals.total += 1;
        if (log.dinnerTime) {
          recent.dinner.push({
            ...base,
            time: log.dinnerTime,
          });
        }
      }
    });

    const sortByTimeDesc = (arr) =>
      arr.sort((a, b) => new Date(b.time) - new Date(a.time));
    sortByTimeDesc(recent.breakfast);
    sortByTimeDesc(recent.lunch);
    sortByTimeDesc(recent.dinner);

    return res.status(200).json({
      date: today,
      messId,
      totals,
      recent,
    });
  } catch (error) {
    console.error("getManagerTodaySummary:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  statsByDate,
  createLogs,
  deleteall,
  getTotalScanLogsCount,
  getManagerTodaySummary,
}