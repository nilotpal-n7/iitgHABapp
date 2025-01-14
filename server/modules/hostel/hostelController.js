const { User } = require('../user/userModel.js');
const { Hostel } = require ('./hostelModel.js')

const createHostel = async (req, res) => {
    try {
        const hostel = await Hostel.create(req.body)

        res.status(201).json({
            hostel,
            message: "Hostel created successfully"
        })
    } catch (err) {
        res.status(500).json({ message: 'Error creating hostel', error: err });
        console.log(err);
    }
};

const getHostel = async (req, res) => {
    const {hostel_name} = req.params;

    try {
        const hostel = await Hostel.findOne({'hostel_name': hostel_name});

        if (!hostel) {
            return res.status(400).json({message: "No such hostel"});
        }

        return res.status(200).json({message: "Hostel found", hostel: hostel});
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: "Error occured"});
    }
};

const applyMessChange = async (req, res) => {
    const {hostel_name, roll_number} = req.params;

    try {
        const hostel = await Hostel.findOne({'hostel_name': hostel_name});

        console.log(hostel);
        console.log(hostel.curr_cap);

        if (hostel.curr_cap < 150) {
            const user = await User.findOne({'rollNumber': roll_number});

            //const user_permanent_hostel = await Hostel.findById(user.hostel);

            const user_curr_subscribed_mess = await Hostel.findById(user.curr_subscribed_mess);

            hostel.curr_cap = hostel.curr_cap + 1;

            user.next_mess = hostel._id;

           // user.curr_subscribed_mess = hostel._id;

            user.applied_for_mess_changed = true;

            user_curr_subscribed_mess.users.pull({user: user._id});

            hostel.users.push({user: user._id});
           // user_permanent_hostel.users.pull({user: user._id});

            await user.save();

            await hostel.save();

            //await user_permanent_hostel.save();

            return res.status(200).json({message: "Mess change request proceeded", status_code: 0});
        }
        else {
            // capacity reached

            return res.status(200).json({message: "Sorry the cap has reached", status_code: 1});
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: "Error occured"});
    }
};  

module.exports = {
    createHostel,
    getHostel,
    applyMessChange
}