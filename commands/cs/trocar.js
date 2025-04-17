const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChatInputCommandInteraction
} = require("discord.js");
const { getOrCreateUser } = require("../../db/userHelper");
const { default: axios } = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("trocar")
        .setDescription("Trocar itens com outros usuários")
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Escolha o usuário que você deseja trocar itens!')
                .setRequired(true)
        ),

    async execute(interaction, userData) {
        let user = interaction.user;
        let userForTrade = interaction.options.getUser("usuario");
        let counterOfferUser = null;

        if (user.id === userForTrade.id) {
            return interaction.reply({ content: "Você não pode trocar itens consigo mesmo!", flags: MessageFlags.Ephemeral });
        }

        if (userForTrade.bot) {
            return interaction.reply({ content: "Você não pode trocar itens com um Bot!", flags: MessageFlags.Ephemeral });
        }

        async function getInv(id) {
            let user = await getOrCreateUser(id, interaction.guild.id);
            let inventario = user.inventario;

            return inventario;
        }

        if (await getInv(user.id) <= 0) {
            return interaction.reply({
                content: "Você não possui itens no inventário para trocar!",
                flags: MessageFlags.Ephemeral
            });
        } else if (await getInv(userForTrade.id) <= 0) {
            return interaction.reply({
                content: `O usuário ${userForTrade} não possui itens no inventário para trocar!`,
                flags: MessageFlags.Ephemeral
            });
        }

        async function getItem(id, index) {
            let user = await getOrCreateUser(id, interaction.guild.id);
            let inventario = user.inventario;

            return inventario[index];
        }

        async function getInvText(id, maximun, skip) {

            let user = await getOrCreateUser(id, interaction.guild.id);
            let inventario = user.inventario;

            let texto = "";

            for (i = 0 + skip; i < skip + maximun; i++) {
                try {
                    texto += "- " + inventario[i].name + "\n";
                } catch {
                    break;
                }
            }

            return texto;
        }

        async function getInvArray(id, maximun, skip) {

            let user = await getOrCreateUser(id, interaction.guild.id);
            let inventario = user.inventario;

            let array = [];

            for (i = 0 + skip; i < skip + maximun; i++) {
                try {
                    array.push({
                        id: inventario[i].id,
                        label: inventario[i].name,
                        description: `Inspecionar ${inventario[i].name}`,
                        value: inventario.indexOf(inventario[i])
                    });
                } catch {
                    break;
                }
            }

            return array;
        }

        async function getInvMaximunPage(id, sizePage) {
            let user = await getOrCreateUser(id, interaction.guild.id);
            let inventario = user.inventario;

            let maximun = 0;

            for (i = 1; i <= inventario.length; i += sizePage) {
                maximun++;
            }

            return maximun;
        }

        user.confirmTrade = false;
        userForTrade.confirmTrade = false;

        const confirm = new ButtonBuilder()
            .setCustomId("confirmButton")
            .setLabel("Confirmar")
            .setStyle(ButtonStyle.Success);

        const recuse = new ButtonBuilder()
            .setCustomId("recuseButton")
            .setLabel("Recusar")
            .setStyle(ButtonStyle.Danger);

        const counterOffer = new ButtonBuilder()
            .setCustomId("counterOfferButton")
            .setLabel("Contraproposta")
            .setStyle(ButtonStyle.Primary);

        const buttonRow = new ActionRowBuilder().addComponents(confirm, recuse, counterOffer);

        const reply = await interaction.reply({
            components: [buttonRow],
            content: `${user} quer trocar itens com ${userForTrade}.\n\nSituação da troca: Aguardando confirmação`
        });

        // await userForTrade.send(`Você recebeu uma solicitação de troca de ${user}, no canal ${interaction.channel}.`);

        const filter = (i) => i.user.id === user.id || i.user.id === userForTrade.id;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter
        });

        collector.on("collect", async (i) => {
            if (i.customId === 'confirmButton') {
                if (i.user.id === userForTrade.id) {
                    // userForTrade.confirmTrade = !userForTrade.confirmTrade;
                    await interaction.editReply({
                        components: [],
                        content: `${userForTrade} aceitou a troca de ${user}.\n\nSituação da troca: Confirmada`
                    });

                    await i.deferUpdate();
                }
            } else if (i.customId === 'recuseButton') {
                if (i.user.id === userForTrade.id) {
                    await interaction.editReply({
                        components: [],
                        content: `${userForTrade} recusou a troca de ${user}.\n\nSituação da troca: Recusada`
                    });

                    await i.deferUpdate();
                }
            } else if (i.customId === 'counterOfferButton') {
                if (i.user.id === userForTrade.id) {

                }
            }
        });
    }
}