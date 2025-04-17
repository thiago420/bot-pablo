const User = require("../models/User");

async function getUser(userId, serverId) {
    let user = await User.findOne({
        userId,
        serverId
    });

    if (!user) {
        return null;
    }

    return user;
}

async function createUser(userId, serverId) {
    const user = new User({
        userId,
        serverId
    });
    await user.save();
}

async function getOrCreateUser(userId, serverId) {
    let user = await User.findOne({
        userId,
        serverId
    });

    if (!user) {
        user = new User({
            userId,
            serverId
        });
        await user.save();
    }

    return user;
}

async function incCmdCounter(userId, serverId) {
    await User.updateOne(
        {
            userId,
            serverId
        },
        {
            $inc: { commandCount: 1 }
        }
    );
}

async function addItemInv(userId, serverId, item) {
    await User.updateOne(
        {
            userId,
            serverId
        },
        {
            $push: {
                inventario: item
            }
        }
    );
}

module.exports = {
    getUser,
    createUser,
    getOrCreateUser,
    incCmdCounter,
    addItemInv
}