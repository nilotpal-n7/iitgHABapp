const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Papa = require("papaparse");
const { Hostel } = require("../modules/hostel/hostelModel.js");
const { User } = require("../modules/user/userModel.js");

const mongoUri = process.env.MONGODB_URI;
const csvPath = path.resolve(
  __dirname,
  "../hostel_office_secretary_emails_from_images - hostel_office_secretary_emails_from_images.csv",
);

function normalizeHostelName(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\(boys\)|\(girls\)/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function loadCsvRows(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  }

  return parsed.data;
}

async function printHostelList(title) {
  const hostels = await Hostel.find({}).sort({ hostel_name: 1 }).lean();

  console.log(`\n=== ${title} ===\n`);
  for (const hostel of hostels) {
    console.log(`Hostel: ${hostel.hostel_name}`);
    console.log(`- Hostel office email: ${hostel.microsoft_email || "N/A"}`);
    console.log(`- Hostel secretary email: ${hostel.secretary_email || "N/A"}`);
  }
}

async function applyCsvUpdates(filePath) {
  const rows = loadCsvRows(filePath);
  const hostels = await Hostel.find({});

  const byExact = new Map();
  const byNormalized = new Map();

  for (const hostel of hostels) {
    byExact.set(hostel.hostel_name.toLowerCase(), hostel);
    byNormalized.set(normalizeHostelName(hostel.hostel_name), hostel);
  }

  let updatedCount = 0;
  let unmatchedCount = 0;

  console.log(`\nReading updates from: ${filePath}\n`);

  for (const row of rows) {
    const csvHostelName = (row.hostel || "").trim();
    const officeEmail = (row.office_email || "").trim();
    const secretaryEmail = (row.secretary_email || "").trim();

    if (!csvHostelName) {
      continue;
    }

    let hostel = byExact.get(csvHostelName.toLowerCase());
    if (!hostel) {
      hostel = byNormalized.get(normalizeHostelName(csvHostelName));
    }

    if (!hostel) {
      unmatchedCount += 1;
      console.log(`No DB match for CSV hostel: ${csvHostelName}`);
      continue;
    }

    let changed = false;

    if (officeEmail && hostel.microsoft_email !== officeEmail) {
      hostel.microsoft_email = officeEmail;
      changed = true;
    }

    if (secretaryEmail && hostel.secretary_email !== secretaryEmail) {
      hostel.secretary_email = secretaryEmail;
      changed = true;
    }

    if (changed) {
      await hostel.save();
      updatedCount += 1;
      console.log(`Updated: ${hostel.hostel_name}`);
    } else {
      console.log(`No change: ${hostel.hostel_name}`);
    }
  }

  console.log(
    `\nUpdate summary: ${updatedCount} updated, ${unmatchedCount} unmatched CSV rows.\n`,
  );
}

async function printSmcCountsByHostel(title) {
  const hostels = await Hostel.find({}).sort({ hostel_name: 1 }).lean();
  const smcCounts = await User.aggregate([
    { $match: { isSMC: true } },
    { $group: { _id: "$hostel", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    smcCounts.map((entry) => [String(entry._id), entry.count]),
  );

  let total = 0;
  console.log(`\n=== ${title} ===\n`);
  for (const hostel of hostels) {
    const count = countMap.get(String(hostel._id)) || 0;
    total += count;
    console.log(`${hostel.hostel_name}: ${count}`);
  }
  console.log(`Total SMC members: ${total}\n`);
}

async function removeAllSmcMembers() {
  const result = await User.updateMany(
    { isSMC: true },
    { $set: { isSMC: false } },
  );
  const modified = result.modifiedCount ?? result.nModified ?? 0;
  console.log(`Removed SMC flag from ${modified} user(s).`);
}

async function printHostelSmcContacts() {
  if (!mongoUri) {
    console.error("MONGODB_URI is missing in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    await printHostelList("Current Hostel Office + Secretary Emails (Before)");
    await applyCsvUpdates(csvPath);
    await printHostelList("Hostel Office + Secretary Emails (After)");

    await printSmcCountsByHostel(
      "Number of SMC Members in Each Hostel (Before Removal)",
    );
    await removeAllSmcMembers();
    await printSmcCountsByHostel(
      "Number of SMC Members in Each Hostel (After Removal)",
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to print hostel SMC contacts:", error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

printHostelSmcContacts();
