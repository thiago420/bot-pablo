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
    StringSelectMenuOptionBuilder
} = require("discord.js");
const { getOrCreateUser } = require("../../db/userHelper");
const { default: axios } = require("axios");
const nodecallspython = require("node-calls-python");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inventario")
        .setDescription("Mostra o inventário do usuário")
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Escolha o usuário que você deseja ver o inventário!')
                .setRequired(false)
        ),

    async execute(interaction, userData) {

        const py = nodecallspython.interpreter;

        let user;
        let userId;

        if (interaction.options.getUser("usuario")) {
            user = interaction.options.getUser("usuario");
            userId = interaction.options.getUser("usuario").id;
        } else {
            user = interaction.user;
            userId = interaction.user.id;
        }

        async function getInv() {
            let user = await getOrCreateUser(userId, interaction.guild.id);
            let inventario = user.inventario;

            return inventario;
        }

        async function getItem(index) {
            let user = await getOrCreateUser(userId, interaction.guild.id);
            let inventario = user.inventario;

            return inventario[index];
        }

        async function getInvText(maximun, skip) {

            let user = await getOrCreateUser(userId, interaction.guild.id);
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

        async function getInvArray(maximun, skip) {

            let user = await getOrCreateUser(userId, interaction.guild.id);
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

        async function getInvMaximunPage(sizePage) {
            let user = await getOrCreateUser(userId, interaction.guild.id);
            let inventario = user.inventario;

            let maximun = 0;

            for (i = 1; i <= inventario.length; i += sizePage) {
                maximun++;
            }

            return maximun;
        }

        if (await getInv() <= 0) {
            return interaction.reply({
                content: userId === interaction.user.id
                    ? "Você não possui itens no inventário!"
                    : `${user} não possui itens no inventário!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder({
            customId: `modal-${interaction.user.id}`,
            title: "Selecionar página"
        });

        const number = new TextInputBuilder({
            customId: "numberInput",
            label: "Número da página",
            style: TextInputStyle.Short,
            placeholder: "Ex: 1"
        });

        const backward = new ButtonBuilder()
            .setCustomId("backwardButton")
            .setLabel("Voltar")
            .setStyle(ButtonStyle.Primary);

        const selectPage = new ButtonBuilder()
            .setCustomId("selectPageButton")
            .setLabel("Selecionar")
            .setStyle(ButtonStyle.Primary);

        const forward = new ButtonBuilder()
            .setCustomId("forwardButton")
            .setLabel("Próximo")
            .setStyle(ButtonStyle.Primary);

        let selectMenuRow;

        let page = 0;

        async function updateSelectMenu() {
            let array = await getInvArray(10, 10 * page);

            let number = 1;

            selectMenuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(interaction.id)
                    .setPlaceholder("Selecione uma skin para inspecionar...")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(
                        array.map(option =>
                            new StringSelectMenuOptionBuilder()
                                .setLabel(option.label)
                                .setDescription(option.description)
                                .setValue(`id(${number++}) value(${option.id})`)
                        )
                    )
            );
        }

        await updateSelectMenu();

        const buttonRow = new ActionRowBuilder().addComponents(backward, forward, selectPage);

        const modalRow = new ActionRowBuilder().addComponents(number);

        modal.addComponents(modalRow);

        let color = parseInt("5865F2", 16);

        const reply = await interaction.reply({
            content: `${interaction.user}`, components: [buttonRow, selectMenuRow], embeds: [{
                color,
                title: `Inventário [${user.globalName || user.username}]`,
                description: `${await getInvText(10, 10 * page)}`,
                footer: {
                    text: `Página ${page + 1}/${await getInvMaximunPage(10)}`
                }
            }]
        });

        const filter = (i) => i.user.id === interaction.user.id;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter
        });

        const collector2 = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter
        });

        async function atualizarEmbed() {
            await updateSelectMenu();
            await interaction.editReply({
                content: `${interaction.user}`, components: [buttonRow, selectMenuRow], embeds: [{
                    color,
                    title: `Inventário [${user.globalName || user.username}]`,
                    description: `${await getInvText(10, 10 * page)}`,
                    footer: {
                        text: `Página ${page + 1}/${await getInvMaximunPage(10)}`
                    }
                }]
            });
        }

        collector.on("collect", async (i) => {
            const maximunPage = await getInvMaximunPage(10);

            if (i.customId === "backwardButton") {
                page = (page + maximunPage - 1) % maximunPage;
                await i.deferUpdate();
                atualizarEmbed();
            } else if (i.customId === "forwardButton") {
                page = (page + 1) % maximunPage;
                await i.deferUpdate();
                atualizarEmbed();
            } else if (i.customId === "selectPageButton") {
                await i.showModal(modal);

                await i.awaitModalSubmit({ filter, time: 20_000 }).then(async (mi) => {
                    const input = ((await mi.fields.getTextInputValue("numberInput").replace(/\D/g, '')) * 1) - 1;

                    if (input >= 0 && input < maximunPage) {
                        page = input;
                        await mi.deferUpdate();
                        atualizarEmbed();
                    } else {
                        await mi.reply({
                            content:
                                maximunPage === 1
                                    ? "Número inválido. O número de paginas é de 1"
                                    : `Número inválido. O número de paginas é de 1 até ${maximunPage}`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }).catch(() => {
                    console.error("Modal submission timed out or failed.");
                });
            }
        });

        collector2.on("collect", async (i) => {
            try {
            if (!i.values.length) {
                i.reply({
                    content: "Suas seleções estão vazias!",
                    flags: MessageFlags.Ephemeral
                });
                return;
            };

            // let item = await getItem(i.values);

            let apiJson;

            const csApi = axios.create({
                baseURL: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/'
            });

            await csApi.get('skins.json')
                .then((response) => {
                    apiJson = response.data;
                })
                .catch((err) => {
                    console.log(`Ocorreu um erro: ${err}`);
                });

            const item = await apiJson.find((e) => e.id === i.values[0].match(/value\((.*?)\)/)?.[1]);

            let rarity;

            switch (item.rarity.id) {
                case 'rarity_common_weapon':
                    rarity = 1;
                    break;
                case 'rarity_uncommon_weapon':
                    rarity = 2;
                    break;
                case 'rarity_rare_weapon':
                    rarity = 3;
                    break;
                case 'rarity_mythical_weapon':
                    rarity = 4;
                    break;
                case 'rarity_legendary_weapon':
                    rarity = 5;
                    break;
                case 'rarity_ancient_weapon':
                    rarity = 6;
                    break;
                case 'rarity_ancient':
                    rarity = 6;
                    break;
                case 'rarity_contraband_weapon':
                    rarity = 7;
                    break;
            }
            let link;

            await py.import("./python/main.py").then(async function (pymodule) {
                link = await py.call(pymodule, "link", item.weapon.weapon_id, parseInt(item.paint_index), 0, 0, rarity);
            });

            const buttonLink = new ButtonBuilder()
                .setURL(`https://thiago420.github.io/bot-pablo-web/inspectRedirector/inspect.html?url=${link.match(/steam:\/\/rungame\/730\/76561202255233023\/\+csgo_econ_action_preview%20([A-Za-z0-9]+)/)[1]}`)
                .setLabel("Inspecionar no jogo")
                .setStyle(ButtonStyle.Link);

            const replyRow = new ActionRowBuilder().addComponents(buttonLink);

            i.reply({
                content: `${item.name}\nComando para inspecionar: csgo_econ_action_preview ${link.match(/steam:\/\/rungame\/730\/76561202255233023\/\+csgo_econ_action_preview%20([A-Za-z0-9]+)/)[1]}`,
                files: [item.image],
                components: [replyRow],
                flags: MessageFlags.Ephemeral
            });

            atualizarEmbed();

        } catch(error) {
            console.log(error);
            await interaction.followUp({
                content: 'Ocorreu um erro',
                flags: MessageFlags.Ephemeral
            })
        }
        });
    }
}