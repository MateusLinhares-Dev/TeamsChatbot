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

module.exports = {
    sendIntroCard
};
