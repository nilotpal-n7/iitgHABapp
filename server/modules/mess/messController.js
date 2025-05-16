const { Mess } = require("./messModel");
const { Menu } = require("./menuModel");
const { MenuItem } = require("./menuItemModel");
const { User } = require("../user/userModel");
const { Hostel } = require("../hostel/hostelModel");
const { ScanLogs } = require("./ScanLogsModel.js");

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
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    await newMess.save();
    hostel.messId = newMess._id;
    await hostel.save();
    return res.status(201).json(newMess);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createMenu = async (req, res) => {
  try {
    const { messId, day, startTime, endTime, isGala, type } = req.body;

    const newMenu = new Menu({
      messId,
      day,
      startTime,
      endTime,
      isGala,
      type,
    });

    await newMenu.save();
    return res.status(201).json(newMenu);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { menuId, name, type } = req.body;

    const newMenuItem = new MenuItem({
      menuId,
      name,
      type,
    });

    await newMenuItem.save();
    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    menu.items.push(newMenuItem._id);
    await menu.save();
    return res.status(201).json(newMenuItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const menuItemId = req.params.menuItemId;

    const deletedMenuItem = await MenuItem.findByIdAndDelete(menuItemId);
    if (!deletedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const menu = await Menu.findById(deletedMenuItem.menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    menu.items = menu.items.filter((item) => item.toString() !== menuItemId);
    await menu.save();

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
    return res.status(200).json(messes);
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

const ScanMess = async (req, res) => {
  try {
    const messId = req.params.messId;
    const messInfo = await Mess.findById(messId);
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!messInfo) {
      return res.status(404).json({ message: "Mess not found" });
    }
    if (messInfo.hostelId !== user.curr_subscribed_mess) {
      return res
        .status(400)
        .json({ message: "User is not subscribed to this mess" });
    }
    if (
      ScanLogs.find({ userId: userId, messId: messId, date: getCurrentDate() })
    ) {
      const time = getCurrentTime();
      const breakfast = Menu.find({
        messId: messId,
        day: getCurrentDay(),
        type: "Breakfast",
      });
      if (time >= breakfast.startTime && time <= breakfast.endTime) {
        if (!ScanLogs.breakfast) {
          ScanLogs.breakfast = true;
          return res.status(200).json({ message: "Breakfast" });
        } else {
          return res
            .status(400)
            .json({ message: "Already scanned for breakfast" });
        }
      }
      const lunch = Menu.find({
        messId: messId,
        day: getCurrentDay(),
        type: "Lunch",
      });
      if (time >= lunch.startTime && time <= lunch.endTime) {
        if (!ScanLogs.lunch) {
          ScanLogs.lunch = true;
          return res.status(200).json({ message: "Lunch" });
        } else {
          return res.status(400).json({ message: "Already scanned for lunch" });
        }
      }
      const dinner = Menu.find({
        messId: messId,
        day: getCurrentDay(),
        type: "Dinner",
      });
      if (time >= dinner.startTime && time <= dinner.endTime) {
        if (!ScanLogs.dinner) {
          ScanLogs.dinner = true;
          return res.status(200).json({ message: "Dinner" });
        } else {
          return res
            .status(400)
            .json({ message: "Already scanned for dinner" });
        }
      }
      return res
        .status(400)
        .json({ message: "No meals available at this time" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createMess,
  createMenu,
  createMenuItem,
  deleteMenuItem,
  getUserMessInfo,
  getAllMessInfo,
  getMessMenuByDay,
  getMessMenuItemById,
  toggleLikeMenuItem,
  ScanMess,
};
