// upload.js
const fs = require("fs");
// eslint-disable-next-line no-unused-vars
const path = require("path");
const csv = require("csv-parser");

// Import Mongoose Models
const UserAllocHostel = require("./hostelAllocModel");
const { Hostel } = require("./hostelModel");

async function uploadData(req, res) {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let processed = 0;
        let errors = 0;
        for (const row of results) {
          // Support different header names
          const rollRaw =
            row["Roll Number"] ||
            row["rollno"] ||
            row["rollNo"] ||
            row["roll"] ||
            row["Roll"] ||
            row["ROLL"];
          const hostelRaw =
            row["Hostel"] ||
            row["hostelName"] ||
            row["hostel"] ||
            row["HOSTEL"];

          const rollno = rollRaw ? String(rollRaw).trim() : "";
          const hostelName = hostelRaw ? String(hostelRaw).trim() : "";

          if (!rollno || !hostelName) {
            errors++;
            continue;
          }

          try {
            const hostel = await Hostel.findOne({ hostel_name: hostelName });
            if (!hostel) {
              // skip if hostel unknown
              errors++;
              continue;
            }

            await UserAllocHostel.findOneAndUpdate(
              { rollno: rollno },
              { rollno: rollno, hostel: hostel._id },
              { upsert: true, new: true, runValidators: true }
            );

            processed++;
          } catch (err) {
            console.error(`Error processing roll no ${rollno}:`, err.message);
            errors++;
          }
        }

        // cleanup temp file
        fs.unlink(filePath, () => {});

        return res
          .status(200)
          .json({ message: "Allocation upload completed", processed, errors });
      })
      .on("error", (err) => {
        console.error("CSV parse error", err);
        return res.status(500).json({ message: "CSV parse error" });
      });
  } catch (error) {
    console.error("Failed to upload allocation CSV:", error);
    return res.status(500).json({ message: "Failed to upload allocation CSV" });
  }
}

module.exports = { uploadData };
