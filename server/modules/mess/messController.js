const { Mess } = require("./messModel");
const { Menu } = require("./menuModel");
const { MenuItem } = require("./menuItemModel");
const { User } = require("../user/userModel");
const { Hostel } = require("../hostel/hostelModel");
const { ScanLogs } = require("./ScanLogsModel.js");
const mongoose = require("mongoose");
const { QR } = require("../qr/qrModel.js");
const qrcode = require("qrcode");

const {
  getCurrentDate,
  getCurrentTime,
  getCurrentDay,
} = require("../../utils/date.js");

const createMess = async (req, res) => {
  try {
    const { name, hostelId } = req.body;

    const newMess = new Mess({
      name,
      hostelId,
    });
    const hostelRes = await Hostel.findByIdAndUpdate(
      hostelId,
      { messId: newMess._id },
      { new: true }
    );
    if (!hostelRes) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    await newMess.save();
    const qrDataUrl = await qrcode.toDataURL(newMess._id.toString());
    const QRres = new QR({
      qr_string: newMess._id.toString(),
      qr_base64: qrDataUrl,
    });
    await QRres.save();
    newMess.qrCode = QRres._id;
    await newMess.save();

    return res.status(201).json(newMess);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const createMessWithoutHostel = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Mess name is required" });
    }

    const newMess = new Mess({ name });
    await newMess.save();
    const qrDataUrl = await qrcode.toDataURL(newMess._id.toString());
    const QRres = new QR({
      qr_string: newMess._id.toString(),
      qr_base64: qrDataUrl,
    });
    await QRres.save();
    newMess.qrCode = QRres._id;
    await newMess.save();
    return res.status(201).json(newMess);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMess = async (req, res) => {
  try {
    const messId = req.params.messId;
    const deletedMess = await Mess.findByIdAndDelete(messId);

    if (!deletedMess) {
      return res.status(404).json({ message: "Mess not found" });
    }
    if (deletedMess.hostelId) {
      const hostelRes = await Hostel.findByIdAndUpdate(
        deletedMess.hostelId,
        { messId: null },
        { new: true }
      );
      if (!hostelRes) {
        return res.status(404).json({ message: "Hostel not found" });
      }
    }
    return res.status(200).json({ message: "Mess deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createMenu = async (req, res) => {
  try {
    const {
      messId,
      day,
      BstartTime,
      BendTime,
      LstartTime,
      LendTime,
      DstartTime,
      DendTime,
      BisGala,
      LisGala,
      DisGala,
    } = req.body;
    const typeOptions = ["Breakfast", "Lunch", "Dinner"];
    const newMenuB = new Menu({
      messId,
      day,
      startTime: BstartTime,
      endTime: BendTime,
      isGala: BisGala,
      type: typeOptions[0],
    });
    await newMenuB.save();
    const newMenuL = new Menu({
      messId,
      day,
      startTime: LstartTime,
      endTime: LendTime,
      isGala: LisGala,
      type: typeOptions[1],
    });
    await newMenuL.save();
    const newMenuD = new Menu({
      messId,
      day,
      startTime: DstartTime,
      endTime: DendTime,
      isGala: DisGala,
      type: typeOptions[2],
    });

    await newMenuD.save();
    return res.status(201).json(newMenuB);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const menuId = req.params.menuId;
    const deletedMenu = await Menu.findByIdAndDelete(menuId);
    if (!deletedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    return res.status(200).json({ message: "Menu deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createMenuItem = async (req, res) => {
  try {
    var { name, type, meal, day, messId } = req.body;
    const menuId = new mongoose.Types.ObjectId();
    const newMenuItem = new MenuItem({
      menuId,
      name,
      type,
    });
    const newItem = await newMenuItem.save();
    const menu = await Menu.findOne({ messId: messId, day: day, type: meal });
    if (!menu) {
      const newMenu = new Menu({
        messId,
        day,
        type: meal,
      });
      await newMenu.save();
      menu = newMenu;
    }

    menu.items.push(newItem._id);
    await menu.save();
    return res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const _Id = req.body._Id;
    const deletedMenuItem = await MenuItem.findByIdAndDelete(_Id);
    if (!deletedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    /*const menu = await Menu.findById(deletedMenuItem.menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    menu.items = menu.items.filter((item) => item.toString() !== menuItemId);*/

    return res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserMessInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const messHostelId = user.curr_subscribed_mess;
    const messHostel = await Hostel.findById(messHostelId);
    const messId = messHostel.messId;
    const messInfo = await Mess.findById(messId);
    if (!messInfo) {
      return res.status(404).json({ message: "Mess not found" });
    }
    return res.status(200).json(messInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllMessInfo = async (req, res) => {
  try {
    const messes = await Mess.find();

    if (!messes || messes.length === 0) {
      return res.status(404).json({ message: "No mess found" });
    }

    const messesWithHostelName = await Promise.all(
      messes.map(async (mess) => {
        const messObj = mess.toObject();
        if (messObj.hostelId) {
          const hostel = await Hostel.findById(messObj.hostelId);
          messObj.hostelName = hostel ? hostel.hostel_name : null;
        } else {
          messObj.hostelName = null;
        }

        const userCount = await User.find({
          curr_subscribed_mess: messObj.hostelId,
        });
        messObj.user_count = userCount.length;

        return messObj;
      })
    );
    console.log("All messes with hostel names:", messesWithHostelName);

    return res.status(200).json(messesWithHostelName);
  } catch (error) {
    console.error("Error in getAllMessInfo:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const mess = await Mess.findById(id);
    if (!mess) {
      return res.status(404).json({ message: "Mess not found" });
    }
    const messObj = mess.toObject();
    if (messObj.hostelId) {
      const hostel = await Hostel.findById(messObj.hostelId);
      messObj.hostelName = hostel ? hostel.hostel_name : null;
    } else {
      messObj.hostelName = null;
    }
    const qr_img = await QR.findById(messObj.qrCode);
    messObj.qr_img = qr_img ? qr_img.qr_base64 : null;
    return res.status(200).json(messObj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessMenuByDay = async (req, res) => {
  try {
    const messId = req.params.messId;
    const day = req.body.day;
    const userId = req.user.id;

    if (!messId || !day) {
      return res.status(400).json({ message: "Mess ID and day are required" });
    }

    const menu = await Menu.find({ messId, day });
    if (!menu || menu.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const populatedMenus = [];

    for (let i = 0; i < menu.length; i++) {
      const menuObj = menu[i].toObject();
      const menuItems = menuObj.items;
      const menuItemDetails = await MenuItem.find({ _id: { $in: menuItems } });

      const updatedMenuItems = menuItemDetails.map((item) => {
        const itemObj = item.toObject();
        itemObj.isLiked = item.likes.includes(userId);
        return itemObj;
      });

      menuObj.items = updatedMenuItems;
      populatedMenus.push(menuObj);
    }

    return res.status(200).json(populatedMenus);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessMenuByDayForAdminHAB = async (req, res) => {
  try {
    const messId = req.params.messId;
    const day = req.body.day;

    if (!messId || !day) {
      return res.status(400).json({ message: "Mess ID and day are required" });
    }

    const menu = await Menu.find({ messId, day });
    if (!menu || menu.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const populatedMenus = [];
    for (let i = 0; i < menu.length; i++) {
      const menuObj = menu[i].toObject();
      const menuItems = menuObj.items;
      const menuItemDetails = await MenuItem.find({ _id: { $in: menuItems } });

      const updatedMenuItems = menuItemDetails.map((item) => {
        const itemObj = item.toObject();
        return itemObj;
      });

      menuObj.items = updatedMenuItems;
      populatedMenus.push(menuObj);
    }

    return res.status(200).json(populatedMenus);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessMenuItemById = async (req, res) => {
  try {
    const menuItemId = req.params.menuItemId;
    const menuItemDoc = await MenuItem.findById(menuItemId);
    const userId = req.user.id;

    if (!menuItemDoc) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const menuItem = menuItemDoc.toObject(); // Convert to plain object
    menuItem.isLiked = menuItem.likes.includes(userId);

    return res.status(200).json(menuItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const toggleLikeMenuItem = async (req, res) => {
  try {
    const menuItemId = req.params.menuItemId;
    const userId = req.user.id;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (menuItem.likes.includes(userId)) {
      menuItem.likes = menuItem.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await menuItem.save();
      return res
        .status(200)
        .json({ message: "Menu item unliked successfully" });
    } else {
      menuItem.likes.push(userId);
      await menuItem.save();
      return res.status(200).json({ message: "Menu item liked successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const ScanMess = async (req, res) => {
//   try {
//     const messId = req.params.messId;
//     const messInfo = await Mess.findById(messId);
//     const userId = req.user.id;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     if (!messInfo) {
//       return res.status(404).json({ message: "Mess not found" });
//     }
//     if (messInfo.hostelId !== user.curr_subscribed_mess) {
//       return res
//         .status(400)
//         .json({ message: "User is not subscribed to this mess" });
//     }
//     if (
//       ScanLogs.find({ userId: userId, messId: messId, date: getCurrentDate() })
//     ) {
//       const time = getCurrentTime();
//       const breakfast = Menu.find({
//         messId: messId,
//         day: getCurrentDay(),
//         type: "Breakfast",
//       });
//       if (time >= breakfast.startTime && time <= breakfast.endTime) {
//         if (!ScanLogs.breakfast) {
//           ScanLogs.breakfast = true;
//           return res.status(200).json({ message: "Breakfast" });
//         } else {
//           return res
//             .status(400)
//             .json({ message: "Already scanned for breakfast" });
//         }
//       }
//       const lunch = Menu.find({
//         messId: messId,
//         day: getCurrentDay(),
//         type: "Lunch",
//       });
//       if (time >= lunch.startTime && time <= lunch.endTime) {
//         if (!ScanLogs.lunch) {
//           ScanLogs.lunch = true;
//           return res.status(200).json({ message: "Lunch" });
//         } else {
//           return res.status(400).json({ message: "Already scanned for lunch" });
//         }
//       }
//       const dinner = Menu.find({
//         messId: messId,
//         day: getCurrentDay(),
//         type: "Dinner",
//       });
//       if (time >= dinner.startTime && time <= dinner.endTime) {
//         if (!ScanLogs.dinner) {
//           ScanLogs.dinner = true;
//           return res.status(200).json({ message: "Dinner" });
//         } else {
//           return res
//             .status(400)
//             .json({ message: "Already scanned for dinner" });
//         }
//       }
//       return res
//         .status(400)
//         .json({ message: "No meals available at this time" });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const ScanMess = async (req, res) => {
  try {
    const { userId } = req.body;
    const messInfoId = req.params.messId;

    const messInfo = await Mess.findById(messInfoId);
    if (!messInfo) {
      return res
        .status(404)
        .json({ message: "Mess not found", success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const hostel = await Hostel.findById(user.curr_subscribed_mess);
    if (!hostel) {
      return res
        .status(404)
        .json({ message: "Hostel not found", success: false });
    }

    const messId = hostel.messId;
    const userMess = await Mess.findById(messId);
    if (!userMess) {
      return res
        .status(404)
        .json({ message: "User mess not found", success: false });
    }

    if (messInfo.hostelId.toString() !== user.curr_subscribed_mess.toString()) {
      return res.status(400).json({
        message: "User is not subscribed to this mess",
        success: false,
      });
    }

    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const currentDay = getCurrentDay();

    let scanLog = await ScanLogs.findOne({ userId, messId, date: currentDate });
    if (!scanLog) {
      scanLog = new ScanLogs({
        userId,
        messId,
        date: currentDate,
        breakfast: false,
        lunch: false,
        dinner: false,
      });
    }

    const [breakfast, lunch, dinner] = await Promise.all([
      Menu.findOne({ messId, day: currentDay, type: "Breakfast" }),
      Menu.findOne({ messId, day: currentDay, type: "Lunch" }),
      Menu.findOne({ messId, day: currentDay, type: "Dinner" }),
    ]);

    let mealType = null;
    let alreadyScanned = false;

    if (
      breakfast &&
      currentTime >= breakfast.startTime &&
      currentTime <= breakfast.endTime
    ) {
      mealType = "Breakfast";
      if (scanLog.breakfast) alreadyScanned = true;
      else {
        scanLog.breakfast = true;
        // Set breakfastTime in Kolkata timezone
        scanLog.breakfastTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
      }
    } else if (
      lunch &&
      currentTime >= lunch.startTime &&
      currentTime <= lunch.endTime
    ) {
      mealType = "Lunch";
      if (scanLog.lunch) alreadyScanned = true;
      else {
        scanLog.lunch = true;
        scanLog.lunchTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
      }
    } else if (
      dinner &&
      currentTime >= dinner.startTime &&
      currentTime <= dinner.endTime
    ) {
      mealType = "Dinner";
      if (scanLog.dinner) alreadyScanned = true;
      else {
        scanLog.dinner = true;
        scanLog.dinnerTime = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
      }
    }
    console.log("Scan Log:", scanLog);
    if (alreadyScanned) {
      const logDate = formatDate(scanLog.date);
      const logTime = formatTime2(scanLog[`${mealType.toLowerCase()}Time`]);
      console.log("Already scanned logTime:", logTime);
      console.log("Already scanned logDate:", logDate);
      return res.status(200).json({
        message: `Already scanned for ${mealType.toLowerCase()}`,
        success: false,
        mealType,
        time: logTime,
        date: logDate,
      });
    }

    if (!mealType) {
      return res.status(400).json({
        message: "No meals available at this time",
        success: false,
        time: formatTime(new Date()),
        date: formatDate(new Date()),
      });
    }

    await scanLog.save();

    // Get current time in Kolkata timezone
    const kolkataTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    return res.status(200).json({
      message: "Scan successful",
      success: true,
      mealType,
      time: formatTime2(kolkataTime),
      date: formatDate(kolkataTime),
      user: {
        name: user.name,
        rollNumber: user.rollNumber,
        photo:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1000&q=80",
        hostel: user.hostel,
        year: user.year,
        degree: user.degree,
      },
    });
  } catch (error) {
    console.error("Error in ScanMess:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};

const formatDate = (date) => {
  const dateObj = new Date(date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${dateObj.getDate()} ${
    months[dateObj.getMonth()]
  } ${dateObj.getFullYear()}`;
};

const getUnassignedMess = async (req, res) => {
  try {
    const unassignedMesses = await Mess.find({ hostelId: null });
    res.status(200).json(unassignedMesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const assignMessToHostel = async (req, res) => {
  try {
    const messId = req.params.messId;
    const hostelId = req.body.hostelId;
    const oldMessId = req.body.oldMessId;

    const newMess = await Mess.findByIdAndUpdate(
      messId,
      { hostelId: hostelId },
      { hostel_name: req.body.hostelName },
      { new: true }
    );
    if (!newMess) {
      return res.status(404).json({ message: "Mess not found" });
    }

    if (oldMessId) {
      const oldMess = await Mess.findByIdAndUpdate(
        oldMessId,
        { hostelId: null },
        { hostel_name: null },
        { new: true }
      );
      if (!oldMess) {
        return res.status(404).json({ message: "Old mess not found" });
      }
    }

    const hostelRes = await Hostel.findByIdAndUpdate(
      hostelId,
      { messId: messId },
      { new: true }
    );

    if (!hostelRes) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    return res.status(200).json({
      message: "Mess assigned to hostel successfully",
      mess: newMess,
      hostel: hostelRes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changeHostel = async (req, res) => {
  try {
    const messId = req.params.messId;
    const hostelId = req.body.hostelId;
    const oldHostelId = req.body.oldHostelId;

    const newMess = await Mess.findByIdAndUpdate(
      messId,
      { hostelId: hostelId },
      { new: true }
    );
    if (!newMess) {
      return res.status(404).json({ message: "Mess not found" });
    }

    const oldHostel = await Hostel.findByIdAndUpdate(
      oldHostelId,
      { messId: null },
      { new: true }
    );
    if (!oldHostel) {
      return res.status(404).json({ message: "Old Hostel not found" });
    }

    const hostelRes = await Hostel.findByIdAndUpdate(
      hostelId,
      { messId: messId },
      { new: true }
    );

    if (!hostelRes) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    return res.status(200).json({
      message: "Mess assigned to hostel successfully",
      mess: newMess,
      hostel: hostelRes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const unassignMess = async (req, res) => {
  try {
    const messId = req.params.messId;
    console.log("Unassigning mess with ID:", messId);

    // First, get the mess to find which hostel it was assigned to
    const mess = await Mess.findById(messId);
    if (!mess) {
      return res.status(404).json({ message: "Mess not found" });
    }

    const hostelId = mess.hostelId;
    console.log("Mess was assigned to hostel:", hostelId);

    // Update mess to remove hostel assignment
    const updatedMess = await Mess.findByIdAndUpdate(
      messId,
      { hostelId: null },
      { new: true }
    );
    console.log("Updated mess:", updatedMess);

    // Update hostel to remove mess assignment
    if (hostelId) {
      const updatedHostel = await Hostel.findByIdAndUpdate(
        hostelId,
        { messId: null },
        { new: true }
      );
      console.log("Updated hostel:", updatedHostel);
    }

    return res.status(200).json({
      message: "Mess unassigned successfully",
      mess: updatedMess,
    });
  } catch (error) {
    console.error("Error in unassignMess:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const formatTime = (time) => {
  const timeObj = new Date(`1970-01-01T${time}:00`);
  const hours = timeObj.getHours();
  const minutes = timeObj.getMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

const formatTime2 = (time) => {
  const timeObj = new Date(time);
  const hours = timeObj.getHours();
  const minutes = timeObj.getMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

module.exports = {
  createMess,
  createMessWithoutHostel,
  deleteMess,
  createMenu,
  deleteMenu,
  createMenuItem,
  deleteMenuItem,
  getUserMessInfo,
  getAllMessInfo,
  getMessInfo,
  getMessMenuByDay,
  getMessMenuByDayForAdminHAB,
  getMessMenuItemById,
  toggleLikeMenuItem,
  ScanMess,
  getUnassignedMess,
  assignMessToHostel,
  unassignMess,
  changeHostel,
};
