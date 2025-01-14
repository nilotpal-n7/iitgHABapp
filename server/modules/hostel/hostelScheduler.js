const schedule = require('node-schedule')

const nodemailer = require('nodemailer')

//const mongoose = require('mongoose')

const {Hostel} = require('./hostelModel.js')

const xlsx = require('xlsx')

const path = require('path')

require('dotenv').config();

// console.log(process.env.CLIENT_ID)
// console.log(process.env.OUTLOOK_PASS)

const authId = process.env.OUTLOOK_ID;
const authPass = process.env.OUTLOOK_PASS;
const name_id = process.env.NAME_ID;

// on saturday night sunday morning 12 am
const sundayScheduler = () => {
    schedule.scheduleJob('0 0 * * 0', async () => {
        try {
            const hostels = await Hostel.find({}).populate({
                path: 'users.user'
            });

            console.log(`Found ${hostels.length} hostels.`);

            hostels.forEach(async (hostel) => {
                console.log(`Hostel ${hostel.hostel_name}.`);

                for (const userWithTimeStamp of hostel.users) {
                    const user = userWithTimeStamp.user;

                    if (!user) continue;

                    user.curr_subscribed_mess = user.next_mess;
                    user.next_mess = user.hostel;

                    await user.save();
                }
            })
        } catch (err) {
            console.log(err);
        }
    })
}

// on wednesday night 0 0 0 * * 4 
// every 2 minutes */2 * * * *
const wednesdayScheduler = () => {
    schedule.scheduleJob('0 0 0 * * 4', async () => {

        try {
            const hostels = await Hostel.find({}).populate({
                path: 'users.user',
                populate: [
                    { 
                        path: 'hostel',
                        model: 'Hostel',
                        populate: {
                            path: 'users',
                            model: 'User'
                        },
                    },

                    {
                        path: 'curr_subscribed_mess',
                        model: 'Hostel',
                        populate: {
                            path: 'users',
                            model: 'User'
                        }
                    },
                ],
            });

            console.log(`Found ${hostels.length} hostels.`);

            hostels.forEach(async (hostel) => {
                console.log(`Hostel ${hostel.hostel_name}.`);
                
                hostel.curr_cap = 0;

                await hostel.save();

                const userData = [];

                //const updatedUsers = [];

                for (const userWithTimeStamp of hostel.users) {
                    const user = userWithTimeStamp.user;

                    if (!user) continue;

                    if (user.applied_for_mess_changed) {
                        user.applied_for_mess_changed = false;
                        user.got_mess_changed = true;
                    } else {
                        user.got_mess_changed = false;
                        if (user.hostel != user.curr_subscribed_mess) {
                            user.hostel.users.push({user: user._id});
                            user.curr_subscribed_mess.users.pull({user: user._id});
                        }
                        
                       // user.curr_subscribed_mess = user.hostel;
                    }

                    await user.save();
                }

                for (const userWithTimeStamp of hostel.users) {
                    const user = userWithTimeStamp.user;
                    //const timestamp = userWithTimeStamp.timestamp;

                    if (!user) continue;

                    userData.push({
                        Name: user.name,
                        Roll: user.rollNumber,
                        Hostel: user.hostel.hostel_name,
                    });

                    // if (user.applied_for_mess_changed) {
                    //     user.applied_for_mess_changed = false;
                    //     user.got_mess_changed = true;
                    //     updatedUsers.push(user);
                    // } 
                    // else {
                    //     // revert him back
                    //     user.got_mess_changed = false;
                    //     user.curr_subscribed_mess = user.hostel;
                    //     updatedUsers.push(user);
                    // }
                }

                // Generate the files
                const worksheet = xlsx.utils.json_to_sheet(userData)
                const workbook = xlsx.utils.book_new()
                xlsx.utils.book_append_sheet(workbook, worksheet, 'Subscribers')

                const outputDir = path.join(__dirname, 'output')
                const outputPath = path.join(outputDir, `${hostel.hostel_name}.xlsx`)

                require('fs').mkdirSync(outputDir, {recursive: true});
                xlsx.writeFile(workbook, outputPath);

                // for (const user of updatedUsers) {
                //     await user.save();
                // }
            });

            // send it to hab

            const transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: authId,
                    pass: authPass
                }
            });

            const mailOptions = {
                from: `"${name_id}" <${authId}>`,
                to: 's.shangpliang@iitg.ac.in', // send to hab
                subject: 'Mess Change List',
                text: 'PFA the mess change list for the upcoming week',
                attachments: [
                    {
                        filename: 'Lohit.xlsx',
                        path: path.join(__dirname, 'output', 'Lohit.xlsx')
                    },
                    {
                        filename: 'Umiam.xlsx',
                        path: path.join(__dirname, 'output', 'Umiam.xlsx')
                    },
                    {
                        filename: 'Manas.xlsx',
                        path: path.join(__dirname, 'output', 'Manas.xlsx')
                    },
                ]
            }

            const info = await transporter.sendMail(mailOptions);

            console.log('Email sent:', info.messageId);
        } catch (err) {
            console.log(err);
        }
        
        // go through all the hostels
            // create excel file for each hostel
            // for each hostel go through all the users 
                // if user applied for mess change then change applied variable to false and got variable to true
                // then push user to the excel file of that hostel
    });
};

module.exports = {
    wednesdayScheduler, sundayScheduler
}