const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

const { 
    ActivityType, 
    Client, 
    Collection, 
    Events, 
    GatewayIntentBits, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ComponentType 
} = require('discord.js');

const { getOrCreateUser, incCmdCounter } = require("./db/userHelper");

const colors = require("colors");

const admin = require("firebase-admin");
const serviceAccount = require("./firebaseAdminConfig.json");

const { config } = require('dotenv');
const { default: axios } = require("axios");
config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`The command at ${filePath} is missing "data" and/or "execute" properties`);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        const userData = await getOrCreateUser(interaction.user.id, process.env.GUILD_ID);
        await command.execute(interaction, userData);
        await incCmdCounter(interaction.user.id, process.env.GUILD_ID);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isAutocomplete()) return;
    if (interaction.commandName !== "caixa") return;

    const focusedValue = interaction.options.getFocused();

    let apiJson;

    const csApi = axios.create({
        baseURL: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/'
    });

    await csApi.get('crates.json')
        .then((response) => {
            apiJson = response.data;
        })
        .catch((err) => {
            console.log(`Ocorreu um erro: ${err}`);
        });

    const filteredChoices = apiJson.filter((caixa) => caixa.name.toLowerCase().startsWith(focusedValue.toLowerCase()));

    const results = filteredChoices.map((choice) => {
        return {
            name: choice.name,
            value: choice.id
        }
    });

    interaction.respond(results.slice(0, 25)).catch(() => { });
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`.yellow);
    client.user.setActivity('como rebola lentinho', { type: ActivityType.Watching });
});

async function serverConnectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Successfully connected to the MongoDB!".green);
    } catch (err) {
        console.log(`Error connecting to MongoDB: ${err}`);
    }
}

async function serverConnectFirebase() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log("Successfully connected to the Firebase!".green);
}

serverConnectMongoDB();
serverConnectFirebase();

client.login(process.env.TOKEN);