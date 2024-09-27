const Item = require('./itemModel');

const getComplaintsOfItemsByHostel = async (req, res) => {
    const { hostel } = req.params;
    try {
        const complaints = await Item.find({ 'hostel': hostel }, 'complaints'); // Gets only the complaints of all items in a hostel
        res.status(200).json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching complaints' });
    }
    
}; // This function may be used by hab to get the complaints of all items in a hostel or by secy to get all complaints of all items in their hostel

const createItem = async (req, res) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error creating item', error: err });
        console.log(err);
    }
};

const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedItem = await Item.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(deletedItem);
    } catch (err) {
        res.status(500).json({ message: 'Error deleting item' });
    }
};

const updateItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Item.findByIdAndUpdate(id, req.body, { new: true });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating item' });
    }
};
const getItems = async (req, res) => {
    try {
        const items = await Item.find({});
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching items' });
    }
};

const getItem = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching item' });
    }
}

module.exports = {
    getComplaintsOfItemsByHostel,
    createItem,
    deleteItem,
    updateItem,
    getItems,
    getItem
};