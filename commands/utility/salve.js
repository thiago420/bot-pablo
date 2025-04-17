const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("salve").setDescription("Ganha um salve do Pablo Gamer Oficial 2013"),
    
    async execute(interaction, userData) {
        await interaction.reply(`Salve ${interaction.user} 😎! Você usou ${userData.commandCount} comandos.`);
    }
}