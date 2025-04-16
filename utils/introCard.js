const { CardFactory, ActionTypes } = require('botbuilder');


const iconUrl = 'https://cdn-icons-png.flaticon.com/512/545/545705.png';

async function sendIntroCard(context) {
    const card = CardFactory.heroCard(
        '🤖 Olá! Escolha uma das opções abaixo:',
        null,
        [
            {
                type: ActionTypes.MessageBack,
                title: '💬 Falar com a Sofia',
                value: { command: 'sofia' },
                text: 'sofia',
                image: iconUrl
            },
            {
                type: ActionTypes.MessageBack,
                title: '⚙️ Instanciar Workflow',
                value: { command: 'InstanceWorkflow' },
                text: 'InstanceWorkflow',
                image: iconUrl
            },
            {
                type: ActionTypes.MessageBack,
                title: '🔍 Consultar workflow',
                value: { command: 'searchWorkflow' },
                text: 'searchWorkflow',
                image: iconUrl
            },
            {
                type: ActionTypes.MessageBack,
                title: '📄 Consulta de documentos',
                value: { command: 'document' },
                text: 'document',
                image: iconUrl
            },
        ]
    );

    await context.sendActivity({ attachments: [card] });
}

async function generateCardDoc(context, ResponseApi) {
    const cardBody = [
        {
            type: "TextBlock",
            text: "📄 Documentos disponíveis",
            weight: "bolder",
            size: "large",
            wrap: true
        },
        {
            type: "TextBlock",
            text: "Digite o ID do documento que deseja:",
            wrap: true,
            spacing: "small"
        }
    ]
    
    ResponseApi.forEach( (doc, index) => {
        cardBody.push({
            type: "Container",
            style: "emphasis",
            items: [
                {
                    type: "TextBlock",
                    text: `Documento: ${index + 1}`,
                    wrap: true
                },
                {
                    type: "TextBlock",
                    text: `📘 ${doc.nome}`,
                    weight: "bolder",
                    size: "medium",
                    wrap: true
                },
                {
                    type: "TextBlock",
                    text: `👤 Autor: ${doc.autor}`,
                    wrap: true
                },
                {
                    type: "TextBlock",
                    text: `📝 Resumo: ${doc.resumo.length > 200 ? doc.resumo.slice(0,200).concat('...') : doc.resumo}`,
                    wrap: true,
                    spacing: "small"
                },
                {
                    type: "TextBlock",
                    text: `🆔 ID: ${doc.identificador}`,
                    color: "accent",
                    wrap: true,
                    spacing: "small"
                }
            ],
            separator: true,
            spacing: "medium"
        });
    });

    const card = CardFactory.adaptiveCard({
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": cardBody
    });

    await context.sendActivity({ attachments: [card] });
}

async function OptionsFilesDocumentCard(context, docData) {
    let choices = [];

    for (const doc of docData) {
        if (doc.tipo === 'erro') {
            await context.sendActivity(`❌ Erro ao buscar o documento: ${doc.mensagem}`);
            await context.sendActivity('Escolha um documento que realmente exista')
            return false
        } else if (doc.tipo === 'binfile') {
            choices.push({
                title: doc.nome,
                value: doc.nome
            });
        }
    }

    const card = {
        type: "AdaptiveCard",
        body: [
            {
                type: "TextBlock",
                text: "🤖 Este documento tem estes arquivos disponíveis:",
                weight: "bolder",
                size: "medium"
            },
            {
                type: "Input.ChoiceSet",
                id: "selectedFiles",
                style: "expanded",
                isMultiSelect: true,
                choices: choices
            }
        ],
        actions: [
            {
                type: "Action.Submit",
                title: "Selecionar"
            }
        ],
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.3"
    };

    await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
    return true
}

module.exports = {
    sendIntroCard,
    generateCardDoc,
    OptionsFilesDocumentCard
};
