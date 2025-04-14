const { CardFactory, ActionTypes } = require('botbuilder');


const iconUrl = 'https://cdn-icons-png.flaticon.com/512/545/545705.png';

async function sendIntroCard(context) {
    const card = CardFactory.heroCard(
        '🤖 Olá! Escolhe uma das opções abaixo:',
        null,
        [
            {
                type: ActionTypes.PostBack,
                title: '💬 Falar com a Sofia',
                value: 'sofia',
                image: iconUrl,
                imageAltText: 'Chat com Sofia'
            },
            {
                type: ActionTypes.PostBack,
                title: '⚙️ Instanciar Workflow',
                value: 'InstanceWorkflow',
                image: iconUrl,
                imageAltText: 'Instanciar Workflow'
            },
            {
                type: ActionTypes.PostBack,
                title: '🔍 Consultar workflow',
                value: 'searchWorkflow',
                image: iconUrl,
                imageAltText: 'Consultar Workflow'
            },
            {
                type: ActionTypes.PostBack,
                title: '📄 Consulta de documentos',
                value: 'document',
                image: iconUrl,
                imageAltText: 'Consulta de Documentos'
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

module.exports = {
    sendIntroCard,
    generateCardDoc
};
