const schedule = require("node-schedule");
const Leave = require("./leaveModel.js");
const { User } = require("../user/userModel.js");


const initializeMessRebateAutoScheduler = async () => {
    // schedule.scheduleJob("0 1 * * *", async () => {
        const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0);
        const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 0, 0, 0, 0);
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
        const NotRejectedNorResolvedApplications = await Leave.find({
            resolved: false,
            status: {
                $in: ["pending", "approved"]
            }
        }).sort({
            appliedAt: -1,
        }).lean();

        console.log("Not Rejected Nor Resolved Applications");
        console.log(NotRejectedNorResolvedApplications);


        // FOR TAKING AWAY SCANNER PERMISSION AT THE START
        {
            const to_check = NotRejectedNorResolvedApplications.filter(app => {
                return today <= app.startDate && app.startDate < tomorrow;
            });

            const user_ids = to_check.map((application) => {return application.user});

            const users_with_restricted_scanner = await User.find({
                _id: {
                    $in: user_ids
                }
            });

            users_with_restricted_scanner.forEach((user) => {
                user.set({
                    scannerPermission: false
                })
            })

        }


        // FOR GIVING BACK SCANNER PERMISSION AT THE END
        {
            // This filters the existing array in memory
            const to_check = NotRejectedNorResolvedApplications.filter(app => {
                // const appDate = new Date(app.startDate);
                return yesterday <= app.endDate && app.endDate < today;
            });

            console.log("CHECKING");
            console.log(to_check);

            const user_ids = to_check.map((application) => {return application.user});

            console.log("USER ID");
            console.log(user_ids);

            const users_with_restricted_scanner = await User.find({
                _id: {
                    $in: user_ids
                }
            });

            console.log("USERS");
            console.log(users_with_restricted_scanner);

            users_with_restricted_scanner.forEach((user) => {
                user.set({
                    scannerPermission: true
                })
            })

        }


    // })
}

module.exports = {
    initializeMessRebateAutoScheduler
};