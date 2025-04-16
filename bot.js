const { ActivityHandler, MessageFactory, TurnContext } = require('botbuilder');
const { sendIntroCard } = require('./utils/introCard');
const CommandDispatcher = require('./commands/dispatcher');

class EchoBot extends ActivityHandler {
    constructor(userState, conversationState) {
        super();
        this.userState = userState;
        this.conversationState = conversationState;

        this.welcomedUserProperty = userState.createProperty('welcomedUser');
        this.opcaoEscolhida = userState.createProperty('opcaoEscolhida');
        this.comandoAtual = userState.createProperty('commandNew');
        this.continueSession = userState.createProperty('DecisionContinueSession');
        this.documentIdSession = userState.createProperty('documentIdSession');
        this.lastInteraction = conversationState.createProperty('lastInteraction'); // ← Timestamp da última interação

        // Message Handler
        this.onMessage(async (context, next) => {
            const text = context.activity.text ? context.activity.text.trim() : '';
            const value = context.activity.value;
            const command = value?.command || text;

            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
            const comandoAtual = await this.comandoAtual.get(context, null);

            this.dispatcher = new CommandDispatcher({
                option: this.opcaoEscolhida,
                commandNew: this.comandoAtual,
                decision: this.continueSession,
                documentId: this.documentIdSession
            });

            if (!didBotWelcomedUser) {
                await context.sendActivity('Olá! Seja bem-vindo! 😄');
                await this.welcomedUserProperty.set(context, true);
                await sendIntroCard(context);
            } else if (!comandoAtual) {
                const handled = await this.dispatcher.dispatch(context, command);
                if (handled) {
                    await this.comandoAtual.set(context, command);
                }
            } else {
                await this.dispatcher.dispatch(context, comandoAtual);
            }

            await next();
        });

        this.onConversationUpdate(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            if (membersAdded) {
                for (let member of membersAdded) {
                    if (member.id !== context.activity.recipient.id) {
                        const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
                        if (!didBotWelcomedUser) {
                            await context.sendActivity('Olá! Seja bem-vindo! 😄');
                            await this.welcomedUserProperty.set(context, true);
                            await sendIntroCard(context);
                        }
                    }
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
