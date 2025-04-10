const { ActivityHandler, MessageFactory } = require('botbuilder');
const { sendIntroCard } = require('./utils/introCard');
const CommandDispatcher = require('./commands/dispatcher');

class EchoBot extends ActivityHandler {
    constructor(userState) {
        super();
        this.userState = userState;
        
        // seta as propriedades a serem armazenadas
        this.welcomedUserProperty = userState.createProperty('welcomedUser');
        this.opcaoEscolhida = userState.createProperty('opcaoEscolhida');
        this.comandoAtual = userState.createProperty('commandNew');
        this.continueSession = userState.createProperty('DecisionContinueSession')

        this.onMessage(async (context, next) => {
            const text = context.activity.text.trim();
            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
            const comandoAtual = await this.comandoAtual.get(context, null);
            const continueSession = await this.continueSession.get(context, false)

            this.dispatcher = new CommandDispatcher({
                option: this.opcaoEscolhida,
                commandNew: this.comandoAtual,
                decision: this.continueSession
            });

            if (!didBotWelcomedUser) {
                await context.sendActivity('Olá! Seja bem-vindo! 😄');
                await this.welcomedUserProperty.set(context, true);
                await sendIntroCard(context);
            } else if (!comandoAtual) {
                const command = text;
                const handled = await this.dispatcher.dispatch(context, command);
                if (handled) {
                    await this.comandoAtual.set(context, command);
                }
            } else {
                await this.dispatcher.dispatch(context, comandoAtual);
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Olá! Seja bem-vindo! 😄';

            for (let cnt in membersAdded) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText));
                    await sendIntroCard(context);
                    await this.welcomedUserProperty.set(context, true);
                }
            }

            await next();
        });
    }

    async run(context) {
        await super.run(context);
        await this.userState.saveChanges(context);
    }
}

module.exports.EchoBot = EchoBot;
