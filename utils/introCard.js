const { CardFactory, ActionTypes } = require('botbuilder');

async function sendIntroCard(context) {
    const card = CardFactory.heroCard(
        'Escolha uma opção abaixo:',
        ['https://aka.ms/bf-welcome-card-image'],
        [
            {
                type: ActionTypes.PostBack,
                title: 'Falar com a Sofia',
                value: 'sofia',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Instanciar Workflow',
                value: 'InstanceWorkflow',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Consultar workflow',
                value: 'searchWorkflow',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Consulta de documentos',
                value: 'document',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            },
        ]
    );

    await context.sendActivity({ attachments: [card] });
}

async function sendQuestionCard(context) {
    const card = CardFactory.heroCard(
        'Deseja voltar ao menu inicial ?',
        ['https://aka.ms/bf-welcome-card-image'],
        [
            {
                type: ActionTypes.PostBack,
                title: 'Sim',
                value: 'sim',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Não',
                value: 'nao',
                image: 'https://via.placeholder.com/20/FF0000?text=R',
                imageAltText: 'R'
            }
        ]
    );

    await context.sendActivity({ attachments: [card] });
}
module.exports = {
    sendIntroCard,
    sendQuestionCard
};