const {
    Client,
    Attachment,
    SlashCommandBuilder,
    Events,
    MessageFlags,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Colors
} = require("discord.js");

const { addItemInv } = require("../../db/userHelper");

const functions = require("firebase-functions");

const fs = require("fs");

const colors = require("colors");

const { onDocumentWritten, onDocumentCreated, onDocumentUpdated, onDocumentDeleted, Change, FirestoreEvent } = require("firebase-functions/v2/firestore");

const admin = require("firebase-admin");

const { default: axios } = require("axios");
const { json } = require("node:stream/consumers");

function gerarStringAleatoria(tamanho) {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let resultado = "";

    for (let i = 0; i < tamanho; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        resultado += caracteres[indiceAleatorio];
    }

    return resultado;
}

function gerarCodigoRequest(tamanho) {
    const numeros = "0123456789";
    let resultado = "";

    for (let i = 0; i < tamanho; i++) {
        const indiceAleatorio = Math.floor(Math.random() * numeros.length);
        resultado += numeros[indiceAleatorio];
    }

    return resultado;
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("caixa")
        .setDescription("Opções para caixa")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("abrir")
                .setDescription("Abrir uma caixa de CS2")
                .addStringOption(option =>
                    option.setName('caixa')
                        .setDescription('Caixas para escolher')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('modo')
                        .setDescription('Modo de abertura')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Discord', value: "true" },
                            { name: 'Web', value: "false" }
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("visualizar")
                .setDescription("Visualizar uma caixa de CS2")
                .addStringOption(option =>
                    option.setName('caixa')
                        .setDescription('Caixas para escolher')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async execute(interaction) {

        const db = admin.firestore();

        const wait = require('node:timers/promises').setTimeout;

        let exampleEmbed = null;

        let caixa = null;
        let caixaImage = null;
        let tipoCaixa = null;
        let pronomeCaixa = null;

        let itemSelecionado = null;

        // link = "crates.json";
        // const api = await fetch("https://bymykel.github.io/CSGO-API/api/en/" + link);
        // const apiJson = await api.json();

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

        const targetCaixaId = interaction.options.getString("caixa");
        const caixaSelecionada = apiJson.find((e) => e.id === targetCaixaId)

        switch (caixaSelecionada.type) {
            case "Case":
                tipoCaixa = "caixa";
                pronomeCaixa = "a";
                break;
            case "Souvenir":
                tipoCaixa = "pacote souvenir";
                pronomeCaixa = "o";
                break;
            case "Sticker Capsule":
                tipoCaixa = "cápsula de adesivos";
                pronomeCaixa = "a";
                break;
            case "Autograph Capsule":
                tipoCaixa = "cápsula de adesivos";
                pronomeCaixa = "a";
                break;
            case "Graffiti":
                tipoCaixa = "caixa de grafite";
                pronomeCaixa = "a";
                break;
            case "Pins":
                tipoCaixa = "cápsula de broches";
                pronomeCaixa = "a";
                break;
            case "Music Kit Box":
                tipoCaixa = "caixa de trilhas sonoras";
                pronomeCaixa = "a";
                break;
            case "Patch Capsule":
                tipoCaixa = "pacote de emblemas";
                pronomeCaixa = "o";
                break;
            default:
                tipoCaixa = "caixa"
                pronomeCaixa = "a";
                break;
        }

        const subcommand = interaction.options.getSubcommand();

        async function getCaixaText(maximun, skip) {
            let texto = "";

            for (i = 0 + skip; i < skip + maximun; i++) {
                try {
                    texto += "- " + caixaSelecionada.contains[i].name + "\n";
                } catch {
                    break;
                }
            }

            return texto;
        }

        async function getCaixaMaximunPage(sizePage) {
            let maximun = 0;

            for (i = 1; i <= caixaSelecionada.contains.length; i += sizePage) {
                maximun++;
            }

            return maximun;
        }

        if (subcommand === "visualizar") {

            let page = 0;

            const backward = new ButtonBuilder()
                .setCustomId("backwardButonBox")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Primary);

            const forward = new ButtonBuilder()
                .setCustomId("forwardButonBox")
                .setLabel("Próximo")
                .setStyle(ButtonStyle.Primary);

            const buttonLink = new ButtonBuilder()
                .setURL(`https://thiago420.github.io/botPabloWeb/webCase/visualizerCase/visualizer.html?id=${caixaSelecionada.id}`)
                .setLabel("Visualizar caixa no navegador")
                .setStyle(ButtonStyle.Link);

            const noPageButtonRow = new ActionRowBuilder().addComponents(buttonLink);

            const pageButtonRow = new ActionRowBuilder().addComponents(backward, forward, buttonLink);

            textoItens = "";

            if (caixaSelecionada.contains.length <= 25) {
                for (i = 0; i < caixaSelecionada.contains.length; i++) {
                    textoItens += `- ${caixaSelecionada.contains[i].name}\n`;
                }

                if (caixaSelecionada.contains_rare.length > 0) {
                    textoItens += "- Item Raro\n";
                }

                embed = {
                    title: caixaSelecionada.name,
                    description: `${textoItens}`,
                    thumbnail: {
                        url: caixaSelecionada.image,
                    },
                };

                return interaction.reply({ content: `${interaction.user}`, embeds: [embed], components: [noPageButtonRow] });
            }

            embed = {
                title: caixaSelecionada.name,
                description: `${await getCaixaText(25, 25 * page)}`,
                thumbnail: {
                    url: caixaSelecionada.image,
                },
                footer: {
                    text: `Página ${page + 1}/${await getCaixaMaximunPage(25)}`
                }
            };

            const reply = await interaction.reply({ content: `${interaction.user}`, embeds: [embed], components: [pageButtonRow] });

            const filter = (i) => i.user.id === interaction.user.id;

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter
            });

            collector.on("collect", async (i) => {
                let maximunPage = await getCaixaMaximunPage(25);

                if (i.customId === "backwardButonBox") {
                    page = (page + maximunPage - 1) % maximunPage;
                    await i.deferUpdate();
                } else if (i.customId === "forwardButonBox") {
                    page = (page + 1) % maximunPage;
                    await i.deferUpdate();
                }

                await interaction.editReply({
                    content: `${interaction.user}`, components: [pageButtonRow], embeds: [{
                        title: caixaSelecionada.name,
                        description: `${await getCaixaText(25, 25 * page)}`,
                        thumbnail: {
                            url: caixaSelecionada.image,
                        },
                        footer: {
                            text: `Página ${page + 1}/${await getCaixaMaximunPage(25)}`
                        }
                    }]
                });
            });

            return;
        }

        for (i = 0; i < apiJson.length; i++) {
            if (apiJson[i].id === caixaSelecionada.id) {

                if (apiJson[i].contains.length <= 0) {
                    return await interaction.reply({ content: `${interaction.user} ${pronomeCaixa.toUpperCase()} ${tipoCaixa} **${apiJson[i].name}** não possui itens, tente outr${pronomeCaixa} ${tipoCaixa}!`, files: [apiJson[i].image] });
                }

                if (Math.floor(Math.random() * 10) != 7) {
                    let random = Math.floor(Math.random() * apiJson[i].contains.length);

                    itemSelecionado = apiJson[i].contains[random];

                    itemSelecionado.isRare = false;

                    caixa = apiJson[i].name;
                    caixaImage = apiJson[i].image;

                    let cor = parseInt(apiJson[i].contains[random].rarity.color.replaceAll("#", ""), 16);

                    exampleEmbed = {
                        color: cor,
                        title: apiJson[i].contains[random].name,
                        description: `${interaction.user} tirou **${apiJson[i].contains[random].name}** n${pronomeCaixa} ${tipoCaixa} **${apiJson[i].name}**.`,
                        image: {
                            url: apiJson[i].contains[random].image,
                        },
                    };
                } else {
                    let random = Math.floor(Math.random() * apiJson[i].contains_rare.length);

                    itemSelecionado = apiJson[i].contains_rare[random];

                    itemSelecionado.isRare = true;

                    caixa = apiJson[i].name;
                    caixaImage = apiJson[i].image;

                    let cor = parseInt(apiJson[i].contains_rare[random].rarity.color.replaceAll("#", ""), 16);

                    exampleEmbed = {
                        color: cor,
                        title: apiJson[i].contains_rare[random].name,
                        description: `${interaction.user} tirou **${apiJson[i].contains_rare[random].name}** n${pronomeCaixa} ${tipoCaixa} **${apiJson[i].name}**.`,
                        image: {
                            url: apiJson[i].contains_rare[random].image,
                        },
                    };
                }
            }
        }

        let mode = interaction.options.getString("modo") === "true" ? true : false;

        if (mode) {
            let requestCode = gerarCodigoRequest(6);
            let requestTime = new Date().toLocaleString();
            await interaction.reply({ content: `Abrindo ${pronomeCaixa} ${tipoCaixa} **${caixa}**...`, files: [caixaImage] });

            console.log(`[#${requestCode}] New request to open a case in discord mode, requested by ${interaction.user.username} (${interaction.user.id})`.magenta);

            await wait(3_000);

            await interaction.followUp({ content: `${interaction.user}`, embeds: [exampleEmbed] });

            console.log(`[#${requestCode}] The case has been opened, request ended`.magenta);

            let log = `[#${requestCode}] \nuser: ${interaction.user.username} (${interaction.user.id}) \ncase: ${caixa} \nitem: ${itemSelecionado.name} \nmode: Discord \nrequestedAt: ${requestTime} \nopenedAt: ${new Date().toLocaleString()}`;

            fs.writeFileSync("./logs/logCases.txt", `${log}\n\n`, { flag: "a" }, (err) => {
                console.log(err.message);
            });

            addItemInv(interaction.user.id, "941000363459350548", itemSelecionado);
        } else {
            let requestCode = gerarCodigoRequest(6);

            const codigo16 = gerarStringAleatoria(16);

            itemSelecionado.idCaixa = caixaSelecionada.id;
            itemSelecionado.nameCaixa = caixaSelecionada.name;
            itemSelecionado.imageCaixa = caixaSelecionada.image;

            await db.collection("botPablo").doc(codigo16).set(itemSelecionado);

            const buttonLink = new ButtonBuilder()
                .setURL(`https://thiago420.github.io/botPabloWeb/webCase/rouletteCase/roulette.html?id=${codigo16}`)
                .setLabel("Abrir caixa no navegador")
                .setStyle(ButtonStyle.Link);

            const replyRow = new ActionRowBuilder().addComponents(buttonLink);

            await interaction.reply({ content: `Abra a caixa em seu navegador!\nO código irá expirar em: <t:${(Math.floor(+new Date() / 1000)) + 60}:R>\nID: ${codigo16}`, components: [replyRow], flags: MessageFlags.Ephemeral });

            // await interaction.reply({ content: `Abra a caixa em seu navegador!\n**LINK:** https://thiago420.github.io/botPabloWeb/webRoulette/roulette.html?id=${codigo16}\nO código irá expirar em: <t:${(Math.floor(+new Date() / 1000)) + 60}:R>`, flags: MessageFlags.Ephemeral });

            let userOpenedCase = false;
            let requestTime = new Date().toLocaleString();

            console.log(`[#${requestCode}] New request to open a case in web mode, requested by ${interaction.user.username} (${interaction.user.id})`.magenta);

            for (let i = 1; i <= 12; i++) {

                const doc = await db.collection("botPablo").doc(codigo16).get();

                if (!doc.exists) {
                    console.log(`[#${requestCode}] [${i}/12 Attempt]: Opened`.magenta);
                    break;
                }

                console.log(`[#${requestCode}] [${i}/12 Attempt]: Not opened`.magenta);
                await wait(5_000);
            }

            const doc = await db.collection("botPablo").doc(codigo16).get();

            if (doc.exists) {
                await db.collection("botPablo").doc(codigo16).delete();
                console.log(`[#${requestCode}] The user didn't opened the case, opening case automatically`.magenta);
            } else {
                userOpenedCase = true;
            }

            console.log(`[#${requestCode}] The case has been opened, request ended`.magenta);

            await interaction.followUp({ content: `${interaction.user}`, embeds: [exampleEmbed] });

            let log = `[#${requestCode}] \nuser: ${interaction.user.username} (${interaction.user.id}) \ncase: ${caixa} \nitem: ${itemSelecionado.name} \nmode: Web \nrequestedAt: ${requestTime} \nopenedAt: ${new Date().toLocaleString()} \nopenedByUser: ${userOpenedCase} \ndatabaseId: ${codigo16}`;

            fs.writeFileSync("./logs/logCases.txt", `${log}\n\n`, { flag: "a" }, (err) => {
                console.log(err.message);
            });

            addItemInv(interaction.user.id, "941000363459350548", itemSelecionado);
        }
    }
}