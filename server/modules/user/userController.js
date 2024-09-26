const User = require('./userModel.js');

const getUserData = async (req, res) => {
    const { outlook } = req.params;

    try {
        const user = await User.find({'outlookID': outlook});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error creating user' });
    }
};

const deleteUser = async (req, res) => {
    const { outlook } = req.params;
    try {
        const deletedUser = await User.findOneAndDelete({ 'outlookID': outlook });
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(deletedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
const updateUser = async (req, res) => {
    const { outlook } = req.params;

    try {
        const updatedUser = await User.findOneAndUpdate({ 'outlookID': outlook }, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

const getUserComplaints = async (req, res) => {
    const { outlook } = req.params;
    try {
        const user = await User.findOne({ 'outlookID': outlook }, 'complaints');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user complaints' });
    }
};

module.exports = {
    getUserData,
    createUser,
    deleteUser,
    updateUser,
    getUserComplaints
};