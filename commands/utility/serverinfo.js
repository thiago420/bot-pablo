const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo").setDescription("Mostra as informações do servidor"),
    
    async execute(interaction, userData) {

        const { guild } = interaction;

        const serverInfoEmbed = new EmbedBuilder({
            title: guild.name,
            thumbnail: {
                url: guild.iconURL({ size: 256 })
            },
            fields: [
                { name: "ID", value: guild.id, inline: true },
                { name: "Dono", value: (await guild.fetchOwner()).user.tag, inline: true },
                { name: "Criado em", value: guild.createdAt.toDateString(), inline: true },
                { name: "Membros", value: guild.memberCount, inline: true },
                { name: "Canais de texto", value: guild.channels.cache.filter((c) => c.type === 0).toJSON().length, inline: true },
                { name: "Canais de voz", value: guild.channels.cache.filter((c) => c.type === 2).toJSON().length, inline: true },
                { name: "Cargos", value: guild.roles.cache.size, inline: true },
                { name: "Boosters", value: guild.premiumSubscriptionCount || "0", inline: true },
                { name: "Nível de boost", value: guild.premiumTier, inline: true },
                { name: "Emojis", value: guild.emojis.cache.size, inline: true },
                { name: "Lista de cargos", value: guild.roles.cache.toJSON().join(", ")},
            ],

            footer: {
                text: `ID: ${guild.id} | Criado em: ${guild.createdAt.toLocaleString()}`,
                iconURL: guild.iconURL({ size: 64 })
            }
        })

        await interaction.reply({ embeds: [serverInfoEmbed] });
    }
}