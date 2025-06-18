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

const deleteHostel = async (req, res) => {
  try {
    const HostelId = req.params.hostelId;
    const deletedHostel = await Hostel.findByIdAndDelete(HostelId);
    if (!deletedHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    return res.status(200).json({ message: "Hostel deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const applyMessChange = async (req, res) => {
    const {hostel_name, roll_number, reason} = req.body;

    const today = new Date();

    const dayOfMonth = today.getDate();

    if (dayOfMonth < 24 || dayOfMonth > 27) {
        return res.status(403).json({message: "Mess change requests only allowed between 24th and 27th of a month"});
    }

    try {
        const hostel = await Hostel.findOne({'hostel_name': hostel_name});

        // console.log(hostel);
        // console.log(hostel.curr_cap);

        const user = await User.findOne({'rollNumber': roll_number});

        user.applied_hostel_string = hostel_name;

        user.mess_change_button_pressed = true;

        if (hostel != user.hostel && hostel.curr_cap < 150 && !user.applied_for_mess_changed) {

            //const user_permanent_hostel = await Hostel.findById(user.hostel);

            const user_curr_subscribed_mess = await Hostel.findById(user.curr_subscribed_mess);

            hostel.curr_cap = hostel.curr_cap + 1;

            user.next_mess = hostel._id;

           // user.curr_subscribed_mess = hostel._id;

            user.applied_for_mess_changed = true;

            user_curr_subscribed_mess.users.pull({user: user._id});

            hostel.users.push({user: user._id, reason_for_change: reason});
           // user_permanent_hostel.users.pull({user: user._id});

            await user.save();

            await hostel.save();

            await user_curr_subscribed_mess.save();

            //await user_permanent_hostel.save();

            return res.status(200).json({message: "Mess change request proceeded", status_code: 0});
        }
        else {
            // capacity reached

            await user.save();

            // await hostel.save();
            return res.status(200).json({message: "Sorry the cap has reached or you have already applied or you cannot apply for same hostel", status_code: 1});
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: "Error occured"});
    }
};  

module.exports = {
    createHostel,
    deleteHostel,
    getHostel,
    applyMessChange
}
