const User = require("../../models/userSchema");
const mongoose =  require("mongoose");

const bcrypt = require("bcrypt");



// List Users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Block User
app.post('/users/:id/block', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.isBlocked = true;
        await user.save();
        res.json({ message: 'User blocked successfully', user });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Unblock User
app.post('/users/:id/unblock', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.isBlocked = false;
        await user.save();
        res.json({ message: 'User unblocked successfully', user });
    } catch (error) {
        res.status(500).send(error.message);
    }
});
