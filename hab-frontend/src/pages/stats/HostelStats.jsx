import { DatePicker } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { getStatsByDate } from "../../apis/stats.js";
import dayjs from "dayjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import HostelInfo from "./HostelInfo.jsx";
import MealChart from "./MealChart.jsx";

ChartJS.register(ArcElement, Tooltip, Legend);

function HostelStats({ hostelId, hostelName, messId }) {
  const [date, setDate] = useState(`${dayjs().format("YYYY-MM-DD")}`);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      let data = await getStatsByDate(date, messId);
      setStats(data);
    };
    fetchData();
  }, [date, messId]);

  const makePieData = (label, eaten, colors) => {
    const notEaten = stats.total - eaten;
    return {
      labels: ["Eaten", "Not Eaten"],
      datasets: [
        {
          label,
          data: [eaten, notEaten],
          backgroundColor: colors,
          borderColor: ["#000", "#000"],
          borderWidth: 1,
        },
      ],
    };
  };

  const getPercentage = (mealCount) => {
    if (!stats || !stats.total) return "0%";
    const percent = (mealCount / stats.total) * 100;
    return `${percent.toFixed(1)}%`;
  };

  return (
    <>
      <div className="mt-6 min-h-full m-auto">
        <div className="m-auto p-1 min-h-screen max-w-300 shadow-md rounded-2xl bg-white">
          <div className="flex justify-between p-5 items-center bg-sky-200/75 rounded-2xl shadow-md">
            <h1 className="text-[28px] font-bold w-160">
              {hostelName} Statistics
            </h1>
            <DatePicker
              defaultValue={dayjs()}
              onChange={(date, dateString) => {
                setDate(dateString);
              }}
              placeholder="Pick a date"
            />
          </div>
          {stats.total ? (
            <div>
              <HostelInfo
                selectedHostel={{ hostel_name: hostelName, _id: hostelId }}
              />

              <p className="text-center text-lg font-medium mb-[15px] mt-[30px]">
                Total Students: {stats.total}
              </p>

              <div className="flex justify-around">
                <MealChart
                  title="Breakfast"
                  data={makePieData("Breakfast", stats.breakfast, [
                    "#EF4444",
                    "#FEF2F2",
                  ])}
                  percentage={getPercentage(stats.breakfast)}
                />

                <MealChart
                  title="Lunch"
                  data={makePieData("Lunch", stats.lunch, [
                    "#F59E0B",
                    "#FFFBEB",
                  ])}
                  percentage={getPercentage(stats.lunch)}
                />

                <MealChart
                  title="Dinner"
                  data={makePieData("Dinner", stats.dinner, [
                    "#10B981",
                    "#ECFDF5",
                  ])}
                  percentage={getPercentage(stats.dinner)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-30">
              <ExclamationCircleOutlined className="!text-red-500 text-8xl mb-6" />
              <div className="font-semibold text-5xl text-gray-600">
                This Date has no Stats!
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HostelStats;
