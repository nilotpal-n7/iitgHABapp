const { Mess } = require("./messModel");
const { Menu } = require("./menuModel");
const { MenuItem } = require("./menuItemModel");
const { User } = require("../user/userModel");
const { Hostel } = require("../hostel/hostelModel");
const { ScanLogs } = require("./ScanLogsModel.js");
const mongoose = require("mongoose");
const {
  getCurrentDate,
  getCurrentTime,
  getCurrentDay,
} = require("../../utils/date.js");

const getMessMenuByDayForAdmin = async (req, res) => {
  try {
    const messId = req.params.messId;
    const day = req.body.day;
    if (!messId || !day) {
      return res.status(400).json({ message: "Mess ID and day are required" });
    }
    const allMenus = await Menu.find({});
    const menu = await Menu.find({ messId: messId, day: day }); //FIX THIS! PUT MESS ID AS WELL
    if (!menu || menu.length === 0) {
      return res.status(200).json("DoesntExist");
    }

    const populatedMenus = [];

    for (let i = 0; i < menu.length; i++) {
      const menuObj = menu[i].toObject();
      const menuItems = menuObj.items;
      const menuItemDetails = await MenuItem.find({ _id: { $in: menuItems } });

      const updatedMenuItems = menuItemDetails.map((item) => {
        const itemObj = item.toObject();
        //itemObj.isLiked = item.likes.includes(userId);
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

//modify menu item
const modifyMenuItem = async (req, res) => {
  try {
    const _Id = req.body._Id;
    const name = req.body.name;

    // const hostelId = req.user.id; //use hostelID

    const menuItem = await MenuItem.findById(_Id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    menuItem.name = name || menuItem.name;

    await menuItem.save();

    return res
      .status(200)
      .json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateTime = async (req, res) => {
  try {
    // Accept messId either in body or as a URL param (for SMC variant)
    const messId = req.body.messId || req.params?.messId;
    const type = req.body.type; // expected: 'Breakfast' | 'Lunch' | 'Dinner'
    const day = req.body.day;

    if (!messId || !day || !type) {
      return res
        .status(400)
        .json({ message: "messId, day and type are required" });
    }

    let start;
    let end;

    if (type === "Breakfast") {
      start = req.body.btime_s;
      end = req.body.btime_e;
    } else if (type === "Lunch") {
      start = req.body.ltime_s;
      end = req.body.ltime_e;
    } else if (type === "Dinner") {
      start = req.body.dtime_s;
      end = req.body.dtime_e;
    } else {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    // Find the specific Menu document for this messId, day and meal type
    const menu = await Menu.findOne({ messId: messId, day: day, type: type });
    if (!menu) {
      return res
        .status(404)
        .json({ message: "Menu not found for this meal/day" });
    }

    menu.startTime = start;
    menu.endTime = end;

    await menu.save();

    return res
      .status(200)
      .json({ message: "Menu timing updated successfully", menu });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// SMC-specific time update: allow authenticated SMC users to update timings
const updateTimeSMC = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isSMC) {
      return res
        .status(403)
        .json({ message: "Unauthorized: User is not an SMC member" });
    }

    // Delegate to same logic as updateTime by reusing request shape.
    // We can call updateTime directly, but to keep separation we duplicate minimal logic.
    const messId = req.params?.messId || req.body.messId;
    const type = req.body.type;
    const day = req.body.day;

    if (!messId || !day || !type) {
      return res
        .status(400)
        .json({ message: "messId, day and type are required" });
    }

    let start;
    let end;

    if (type === "Breakfast") {
      start = req.body.btime_s;
      end = req.body.btime_e;
    } else if (type === "Lunch") {
      start = req.body.ltime_s;
      end = req.body.ltime_e;
    } else if (type === "Dinner") {
      start = req.body.dtime_s;
      end = req.body.dtime_e;
    } else {
      return res.status(400).json({ message: "Invalid meal type" });
    }

    const menu = await Menu.findOne({ messId: messId, day: day, type: type });
    if (!menu) {
      return res
        .status(404)
        .json({ message: "Menu not found for this meal/day" });
    }

    menu.startTime = start;
    menu.endTime = end;
    await menu.save();

    return res
      .status(200)
      .json({ message: "Menu timing updated successfully (SMC)", menu });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// SMC-specific version that uses user authentication
const getMessMenuByDayForSMC = async (req, res) => {
  try {
    const messId = req.params.messId;
    const day = req.body.day;
    const user = req.user; // From authenticateJWT

    if (!messId || !day) {
      return res.status(400).json({ message: "Mess ID and day are required" });
    }

    // Verify user is SMC
    if (!user.isSMC) {
      return res.status(403).json({
        message: "Unauthorized: User is not an SMC member",
      });
    }

    const menu = await Menu.find({ messId: messId, day: day });
    if (!menu || menu.length === 0) {
      return res.status(200).json("DoesntExist");
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

// SMC version of modifyMenuItem
const modifyMenuItemSMC = async (req, res) => {
  try {
    const _Id = req.body._Id;
    const name = req.body.name;
    const user = req.user; // From authenticateJWT

    // Verify user is SMC
    if (!user.isSMC) {
      return res.status(403).json({
        message: "Unauthorized: User is not an SMC member",
      });
    }

    const menuItem = await MenuItem.findById(_Id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    menuItem.name = name || menuItem.name;

    await menuItem.save();

    return res
      .status(200)
      .json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  modifyMenuItem, //to modify menu item (hostel admin)
  modifyMenuItemSMC, //to modify menu item (SMC)
  getMessMenuByDayForAdmin,
  getMessMenuByDayForSMC,
  updateTime,
  updateTimeSMC,
};
