import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../apis";
import {
  Plus,
  Edit3,
  Trash2,
  Download,
  Calendar,
  Check,
  X,
} from "lucide-react";

const MenuDashboard = ({
  day,
  breakfast = [],
  lunch = [],
  dinner = [],
  messId,
  onSuccessfulItemCreation,
  click, // callback to open CreateMenuFallback in parent
  menuExists = true,
}) => {
  // active day is provided by parent Dashboard via `day` prop
  const activeDay = day || "Thursday";
  const [menus, setMenus] = useState({
    Monday: { breakfast: [], lunch: [], dinner: [] },
    Tuesday: { breakfast: [], lunch: [], dinner: [] },
    Wednesday: { breakfast: [], lunch: [], dinner: [] },
    Thursday: { breakfast: [], lunch: [], dinner: [] },
    Friday: { breakfast: [], lunch: [], dinner: [] },
    Saturday: { breakfast: [], lunch: [], dinner: [] },
    Sunday: { breakfast: [], lunch: [], dinner: [] },
  });

  // Sync incoming props into the menus for the active day whenever they change
  React.useEffect(() => {
    setMenus((prev) => ({
      ...prev,
      [activeDay]: {
        breakfast: breakfast || [],
        lunch: lunch || [],
        dinner: dinner || [],
      },
    }));
  }, [activeDay, breakfast, lunch, dinner]);

  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [addingTo, setAddingTo] = useState({ meal: null, category: null });
  const [newItemValue, setNewItemValue] = useState("");

  const categories = ["Dish", "Breads and Rice", "Others"];

  const addItem = async (meal, category) => {
    if (!newItemValue.trim()) return;

    // If the menu for this day doesn't exist, prompt user to create it first
    if (!menuExists) {
      alert("Menu for this day doesn't exist. Please create the menu first.");
      if (click) click();
      return;
    }

    try {
      // Backend expects capitalized meal like 'Breakfast', 'Lunch', 'Dinner'
      const mealType = meal.charAt(0).toUpperCase() + meal.slice(1);

      const payload = {
        name: newItemValue,
        type: category,
        meal: mealType,
        day: day,
        messId: messId,
      };

      const response = await axios.post(
        `${API_BASE_URL}/mess/menu/item/create`,
        payload
      );

      // Optimistic UI update
      const created = response.data;
      setMenus((prev) => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          [meal]: [
            ...prev[activeDay][meal],
            {
              id: created._id || created.id || Date.now(),
              name: created.name || newItemValue,
              category,
            },
          ],
        },
      }));

      setNewItemValue("");
      setAddingTo({ meal: null, category: null });

      if (onSuccessfulItemCreation) onSuccessfulItemCreation();
    } catch (error) {
      console.error("Failed to create menu item:", error);
      alert(error.response?.data?.message || "Failed to add item");
    }
  };

  const removeItem = async (meal, itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/mess/menu/item/delete`, {
        data: { _Id: itemId },
      });

      setMenus((prev) => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          [meal]: prev[activeDay][meal].filter((item) => item.id !== itemId),
        },
      }));

      if (onSuccessfulItemCreation) onSuccessfulItemCreation();
    } catch (error) {
      console.error("Failed to delete menu item:", error);
      alert(error.response?.data?.message || "Failed to delete item");
    }
  };

  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditValue(item.name);
  };

  const saveEdit = async (meal, itemId) => {
    if (!editValue.trim()) return;

    try {
      // Modify via admin endpoint
      await axios.post(`${API_BASE_URL}/mess/menu/modify/${messId}`, {
        _Id: itemId,
        name: editValue,
      });

      setMenus((prev) => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          [meal]: prev[activeDay][meal].map((item) =>
            item.id === itemId ? { ...item, name: editValue } : item
          ),
        },
      }));

      setEditingItem(null);
      setEditValue("");

      if (onSuccessfulItemCreation) onSuccessfulItemCreation();
    } catch (error) {
      console.error("Failed to update menu item:", error);
      alert(error.response?.data?.message || "Failed to update item");
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const cancelAdd = () => {
    setAddingTo({ meal: null, category: null });
    setNewItemValue("");
  };

  const getItemsByCategory = (meal, category) => {
    return menus[activeDay][meal].filter((item) => item.category === category);
  };

  // If menu for this day doesn't exist, show a CTA to create it
  if (!menuExists) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">No menu for {activeDay}</h3>
        <p className="text-sm text-gray-600">
          Create a menu to start adding items for Breakfast, Lunch and Dinner.
        </p>
        <div className="mt-4">
          <button
            onClick={() => click && click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Create Menu
          </button>
        </div>
      </div>
    );
  }

  const MealSection = ({ meal, title }) => (
    <div className="bg-white border border-gray-200 rounded-lg w-full">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-40">
                  Category
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                  Items
                </th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const items = getItemsByCategory(meal, category);
                const isAddingHere =
                  addingTo.meal === meal && addingTo.category === category;

                return (
                  <React.Fragment key={category}>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-3 font-medium text-gray-800 align-top w-40">
                        {category}
                      </td>
                      <td className="py-3 px-3 w-auto">
                        {items.length === 0 && !isAddingHere ? (
                          <span className="text-gray-400 text-sm">
                            No items yet
                          </span>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between bg-gray-50 rounded p-2"
                              >
                                {editingItem === item.id ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter")
                                        saveEdit(meal, item.id);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm text-gray-700 flex-1">
                                    {item.name}
                                  </span>
                                )}

                                <div className="flex items-center gap-1 ml-2">
                                  {editingItem === item.id ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(meal, item.id)}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditing(item)}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeItem(meal, item.id)
                                        }
                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}

                            {isAddingHere && (
                              <div className="flex items-center gap-2 bg-blue-50 rounded p-2">
                                <input
                                  type="text"
                                  value={newItemValue}
                                  onChange={(e) =>
                                    setNewItemValue(e.target.value)
                                  }
                                  placeholder="Enter item name..."
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter")
                                      addItem(meal, category);
                                    if (e.key === "Escape") cancelAdd();
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => addItem(meal, category)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelAdd}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top w-20 text-right">
                        <button
                          onClick={() => setAddingTo({ meal, category })}
                          disabled={isAddingHere}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Dashboard already renders headers and day-tabs; this component only shows the meal sections
  return (
    <div className="mt-4 w-full">
      <div className="space-y-6">
        <MealSection meal="breakfast" title="Breakfast" />
        <MealSection meal="lunch" title="Lunch" />
        <MealSection meal="dinner" title="Dinner" />
      </div>
    </div>
  );
};

export default MenuDashboard;
